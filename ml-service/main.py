"""FastAPI ML service — 2 familles de modèles pour karatAds.

Deux jeux de modèles servis côte à côte (choix pédagogique côté site) :
- `rf`     : Random Forest      (models/rf/)     — défaut
- `linear` : régression linéaire (models/linear/) — Tweedie + Logistic

Endpoints :
- GET  /health        : statut + versions + modèles chargés
- POST /predict/batch : prédit prix, taux conversion, proba objectif sur un batch
                        `model_type` ("rf"|"linear", défaut "rf") choisit la famille.

Auth : header `Authorization: Bearer ${ML_API_TOKEN}` (skip si la variable n'est
pas définie — pratique en dev local).
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, List, Literal

import joblib
import numpy as np
import pandas as pd
import sklearn
from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
MODELS_DIR = ROOT / "models"
MODEL_TYPES = ("rf", "linear")

CAT_COLS = [
    "Secteur_Entreprise",
    "Type_Entreprise_Prive_Public",
    "Periode",
    "Media_Numerique",
    "Type_Pub_Normalise",
    "Cible",
    "Niveau_Confiance",
    "Retargeting",
]
NUM_COLS = [
    "Duree_Campagne_Mois",
    "Objectif_Audience_K_Vues",
    "Score_Historique_Marque",
    "Nb_Plateformes",
    "Budget_Cible_K",
    "Nb_Visuels_Crees",
]
PRIX_COLS = NUM_COLS + CAT_COLS
CONV_COLS = NUM_COLS + ["Prix_Euros"] + CAT_COLS
OBJ_COLS = NUM_COLS + ["Prix_Euros"] + CAT_COLS


class MlConfigInput(BaseModel):
    Secteur_Entreprise: str
    Type_Entreprise_Prive_Public: str
    Periode: str
    Media_Numerique: str
    Type_Pub_Normalise: str
    Cible: str
    Niveau_Confiance: str
    Retargeting: str
    Duree_Campagne_Mois: float
    Objectif_Audience_K_Vues: float
    Score_Historique_Marque: float
    Nb_Plateformes: float
    Budget_Cible_K: float
    Nb_Visuels_Crees: float


class BatchRequest(BaseModel):
    configs: List[MlConfigInput] = Field(min_length=1, max_length=500)
    model_type: Literal["rf", "linear"] = "rf"


class Prediction(BaseModel):
    prix: float
    prixLo: float
    prixHi: float
    tauxConversion: float
    tauxLo: float
    tauxHi: float
    pObjectif: float
    pObjectifConfiance: float


class Meta(BaseModel):
    modelType: str
    metrics: dict


class BatchResponse(BaseModel):
    predictions: List[Prediction]
    meta: Meta


class HealthResponse(BaseModel):
    status: str
    sklearnVersion: str
    modelsLoaded: List[str]


app = FastAPI(title="karatAds ML", version="2.0.0")

# MODELS[type] = {"prix":pipeline, "conv":pipeline, "obj":pipeline}
MODELS: Dict[str, Dict[str, object]] = {}
# METRICS[type] = {"prix":{...}, "taux":{...}, "objectif":{...}}
METRICS: Dict[str, dict] = {}


def _load_metrics(name: str, key: str) -> dict:
    path = ROOT / name
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8")).get(key, {})
    except (json.JSONDecodeError, OSError):
        return {}


@app.on_event("startup")
def load_models() -> None:
    for mt in MODEL_TYPES:
        d = MODELS_DIR / mt
        if not (d / "model_prix.pkl").exists():
            continue
        MODELS[mt] = {
            "prix": joblib.load(d / "model_prix.pkl"),
            "conv": joblib.load(d / "model_conversion.pkl"),
            "obj": joblib.load(d / "model_objectif.pkl"),
        }
    METRICS["rf"] = _load_metrics("metrics_rf.json", "rf")
    METRICS["linear"] = _load_metrics("metrics_linear.json", "linear")
    print(f"✅ modèles chargés {list(MODELS)} (sklearn {sklearn.__version__})")


def auth(authorization: str | None = Header(default=None)) -> None:
    token = os.environ.get("ML_API_TOKEN")
    if not token:
        return
    if authorization != f"Bearer {token}":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or missing bearer token",
        )


def _tree_predictions(pipeline, X: pd.DataFrame) -> np.ndarray:
    """Retourne (n_trees, n_rows) des prédictions individuelles des arbres."""
    Xprep = pipeline.named_steps["preprocessor"].transform(X)
    rf = pipeline.named_steps["rf"]
    return np.array([tree.predict(Xprep) for tree in rf.estimators_])


def _tree_proba(pipeline, X: pd.DataFrame) -> np.ndarray:
    """Retourne (n_trees, n_rows) des probas P(classe=1) des arbres."""
    Xprep = pipeline.named_steps["preprocessor"].transform(X)
    rf = pipeline.named_steps["rf"]
    return np.array([tree.predict_proba(Xprep)[:, 1] for tree in rf.estimators_])


def _predict_rf(bundle: Dict[str, object], df: pd.DataFrame) -> List[Prediction]:
    """Forêt aléatoire : intervalles via la dispersion des arbres."""
    prix_trees = _tree_predictions(bundle["prix"], df[PRIX_COLS])
    prix = prix_trees.mean(axis=0)
    prix_std = prix_trees.std(axis=0)
    df = df.assign(Prix_Euros=prix)

    conv_trees = _tree_predictions(bundle["conv"], df[CONV_COLS])
    taux = np.clip(conv_trees.mean(axis=0), 0.0, 1.0)
    taux_std = conv_trees.std(axis=0)

    proba_trees = _tree_proba(bundle["obj"], df[OBJ_COLS])
    p_mean = proba_trees.mean(axis=0)
    p_std = proba_trees.std(axis=0)
    p_conf = np.clip(1.0 - 2.0 * p_std, 0.0, 1.0)

    return _assemble(prix, prix - prix_std, prix + prix_std, taux, taux - taux_std, taux + taux_std, p_mean, p_conf)


def _predict_linear(bundle: Dict[str, object], df: pd.DataFrame, metrics: dict) -> List[Prediction]:
    """Régression linéaire : intervalles via σ résiduel (régression) et distance à
    0.5 (logistique). σ vient des métriques d'entraînement (constant par sortie)."""
    sigma_prix = float(metrics.get("prix", {}).get("sigma", 0.0))
    sigma_taux = float(metrics.get("taux", {}).get("sigma", 0.0))

    prix = np.asarray(bundle["prix"].predict(df[PRIX_COLS]), dtype=float)
    df = df.assign(Prix_Euros=prix)

    taux = np.clip(np.asarray(bundle["conv"].predict(df[CONV_COLS]), dtype=float), 0.0, 1.0)

    p_mean = np.asarray(bundle["obj"].predict_proba(df[OBJ_COLS])[:, 1], dtype=float)
    p_conf = np.clip(2.0 * np.abs(p_mean - 0.5), 0.0, 1.0)

    return _assemble(
        prix, prix - sigma_prix, prix + sigma_prix,
        taux, taux - sigma_taux, taux + sigma_taux,
        p_mean, p_conf,
    )


def _assemble(prix, prix_lo, prix_hi, taux, taux_lo, taux_hi, p_mean, p_conf) -> List[Prediction]:
    """Construit les Prediction en bornant les intervalles dans leurs domaines."""
    out: List[Prediction] = []
    for i in range(len(prix)):
        out.append(
            Prediction(
                prix=float(prix[i]),
                prixLo=float(max(0.0, prix_lo[i])),
                prixHi=float(prix_hi[i]),
                tauxConversion=float(taux[i]),
                tauxLo=float(max(0.0, taux_lo[i])),
                tauxHi=float(min(1.0, taux_hi[i])),
                pObjectif=float(p_mean[i]),
                pObjectifConfiance=float(p_conf[i]),
            )
        )
    return out


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    loaded = [f"{mt}/{name}" for mt in MODELS for name in MODELS[mt]]
    return HealthResponse(
        status="ok",
        sklearnVersion=sklearn.__version__,
        modelsLoaded=loaded,
    )


@app.post("/predict/batch", response_model=BatchResponse, dependencies=[Depends(auth)])
def predict_batch(req: BatchRequest) -> BatchResponse:
    bundle = MODELS.get(req.model_type)
    if bundle is None:
        raise HTTPException(status_code=503, detail=f"models not loaded: {req.model_type}")

    df = pd.DataFrame([c.model_dump() for c in req.configs])
    if req.model_type == "linear":
        preds = _predict_linear(bundle, df, METRICS.get("linear", {}))
    else:
        preds = _predict_rf(bundle, df)

    return BatchResponse(
        predictions=preds,
        meta=Meta(modelType=req.model_type, metrics=METRICS.get(req.model_type, {})),
    )

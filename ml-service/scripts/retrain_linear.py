"""Entraîne les 3 modèles LINÉAIRES (pédagogiques) sur le même dataset propre.

Pendant du `retrain.py` (Random Forest), même recette de features / split, mais
des estimateurs linéaires — réplique du notebook Colab dont les `.pkl` ne se
chargeaient plus (sérialisés sous sklearn 1.6.1, service en 1.9.0).

Recette (figée dans le handoff) :
- Prix     : TweedieRegressor(power=0, link="log", alpha=1e-3) + StandardScaler + OHE
- Taux     : idem, avec Prix_Euros (réel) en feature numérique
- Objectif : LogisticRegression(max_iter=2000) + StandardScaler + OHE
- Étape finale nommée "model" (RF = "rf") — le service route dessus.

Sortie : ml-service/models/linear/{model_prix,model_conversion,model_objectif}.pkl
         ml-service/metrics_linear.json
            = {"linear": {prix:{r2,mae,rmse,sigma,r2_cv},
                          taux:{r2,mae,rmse,sigma,r2_cv},
                          objectif:{auc,accuracy,auc_cv}}}

Usage : depuis ml-service/, exécuter
    ../../../Downloads/ML-DATA/venv/bin/python scripts/retrain_linear.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression, TweedieRegressor
from sklearn.metrics import (
    accuracy_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    KFold,
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

ROOT = Path(__file__).resolve().parent.parent
DATASET = ROOT.parent / "data" / "dataset ml final.xlsx"
MODELS_DIR = ROOT / "models" / "linear"

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


def build_linear_pipeline(cat_cols: list[str], num_cols: list[str], task: str) -> Pipeline:
    """Préprocesseur commun (scale num + OHE cat) puis estimateur linéaire."""
    preprocessor = ColumnTransformer(
        [
            ("num", StandardScaler(), num_cols),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                cat_cols,
            ),
        ]
    )
    if task == "regression":
        model = TweedieRegressor(power=0, link="log", alpha=1e-3, max_iter=10000)
    else:
        model = LogisticRegression(max_iter=2000)
    return Pipeline([("preprocessor", preprocessor), ("model", model)])


def fix_encoding(df: pd.DataFrame) -> pd.DataFrame:
    """Corrige les valeurs catégorielles encodées en mojibake UTF-8."""
    mapping = {"Sant√©": "Santé"}
    for col in CAT_COLS:
        if col in df.columns:
            df[col] = df[col].replace(mapping)
    return df


def r4(x: float) -> float:
    return round(float(x), 4)


def reg_metrics(pipe: Pipeline, X, y, cv) -> dict:
    """R²/MAE/RMSE/sigma sur le test + R² CV (5-fold)."""
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=RANDOM_STATE)
    cv_scores = cross_val_score(pipe, X, y, cv=cv, scoring="r2")
    pipe.fit(Xtr, ytr)
    pred = pipe.predict(Xte)
    resid = yte.to_numpy() - pred
    return {
        "r2": r4(r2_score(yte, pred)),
        "mae": r4(mean_absolute_error(yte, pred)),
        "rmse": r4(np.sqrt(mean_squared_error(yte, pred))),
        "sigma": r4(np.std(resid)),
        "r2_cv": r4(cv_scores.mean()),
    }


def export(pipe: Pipeline, X, y, name: str) -> None:
    """Refit sur tout le dataset puis sérialise."""
    pipe.fit(X, y)
    out = MODELS_DIR / f"model_{name}.pkl"
    joblib.dump(pipe, out)
    print(f"✅ {out.relative_to(ROOT)}")


def main() -> int:
    if not DATASET.exists():
        print(f"❌ Dataset introuvable: {DATASET}", file=sys.stderr)
        return 1

    print(f"📥 Lecture {DATASET.name}")
    df = pd.read_excel(DATASET, engine="openpyxl")
    df = fix_encoding(df)
    assert "Santé" in df["Secteur_Entreprise"].unique(), "encoding fix raté"
    print(f"   {df.shape[0]} lignes × {df.shape[1]} colonnes")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    kf = KFold(5, shuffle=True, random_state=RANDOM_STATE)
    skf = StratifiedKFold(5, shuffle=True, random_state=RANDOM_STATE)
    metrics: dict = {}

    # === Modèle 1 : Prix_Euros (régression linéaire)
    print("\n=== Modèle PRIX (linéaire) ===")
    X = df[NUM_COLS + CAT_COLS]
    y = df["Prix_Euros"]
    m = reg_metrics(build_linear_pipeline(CAT_COLS, NUM_COLS, "regression"), X, y, kf)
    print(f"   R²={m['r2']} MAE={m['mae']} RMSE={m['rmse']} σ={m['sigma']} R²cv={m['r2_cv']}")
    metrics["prix"] = m
    export(build_linear_pipeline(CAT_COLS, NUM_COLS, "regression"), X, y, "prix")

    # === Modèle 2 : Taux_Conversion (régression, utilise Prix_Euros réel)
    print("\n=== Modèle CONVERSION (linéaire) ===")
    num_conv = NUM_COLS + ["Prix_Euros"]
    X = df[num_conv + CAT_COLS]
    y = df["Taux_Conversion"]
    m = reg_metrics(build_linear_pipeline(CAT_COLS, num_conv, "regression"), X, y, kf)
    print(f"   R²={m['r2']} MAE={m['mae']} RMSE={m['rmse']} σ={m['sigma']} R²cv={m['r2_cv']}")
    metrics["taux"] = m
    export(build_linear_pipeline(CAT_COLS, num_conv, "regression"), X, y, "conversion")

    # === Modèle 3 : Objectif_Atteint (régression logistique)
    print("\n=== Modèle OBJECTIF (linéaire) ===")
    num_obj = NUM_COLS + ["Prix_Euros"]
    X = df[num_obj + CAT_COLS]
    y = (df["Objectif_Atteint"] == "Oui").astype(int)
    Xtr, Xte, ytr, yte = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    pipe = build_linear_pipeline(CAT_COLS, num_obj, "classification")
    auc_cv = cross_val_score(pipe, X, y, cv=skf, scoring="roc_auc").mean()
    pipe.fit(Xtr, ytr)
    proba = pipe.predict_proba(Xte)[:, 1]
    pred = pipe.predict(Xte)
    m = {
        "auc": r4(roc_auc_score(yte, proba)),
        "accuracy": r4(accuracy_score(yte, pred)),
        "auc_cv": r4(auc_cv),
    }
    print(f"   AUC={m['auc']} acc={m['accuracy']} AUCcv={m['auc_cv']}")
    metrics["objectif"] = m
    export(build_linear_pipeline(CAT_COLS, num_obj, "classification"), X, y, "objectif")

    out = ROOT / "metrics_linear.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump({"linear": metrics}, f, indent=2, ensure_ascii=False)
    print(f"\n✅ {out.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

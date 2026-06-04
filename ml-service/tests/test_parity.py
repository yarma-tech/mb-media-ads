"""Test de parité : les 3 modèles servis doivent retourner exactement les mêmes
valeurs que le notebook (capturées dans tests/fixtures/parity_targets.json par
`scripts/retrain.py`). Tolérance : 1e-4."""
from __future__ import annotations

import json
from pathlib import Path

import joblib
import pandas as pd
import pytest

ROOT = Path(__file__).resolve().parent.parent
FIXTURE = ROOT / "tests" / "fixtures" / "parity_targets.json"
MODELS_DIR = ROOT / "models" / "rf"

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


@pytest.fixture(scope="module")
def fixture():
    if not FIXTURE.exists():
        pytest.skip(f"fixture absente : {FIXTURE} — lance scripts/retrain.py")
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def models():
    return {
        "prix": joblib.load(MODELS_DIR / "model_prix.pkl"),
        "conv": joblib.load(MODELS_DIR / "model_conversion.pkl"),
        "obj": joblib.load(MODELS_DIR / "model_objectif.pkl"),
    }


def test_encoding_propre(models):
    """Les modèles doivent connaître "Santé" (et pas "Sant√©")."""
    cats = models["prix"].named_steps["preprocessor"].named_transformers_["cat"].categories_
    secteurs = cats[0].tolist()
    assert "Santé" in secteurs, f"Santé absent des catégories : {secteurs}"
    assert "Sant√©" not in secteurs, "mojibake encore présent"


def test_parity_canonical_case(fixture, models):
    """Cas canonique du notebook (cell 24) doit donner les mêmes valeurs."""
    base = fixture["input"]
    expected = fixture["expected"]
    tol = fixture["tolerance"]

    prix = float(models["prix"].predict(pd.DataFrame([base]))[0])
    assert abs(prix - expected["prix"]) < tol, f"prix : {prix} vs {expected['prix']}"

    base_conv = {**base, "Prix_Euros": prix}
    taux = float(models["conv"].predict(pd.DataFrame([base_conv]))[0])
    assert abs(taux - expected["taux_conversion"]) < tol, (
        f"taux : {taux} vs {expected['taux_conversion']}"
    )

    p_obj = float(models["obj"].predict_proba(pd.DataFrame([base_conv]))[0][1])
    assert abs(p_obj - expected["p_objectif"]) < tol, (
        f"p_objectif : {p_obj} vs {expected['p_objectif']}"
    )


def test_predict_unknown_categorical(models):
    """OneHotEncoder(handle_unknown='ignore') doit accepter une valeur inconnue."""
    base = {
        "Secteur_Entreprise": "Tech",
        "Type_Entreprise_Prive_Public": "Privé",
        "Periode": "Black Friday",
        "Duree_Campagne_Mois": 1.0,
        "Objectif_Audience_K_Vues": 400,
        "Score_Historique_Marque": 5.0,
        "Media_Numerique": "Google Ads",
        "Type_Pub_Normalise": "Placement de produit",
        "Cible": "Inconnu_Nouveau_Public",  # inconnu
        "Niveau_Confiance": "Moyen",
        "Nb_Plateformes": 1,
        "Budget_Cible_K": 50.0,
        "Nb_Visuels_Crees": 5,
        "Retargeting": "Non",
    }
    prix = models["prix"].predict(pd.DataFrame([base]))[0]
    assert prix > 0

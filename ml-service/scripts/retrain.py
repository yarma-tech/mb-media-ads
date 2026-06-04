"""Réentraîne les 3 modèles RF sur le dataset propre.

Corrige le mojibake "Sant√©" → "Santé" sur Secteur_Entreprise, puis applique
exactement la même recette d'entraînement que `02_random_forest_3_modeles.ipynb`
(cells 9, 11, 13, 16, 19, 22).

Sortie : ml-service/models/{model_prix,model_conversion,model_objectif}.pkl
         ml-service/{schema_prix,schema_conversion,schema_objectif}.json
         ml-service/tests/fixtures/parity_targets.json (valeurs attendues du cas
         canonique de la cell 24, pour le test de parité).

Usage : depuis ml-service/, exécuter
    ../../../Downloads/ML-DATA/venv/bin/python scripts/retrain.py
ou avec un venv local équivalent (sklearn==1.8.0, pandas, numpy, joblib).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
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
from sklearn.preprocessing import OneHotEncoder

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

ROOT = Path(__file__).resolve().parent.parent
DATASET = ROOT.parent / "data" / "dataset ml final.xlsx"
MODELS_DIR = ROOT / "models" / "rf"
FIXTURES_DIR = ROOT / "tests" / "fixtures"


def r4(x: float) -> float:
    return round(float(x), 4)

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


def build_rf_pipeline(cat_cols: list[str], num_cols: list[str], task: str) -> Pipeline:
    preprocessor = ColumnTransformer(
        [
            ("num", "passthrough", num_cols),
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                cat_cols,
            ),
        ]
    )
    if task == "regression":
        model = RandomForestRegressor(
            n_estimators=300,
            max_depth=None,
            min_samples_leaf=2,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )
    else:
        model = RandomForestClassifier(
            n_estimators=300,
            max_depth=None,
            min_samples_leaf=2,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )
    return Pipeline([("preprocessor", preprocessor), ("rf", model)])


def fix_encoding(df: pd.DataFrame) -> pd.DataFrame:
    """Corrige les valeurs catégorielles encodées en mojibake UTF-8."""
    mapping = {"Sant√©": "Santé"}
    for col in CAT_COLS:
        if col in df.columns:
            df[col] = df[col].replace(mapping)
    return df


def export_model(
    pipeline: Pipeline,
    X_full: pd.DataFrame,
    y_full: pd.Series,
    cat_cols: list[str],
    num_cols: list[str],
    df: pd.DataFrame,
    name: str,
) -> Pipeline:
    pipeline.fit(X_full, y_full)
    out = MODELS_DIR / f"model_{name}.pkl"
    joblib.dump(pipeline, out)
    schema = {
        "numeric_features": num_cols,
        "categorical_features": cat_cols,
        "categorical_values": {
            c: sorted(df[c].dropna().unique().tolist()) for c in cat_cols
        },
    }
    with open(ROOT / f"schema_{name}.json", "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)
    print(f"✅ {out.name} + schema_{name}.json")
    return pipeline


def main() -> int:
    if not DATASET.exists():
        print(f"❌ Dataset introuvable: {DATASET}", file=sys.stderr)
        return 1

    print(f"📥 Lecture {DATASET.name}")
    df = pd.read_excel(DATASET, engine="openpyxl")
    df = fix_encoding(df)
    secteurs = sorted(df["Secteur_Entreprise"].dropna().unique().tolist())
    print(f"   Secteur_Entreprise après fix : {secteurs}")
    assert "Santé" in secteurs, "encoding fix raté"
    assert "Sant√©" not in secteurs, "mojibake encore présent"
    print(f"   {df.shape[0]} lignes × {df.shape[1]} colonnes")

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
    metrics: dict = {}

    # === Modèle 1 : Prix_Euros (régression)
    print("\n=== Modèle PRIX ===")
    feat_num_prix = NUM_COLS
    feat_cat_prix = CAT_COLS
    X = df[feat_num_prix + feat_cat_prix]
    y = df["Prix_Euros"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=RANDOM_STATE)
    pipe = build_rf_pipeline(feat_cat_prix, feat_num_prix, task="regression")
    cv = cross_val_score(
        pipe,
        X,
        y,
        cv=KFold(5, shuffle=True, random_state=RANDOM_STATE),
        scoring="r2",
    )
    print(f"R² CV (5-fold) : {cv.mean():.3f} ± {cv.std():.3f}")
    pipe.fit(Xtr, ytr)
    pred = pipe.predict(Xte)
    print(f"R² test   : {r2_score(yte, pred):.3f}")
    print(f"RMSE test : {np.sqrt(mean_squared_error(yte, pred)):.2f} €")
    print(f"MAE test  : {mean_absolute_error(yte, pred):.2f} €")
    metrics["prix"] = {
        "r2": r4(r2_score(yte, pred)),
        "mae": r4(mean_absolute_error(yte, pred)),
        "rmse": r4(np.sqrt(mean_squared_error(yte, pred))),
        "sigma": r4(np.std(yte.to_numpy() - pred)),
        "r2_cv": r4(cv.mean()),
    }
    m_prix = export_model(pipe, X, y, feat_cat_prix, feat_num_prix, df, "prix")

    # === Modèle 2 : Taux_Conversion (régression, utilise Prix_Euros)
    print("\n=== Modèle CONVERSION ===")
    feat_num_conv = NUM_COLS + ["Prix_Euros"]
    feat_cat_conv = CAT_COLS
    X = df[feat_num_conv + feat_cat_conv]
    y = df["Taux_Conversion"]
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=RANDOM_STATE)
    pipe = build_rf_pipeline(feat_cat_conv, feat_num_conv, task="regression")
    cv = cross_val_score(
        pipe,
        X,
        y,
        cv=KFold(5, shuffle=True, random_state=RANDOM_STATE),
        scoring="r2",
    )
    print(f"R² CV (5-fold) : {cv.mean():.3f} ± {cv.std():.3f}")
    pipe.fit(Xtr, ytr)
    pred = pipe.predict(Xte)
    print(f"R² test   : {r2_score(yte, pred):.3f}")
    print(f"RMSE test : {np.sqrt(mean_squared_error(yte, pred)):.4f}")
    print(f"MAE test  : {mean_absolute_error(yte, pred):.4f}")
    metrics["taux"] = {
        "r2": r4(r2_score(yte, pred)),
        "mae": r4(mean_absolute_error(yte, pred)),
        "rmse": r4(np.sqrt(mean_squared_error(yte, pred))),
        "sigma": r4(np.std(yte.to_numpy() - pred)),
        "r2_cv": r4(cv.mean()),
    }
    m_conv = export_model(pipe, X, y, feat_cat_conv, feat_num_conv, df, "conversion")

    # === Modèle 3 : Objectif_Atteint (classification binaire)
    print("\n=== Modèle OBJECTIF ===")
    feat_num_obj = NUM_COLS + ["Prix_Euros"]
    feat_cat_obj = CAT_COLS
    X = df[feat_num_obj + feat_cat_obj]
    y = (df["Objectif_Atteint"] == "Oui").astype(int)
    Xtr, Xte, ytr, yte = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    pipe = build_rf_pipeline(feat_cat_obj, feat_num_obj, task="classification")
    cv = cross_val_score(
        pipe,
        X,
        y,
        cv=StratifiedKFold(5, shuffle=True, random_state=RANDOM_STATE),
        scoring="roc_auc",
    )
    print(f"AUC CV (5-fold) : {cv.mean():.3f} ± {cv.std():.3f}")
    pipe.fit(Xtr, ytr)
    proba = pipe.predict_proba(Xte)[:, 1]
    pred = pipe.predict(Xte)
    print(f"AUC test      : {roc_auc_score(yte, proba):.3f}")
    print(f"Accuracy test : {accuracy_score(yte, pred):.3f}")
    metrics["objectif"] = {
        "auc": r4(roc_auc_score(yte, proba)),
        "accuracy": r4(accuracy_score(yte, pred)),
        "auc_cv": r4(cv.mean()),
    }
    m_obj = export_model(pipe, X, y, feat_cat_obj, feat_num_obj, df, "objectif")

    # === Métriques RF (mêmes clés que metrics_linear.json) pour la page résultat
    out_metrics = ROOT / "metrics_rf.json"
    with open(out_metrics, "w", encoding="utf-8") as f:
        json.dump({"rf": metrics}, f, indent=2, ensure_ascii=False)
    print(f"✅ {out_metrics.name}")

    # === Capture parity fixture (cell 24 du notebook) — corrigé "Élevé" -> bien encodé
    print("\n=== Capture parity fixture ===")
    base = {
        "Secteur_Entreprise": "Tech",
        "Type_Entreprise_Prive_Public": "Privé",
        "Periode": "Black Friday",
        "Duree_Campagne_Mois": 1.0,
        "Objectif_Audience_K_Vues": 400,
        "Score_Historique_Marque": 7.5,
        "Media_Numerique": "Google Ads",
        "Type_Pub_Normalise": "Placement de produit",
        "Cible": "Professionnel",
        "Niveau_Confiance": "Élevé",
        "Nb_Plateformes": 3,
        "Budget_Cible_K": 150.0,
        "Nb_Visuels_Crees": 10,
        "Retargeting": "Oui",
    }
    prix_pred = float(m_prix.predict(pd.DataFrame([base]))[0])
    base_conv = {**base, "Prix_Euros": prix_pred}
    conv_pred = float(m_conv.predict(pd.DataFrame([base_conv]))[0])
    proba_obj = float(m_obj.predict_proba(pd.DataFrame([base_conv]))[0][1])

    print(f"💰 Prix     : {prix_pred:,.2f} €")
    print(f"📈 Taux     : {conv_pred:.4f}")
    print(f"🎯 P(objectif): {proba_obj:.4f}")

    fixture = {
        "input": base,
        "expected": {
            "prix": prix_pred,
            "taux_conversion": conv_pred,
            "p_objectif": proba_obj,
        },
        "tolerance": 1e-4,
    }
    with open(FIXTURES_DIR / "parity_targets.json", "w", encoding="utf-8") as f:
        json.dump(fixture, f, indent=2, ensure_ascii=False)
    print(f"✅ {FIXTURES_DIR / 'parity_targets.json'}")

    return 0


if __name__ == "__main__":
    sys.exit(main())

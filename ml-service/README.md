# karatAds ML — micro-service d'inférence

Service FastAPI servant 3 modèles Random Forest entraînés sur le dataset
publicitaire (`/data/dataset ml final.xlsx`) :

- `model_prix.pkl` : régression Prix_Euros
- `model_conversion.pkl` : régression Taux_Conversion (utilise Prix_Euros prédit)
- `model_objectif.pkl` : classification binaire Objectif_Atteint (utilise Prix_Euros prédit)

## Endpoints

- `GET /health` → `{status, sklearnVersion, modelsLoaded}`
- `POST /predict/batch` → `{predictions: [{prix, prixLo, prixHi, tauxConversion, tauxLo, tauxHi, pObjectif, pObjectifConfiance}]}`

L'intervalle `lo`/`hi` est dérivé de l'écart-type des prédictions des 300 arbres
individuels du Random Forest.

## Auth

Header `Authorization: Bearer ${ML_API_TOKEN}` sur `/predict/batch`. Si
`ML_API_TOKEN` n'est pas défini côté service (cas dev local), l'auth est
désactivée.

## Dev local

```bash
cd ml-service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

## Tests

```bash
pytest tests/
```

Le test `test_parity.py` compare les prédictions avec les valeurs capturées
dans `tests/fixtures/parity_targets.json` (générées par `scripts/retrain.py`).

## Ré-entraîner les modèles

```bash
python scripts/retrain.py
```

Sortie : `models/*.pkl`, `schema_*.json`, `tests/fixtures/parity_targets.json`.

## Déploiement Fly.io

```bash
flyctl launch --no-deploy   # 1ère fois seulement
flyctl secrets set ML_API_TOKEN=<token>
flyctl deploy
```

Région : `cdg` (Paris). Machine : `shared-cpu-1x@512mb`.
`min_machines_running=1` pour éliminer le cold-start (~5 €/mois).

# ADR 0003 — Micro-service Python pour les modèles Random Forest

Date : 2026-06-02
Statut : Accepté · Supersède [ADR 0001](./0001-scoring-ts-modeles-simples.md)

## Contexte

L'ADR 0001 retenait un scoring log-linéaire en TypeScript embarqué dans Next.js,
sur la base de coefficients OLS exportés. Le motif était la simplicité de déploiement
et la cohérence avec la nature synthétique des données (ADR 0002).

Trois modèles Random Forest entraînés sur le dataset réel sont maintenant disponibles
(`/data/dataset ml final.xlsx`) :

- `model_prix.pkl` — régression `Prix_Euros` (R² test ≈ 0,93)
- `model_conversion.pkl` — régression `Taux_Conversion` (R² test ≈ 0,60)
- `model_objectif.pkl` — classification binaire `Objectif_Atteint` (AUC ≈ 0,95)

Les Random Forest capturent des interactions non-linéaires (Cible × Média, Période ×
Plateforme) absentes du log-linéaire. Le scoring TS hardcodé n'est plus le bon
artefact : il sous-utilise le dataset et fige la modélisation dans le code.

## Décision

**On déploie un micro-service Python (FastAPI) sur Fly.io qui sert les 3 modèles
`scikit-learn`. Next.js l'appelle via `lib/ml-client.ts`.**

- Hébergement : Fly.io région `cdg`, machine `shared-cpu-1x@512mb`, `min_machines_running=1`
  pour éliminer le cold-start (~5 €/mois).
- Endpoint unique `POST /predict/batch` : Next.js envoie les 120 configurations
  du mode auto en UNE requête ; le service prédit prix → taux conversion → proba
  objectif en pipeline.
- Auth : `Authorization: Bearer ${ML_API_TOKEN}` (secret partagé Vercel ↔ Fly).
- Modèles versionnés via Git LFS dans `ml-service/models/`.
- `scikit-learn==1.9.0` pin exact pour éviter la dérive de prédiction.

## Conséquences

**Positives**
- Aucune réécriture des modèles (pas de drift Python → TS), parité exacte.
- Le dataset peut être re-entraîné indépendamment du front (`scripts/retrain.py` →
  `flyctl deploy`).
- Le modèle d'objectif (classification) ajoute une métrique tertiaire à l'UI
  (probabilité d'atteinte).

**Négatives**
- Un service externe à monitorer ; circuit-breaker côté `ml-client.ts` indispensable.
- Coût opérationnel ~5 €/mois.
- Stack mixte Node/Python : un dev front pur a une CI/CD légèrement plus complexe.

**Mitigations**
- Tests de parité (`ml-service/tests/test_parity.py`) avec valeurs cible capturées
  par `scripts/retrain.py` — assurent qu'un re-déploiement ne dérive pas.
- `ML_FALLBACK_LOCAL` (variable d'env) réservé pour brancher un scoring de secours
  si le service ML est injoignable (non implémenté à date).

## Migration des features

Le formulaire ne collecte pas tous les features attendus par les modèles
(`Score_Historique_Marque`, `Niveau_Confiance`, `Retargeting`, `Nb_Visuels_Crees`).

- `Score_Historique_Marque` : stocké dans `profiles.score_historique_marque`
  (migration `20260602120000_score_historique_marque.sql`), défaut 5.0.
- Les autres : défauts neutres côté serveur (`lib/feature-mapping.ts`).

## Encodage UTF-8

L'Excel source contenait `"Sant√©"` (mojibake) pour Secteur_Entreprise. Le script
`ml-service/scripts/retrain.py` corrige ce bug avant entraînement.

# Scoring ML réimplémenté en TypeScript, avec modèles volontairement simples

Les modèles (prix, audience, conversion, reach, lead-score) sont entraînés sur Altair AI Studio, mais Altair n'exporte que du PMML (types de modèles limités, pas d'ONNX confirmé) et PMML est mal supporté en JavaScript. Pour conserver une stack pure Next.js + Supabase **sans service de scoring Python/Java**, on contraint volontairement les modèles à des formes simples (régression linéaire/logistique, arbre de décision) dont on réimplémente le scoring en TypeScript à partir des coefficients exportés.

## Conséquences

- Pas de modèles complexes (forêts, gradient boosting, réseaux) tant qu'on reste sur ce choix : leur scoring serait trop lourd/fragile à réécrire fidèlement en TS.
- Si un modèle complexe devient nécessaire, il faudra introduire un service de scoring dédié (FastAPI + PMML4S/pypmml, ou endpoint temps réel Altair AI Hub) — ce qui rouvre cette décision.
- Bénéfice : intervalles de confiance triviaux à dériver (régression) et probabilités directes (classification logistique), ce qui alimente l'affichage du « niveau de confiance ».

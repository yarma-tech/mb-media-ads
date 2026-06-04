-- Karata Ads — score historique de marque (feature ML).
--
-- Le modèle Random Forest utilise cette feature (0..10) pour estimer le prix,
-- le taux de conversion et la probabilité d'atteinte de l'objectif. Défaut 5.0
-- (médiane neutre) tant qu'aucune UI d'édition n'existe ; un admin peut le
-- mettre à jour manuellement.

alter table profiles
  add column if not exists score_historique_marque numeric not null default 5.0
  check (score_historique_marque >= 0 and score_historique_marque <= 10);

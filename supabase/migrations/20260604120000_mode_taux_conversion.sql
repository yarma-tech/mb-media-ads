-- Mode « Taux de conversion » (Conversion seulement) : viser un taux cible au
-- moindre coût. Ajoute la valeur 'taux' au mode + une colonne taux_cible (0..1).

-- 1) Le mode accepte désormais 'taux' (check inline auto-nommé demandes_mode_check).
alter table demandes drop constraint if exists demandes_mode_check;
alter table demandes add constraint demandes_mode_check
  check (mode in ('budget', 'goal', 'taux'));

-- 2) Cible de taux de conversion, fraction dans ]0, 1].
alter table demandes add column if not exists taux_cible numeric
  check (taux_cible is null or (taux_cible > 0 and taux_cible <= 1));

-- 3) Invariant des modes : chaque mode fournit sa contrainte.
alter table demandes drop constraint if exists demandes_mode_contrainte;
alter table demandes add constraint demandes_mode_contrainte check (
  (mode = 'budget' and budget is not null) or
  (mode = 'goal'   and objectif_valeur is not null) or
  (mode = 'taux'   and taux_cible is not null)
);

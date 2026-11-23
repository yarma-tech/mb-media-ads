# PLAN - Nettoyage des restes Achat média

Branche : `chore/rangement-projets`. Le module Achat média a été supprimé au commit `e90d22f`. Il reste du code mort qui ne servait qu'à lui.

## Objectifs

1. Supprimer de `app/globals.css` les styles utilisés uniquement par les pages Achat média supprimées.
2. Supprimer `getProfile` et le type `Profile` (dont `is_admin`) de `lib/shared/supabase-server.ts`, plus aucun appelant.
3. Aucun changement visuel ni fonctionnel sur Studio, Social Ads, Decks, connexion, inscription.

## Fichiers à toucher (et uniquement ceux-là)

- `app/globals.css`
- `lib/shared/supabase-server.ts`

## Détail

### 1. `app/globals.css`

Classes mortes à retirer. Elles ne sont plus référencées nulle part dans `app/` ni `lib/`, et étaient utilisées par le code Achat média supprimé :

```
actions-cell admin-section answer-eyebrow answer-hero answer-label answer-precision
answer-price badge-danger badge-neutral badge-success badge-warn big btn-sm
demande-summary ds-meta ds-name field-error fieldset-legend metric-sec metrics-sec
ms-label ms-meta ms-value muted notice-warn num p-cost p-main p-tags pipeline-stat
prec-glyph prec-pill ps-label ps-value reasoning reasoning-lead reco reco-disclaimer
reveal score score-niveau score-track section-gap seg-desc seg-title segmented skel
skel-answer skel-row spread table-wrap tag
```

Règles :
- Avant chaque suppression, revérifier par grep (`grep -rnw -e <classe> app lib`, y compris construction dynamique type `` `prefix-${x}` `` ou `clsx`) que la classe n'est pas utilisée. En cas de doute, garder.
- Une règle dont tous les sélecteurs ne ciblent que des classes mortes : supprimer la règle entière.
- Sélecteur groupé (`.a, .b`) : retirer seulement la partie morte.
- Sélecteur composé mêlant classe vivante et morte (`.btn.btn-sm`, `.panel .tag`) : la règle ne s'applique qu'avec la classe morte, la supprimer.
- `@keyframes` ou variables CSS utilisées uniquement par les règles supprimées : les supprimer aussi.
- Ne PAS toucher aux autres classes, même si elles paraissent mortes (préfixes `sa-`, `sap-`, `conf`, `stepper`, etc. : hors périmètre, possibles constructions dynamiques).

### 2. `lib/shared/supabase-server.ts`

- Supprimer `getProfile` et le type `Profile` si plus aucun import (vérifier `grep -rn "getProfile\|Profile\b" app lib proxy.ts`).
- Supprimer les imports devenus inutiles.
- Garder `getUser` et le reste.

## Critères de fin

- `npx tsc --noEmit` sans erreur.
- `npm run lint` sans erreur.
- `npm test` : 154 passés, 1 ignoré (comme avant).
- `npm run build` réussi.
- Résumer : nombre de règles supprimées, lignes avant/après de `globals.css`, classes gardées par doute.

Ne pas commiter.

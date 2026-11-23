# MB Média Ads

Application Next.js (App Router, TypeScript) qui regroupe trois projets autour de la publicité média. Les URLs ne dépendent pas du rangement du code : les dossiers `app/(...)` sont des groupes de routes.

## Les projets

| Projet | Entrée (URLs) | Code | Documentation |
| --- | --- | --- | --- |
| Social Ads | `/social`, `/preview/[token]` | `app/(social-ads)/`, `app/api/social/`, `lib/social-ads/` | `docs/social-ads/` |
| Studio campagnes | `/studio/validation`, `/partage/[token]` | `app/(studio)/`, `app/api/studio/`, `lib/campaign-studio/`, `studio/` (dev Supabase, tests E2E, scripts) | `docs/studio/` |
| Decks | `/decks/presentation`, `/decks/apercu` | `app/(decks)/`, `lib/campaign-decks/` | `docs/decks/` |

Comptes (connexion, inscription) : `app/(compte)/`. Partagés : `app/_components/` (sélecteur), `lib/shared/` (Supabase, authentification, référentiels du profil), `supabase/` (migrations, une seule chaîne chronologique), `fixtures/media-test/` (jeu de médias de test), `docs/prd/` (PRD).

L'ancien module Achat média (tarif, campagne optimisée, Stripe, admin, service ML) a été supprimé (branche `chore/rangement-projets`) ; ses migrations restent dans `supabase/migrations/`.

## Démarrer

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Ouvrir <http://127.0.0.1:3000/studio/validation> (Studio). La racine `/` redirige vers `/studio`.

L'application peut utiliser ses variables Supabase habituelles (voir `.env.local.example`). L'accès aux routes conserve sa protection actuelle.

## Vérifications

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Rubik est téléchargée depuis Google Fonts au build, puis servie localement par Next.js : le build nécessite un accès réseau à Google Fonts. Le test d'import d'un classeur réel est ignoré si le fichier personnel correspondant est absent de `~/Downloads` ; les tests avec fixtures restent exécutés.

Tests E2E du Studio : `npx playwright test -c playwright.studio.config.ts` (voir `docs/studio/`).

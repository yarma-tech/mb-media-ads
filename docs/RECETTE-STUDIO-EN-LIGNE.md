# Recette Studio en ligne - 23 octobre 2026

## Environnement livré

- URL : https://mb-media-studio-dev.vercel.app/studio
- Social Ads : https://mb-media-studio-dev.vercel.app/social
- Vercel : `yarma-tech/mb-media-studio-dev`.
- Déploiement validé : `dpl_26NdgM2bq8KWr61Mx2sqxuDgGi7v`, code `2445379`.
- Supabase de développement : `eybpsijzytdqiqifmohj`, Canada Central, séparé du projet historique.
- Les deux comptes de test sont identiques aux comptes locaux ; leurs mots de passe ne sont pas dans Git.
- Plafond gratuit accepté : 50 000 000 octets. Bucket privé `studio-media`, même plafond appliqué à `social-ads`.
- 18 migrations appliquées. Cron `studio-expire-campaigns` actif chaque minute.
- La V1 sur `mb-media-ads.vercel.app` reste séparée.

## Vérifications réellement effectuées

- Le domaine public répond HTTP 200 sur `/studio` et HTTP 401 JSON sur `/api/studio` sans session.
- 8 tests Playwright contre Vercel et le Supabase distant : identités humaines et agents, refus des droits forgés, verrous, écritures périmées, batch partiel, corrections, V2, fin/réouverture, SEM, dépôt d’image, vidéo lue avec métadonnées vérifiées, contraste et absence de débordement sur six pages desktop/mobile, connexion commune Studio/Social Ads, import réel d’un classeur synthétique de 12 annonces, export et création d’un lien de validation.
- Vidéo courte réellement transférée via TUS et vérifiée sur le serveur Linux Vercel.
- L’API refuse 50 Mo + 1 octet avec HTTP 400. Le bucket privé est confirmé à 50 000 000 octets.
- Captures de la version distante examinées sur ordinateur et mobile.
- Lint sans erreur, 65 tests Vitest passés, 1 test de fichier utilisateur ignoré.

## Correctifs issus de la recette

- Preset Vercel explicitement `nextjs`. Dossier de build standard `.next` sur Vercel ; `.next-studio` réservé au mode connecté local.
- Privilèges SQL API explicites pour Social Ads sur une base Supabase neuve. Les politiques RLS par propriétaire sont conservées ; aucune table privée n’est ouverte aux anonymes.
- Sessions par cookies communes aux deux espaces.

## Points restant externes à la recette

- Assistant IA Social Ads : clé OpenRouter historique marquée sensible et non relisible par Vercel. Le transfert ciblé a été autorisé, mais aucune valeur ne peut être récupérée. Renseigner `OPENROUTER_API_KEY` dans le projet de test puis redéployer pour l’activer.
- Pas de fournisseur SMTP dédié ; les restrictions e-mail du service Supabase par défaut s’appliquent aux invitations.
- Statistiques régies et publication réelle restent hors du périmètre connecté.
- Les vidéos de 200 Mo exigent un forfait Supabase payant ; la recette gratuite à 50 Mo a été explicitement choisie.

## Relancer la recette distante

Avec les variables du seul projet de test chargées depuis `.env.studio.remote.local` :

```sh
npx playwright test --config playwright.studio.config.ts tests/studio/api.spec.ts tests/studio/workspace.spec.ts --timeout 180000
```

Le test de préservation V1 utilise séparément l’aperçu local sur le port 3001.

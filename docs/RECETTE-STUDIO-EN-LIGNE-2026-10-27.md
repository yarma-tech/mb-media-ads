# Studio en ligne - 27 octobre 2026

## Déploiement

- Site : https://mb-media-studio-dev.vercel.app/studio
- Projet Vercel : `yarma-tech/mb-media-studio-dev`.
- Déploiement : `dpl_GEJwK83qc85m9xiqp4sEWCdApt1W`, état `READY`, alias confirmé.
- Dernières modifications du répertoire de travail incluses via une copie de déploiement sans fichiers `.env`, caches ou instrumentation locale. Le diff Git reste non commité.
- Supabase : projet de développement `eybpsijzytdqiqifmohj`, distinct de la V1 historique.
- Les variables Vercel existantes sont conservées. Aucune migration ni modification d’authentification ou de droits.

## Vérifications du jour

- Vitest : 80 tests réussis, 1 ignoré ; lint, TypeScript et `git diff --check` passent.
- Compilation Vercel réussie ; domaine de test servi par le nouveau déploiement.
- Connexion réelle avec le compte Préparateur existant.
- Campagne synthétique dédiée : `Recette dépôt images 2026-10-27 1793109846613`.
- Trois PNG Facebook déposés via l’interface : 1080 × 1080, 1080 × 1350, 1080 × 1920.
- Reconnaissance des placements Fil carré, Fil portrait, Story ; images effectivement chargées aux dimensions attendues.
- Trois annonces créées avec leur média associé ; lignes et associations conservées après rechargement.
- Vue 390 px sans débordement du document. Captures ordinateur et mobile examinées ; pas de test sur téléphone physique.
- Rapport local : `/tmp/mb-media-live-images-20261027/result.json`. Captures dans ce même dossier.

## Usage

Dans Configuration, créer ou choisir une campagne, choisir le canal, déposer les médias dans sa bibliothèque, puis cocher les placements compatibles et cliquer sur « Créer les annonces choisies ». Les textes et les autres champs restent à compléter dans le tableau avant envoi en validation.

La reconnaissance vérifiée concerne les dimensions et les formats compatibles, pas une analyse sémantique du contenu des images. Limite de recette conservée : 50 Mo par fichier. Les tests du jour ne certifient pas tous les canaux, formats, vidéos ou fonctions de l’application.

## Réinitialisation

Après clarification, l’utilisateur a confirmé « Supprime tout ». Suppression réalisée sur le seul Studio de développement : huit campagnes, 21 annonces, six médias et six fichiers du bucket privé `studio-media`. Contrôle après suppression : zéro campagne, zéro verrou et zéro fichier dans ce bucket. Les deux comptes et les deux marques sont conservés, ainsi que le site déployé et la V1 historique.

La campagne de recette décrite ci-dessus a elle aussi été supprimée après vérification du parcours. Aucun nouveau contenu de test créé pour contrôler l’état vide. Rapport chiffré : `/tmp/mb-media-reset-studio-20261027-result.json`.

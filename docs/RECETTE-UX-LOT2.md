# Lot 2 - diagnostic connecté et corrections média, 24 octobre 2026

Travail local non commité sur `d0bd0047d6df8a3758114378dd410559a89fe36a`. Aucun push, déploiement, changement de droits, intervention Colima, suppression de données ou accès production.

## Diagnostic connecté

Copies isolées compilées avec `.env.studio.local`, vérifiée sur `127.0.0.1:55421` uniquement. Aucune clé copiée dans les sources de recette.

- `/tmp/studio-lot2/runtime`, build `96XPNjQJoeY25IwDuHuEo` : port 3020, PID 91945, session exec 65493. Contient lot 1 et complément fermeture du dialogue au changement de page/campagne, avant les corrections média.
- Même build instrumenté sur 3021, PID 93095, session exec 38047. Préchargement `/tmp/studio-lot2/fetch-log.cjs` : chemins, méthode, durée, statut uniquement, sans en-têtes ni corps.
- Premier essai : Auth 200 en 3,2 s ; lecture Studio 200 en 32,6 s. Attente initiale de test 5 s insuffisante, sans preuve de bug SEM.
- Essai instrumenté : Auth 200 en 189,7 s ; lectures Studio entre 12,2 et 47,3 s ; ouverture TUS 201 en 51,8 s, PATCH 204 en 0,9 s. Des lectures Auth serveur finissent aussi en 504 après 40 à 45 s.
- Contrôle isolé : TCP vers 55421 établi en moins de 1 ms, aucun HTTP Auth/Kong après 5 s ; API Studio anonyme 401 en 3 ms.
- Diagnostic PM indépendant : VM Colima 4 Go presque pleine, 8 Mo disponibles, aucun swap et charge très élevée, 42 conteneurs partagés avec d’autres travaux. Aucune intervention sur cette infrastructure autorisée ou effectuée.

Conclusion limitée : services locaux intermittents, en dessous de l’UI. Aucun défaut SEM attribué sans reproduction fonctionnelle complète. Augmenter l’attente de recette n’a pas rétabli les parcours ; aucun délai produit ni transport modifié. Recette connectée SEM/image/vidéo non validée, à reprendre après stabilisation coordonnée de Colima.

Preuves assainies : `/tmp/studio-lot2/connected-sanitized.json`. Résultats initiaux dans `/tmp/studio-lot2/before/results.json`, mesures serveur dans `/tmp/studio-lot2/server-requests.jsonl`. Scripts dans `/tmp/studio-lot2/connected-audit.cjs` et `connected-probe.cjs`. Captures masquent les champs mot de passe. Fixtures de campagnes/médias conservées.

## Corrections autonomes, reproduites en E2E simulé

- Un média `ready` sans URL temporaire affichait Non conforme dans la bibliothèque, ou Média à associer dans l’annonce. Il affiche désormais Préparation de l’aperçu ; rechargement de l’aperçu disponible. Sa conformité et ses placements restent valides.
- Le transfert terminé gardait 100 % et Pause pendant la vérification serveur. Phase `verifying` explicite, progression indéterminée et libellé Vérification du fichier ; Pause absent pendant cette phase. Même information sur le dépôt d’une ligne du tableau.
- Complément lot 1 : la page/campagne identifie la session Review ; navigation navigateur ferme l’ancien dialogue et conserve son brouillon local. Test initialement rouge dans `/tmp/studio-lot1/navigation-before.log`.

## Runtime simulé courant

- `/tmp/studio-lot2/simulated`, build `eGwgGue7nC5o2eyO3bvzP`.
- `http://127.0.0.1:3022/studio`, PID 96715, session exec 59245. Conserver ce serveur pour revue.
- Auth, API et TUS simulés dans `tests/studio/ux.spec.ts`. Réseau serveur bloqué par `/tmp/studio-lot1/no-network.cjs`. Aucune clé réelle.
- Le petit MP4 est effectivement chargé et lu par Chromium, mais ses métadonnées serveur et le stockage sont simulés. Ce test ne prouve pas la chaîne réelle TUS/ffprobe/Storage.
- Le premier test vidéo déposait dans l’ancien champ Facebook pendant la transition vers YouTube. Correction du test : attendre le canal actif avant dépôt ; test vidéo isolé passe ensuite. Aucun changement du build nécessaire pour ce correctif de fixture.
- Commande complète : `STUDIO_UX_BASE_URL=http://127.0.0.1:3022 npx playwright test -c playwright.studio.config.ts tests/studio/ux.spec.ts`.
- Suite finale : 15 E2E passent en 36,5 s sur 3022. Le contrôle vidéo ciblé après attente du canal actif passe aussi.
- Rapport final : `/tmp/studio-lot2/simulated-results.json`, journal `/tmp/studio-lot2/simulated-e2e.log`, captures `/tmp/studio-lot2/simulated-after`.
- Identité source/build contrôlée : `/tmp/studio-lot2/source-manifest.json`.
- TypeScript sans cache, lint et build webpack passent. Vitest : 65 passent, 1 ignoré.

## Reprise

1. Stabilisation Colima à coordonner avec les autres travaux, aucune action infrastructure automatique.
2. Recompiler la copie connectée avec les derniers correctifs média, sur un port libre et la seule configuration locale.
3. Rejouer SEM complet, puis image/vidéo jusqu’à chargement et lecture après reload, avec durées et statuts assainis. Arrêter les étapes dépendantes si la connexion échoue.
4. Garder distincts problèmes d’infrastructure, erreurs de recette et bugs produit. Affectation directe d’une marque neuve non ajoutée : priorité donnée au diagnostic, cause SEM non établie.

Contexte : pourcentage non exposé. Aucun serveur partagé interrompu. Les builds 3018 (lot 1 accepté) et 3022 restent immuables pour revue.

# Configuration multicanal et création groupée - 27 octobre 2026

## Comportement livré

- Une campagne neuve commence par le choix d’un ou plusieurs canaux, sans tableau ni bibliothèque affichés avant confirmation.
- Un dépôt commun accepte plusieurs fichiers en une fois. Chaque fichier est transféré une seule fois et conserve la liste des canaux auxquels il est destiné.
- Les placements compatibles sont calculés par canal. Un fichier peut servir plusieurs annonces sur plusieurs canaux sans duplication de son objet Storage.
- Le bouton global crée toutes les nouvelles annonces compatibles. Les créations existantes sont exclues du plan et une reprise de la commande ne crée aucun doublon.
- Les formats incompatibles et les fichiers en échec restent signalés ; les autres fichiers peuvent être traités.
- Une campagne existante conserve son tableau. « Ajouter des médias en lot » ouvre le nouveau parcours. Le bouton global est aussi disponible dans sa bibliothèque habituelle.
- La saisie sans média reste disponible. Google SEM seul ouvre directement les formats et le tableau texte.
- Canaux et étape courante sont conservés dans l’URL. Une nouvelle campagne ne reprend pas l’étape de la précédente.

## Implémentation

`Configuration.tsx`, `MediaLibrary.tsx`, `upload.ts`, `CreateCampaign.tsx` et la feuille de styles workspace pilotent le parcours.

`Media.channels` est optionnel pour préserver les anciens médias monocanaux. `catalog.ts` centralise la liste des canaux et les contraintes de compatibilité. La vérification serveur conserve aussi la fréquence d’images pour les règles GIF Display.

La commande API `add_media_batch` valide les médias de la campagne, calcule les placements et utilise un seul commit optimiste existant. Le moteur pur est dans `lib/campaign-studio/workspace/media-batch.ts`. Contrôles d’identité, de révision, de verrou, de statut et politiques de reprise conservés. Aucune migration SQL ou modification des droits.

## Vérifications

- Reproduction avant correction : absence du choix initial de canaux dans l’ancien build. Preuve : `/tmp/studio-batch-20261027/before-e2e.log`.
- Cas rouge additionnel : le premier échec disparaissait après le succès du fichier suivant. Preuve : `partial-before.log` dans le même dossier.
- Vitest : 88 tests réussis, 1 ignoré ; lint, TypeScript, compilation locale et `git diff --check` passent.
- 44/44 scénarios UI simulés sur le build final : `/tmp/studio-batch-20261027/release-e2e.log`.
- Quatre scans ciblés axe sur les écrans de choix/import, ordinateur et mobile : contraste, noms de boutons, labels, titres, attributs ARIA autorisés. Aucun problème détecté sur ces règles. Pas une certification WCAG.
- Captures 1440 et 390 px examinées, pas de débordement. Le focus de changement d’étape va au titre, sans encadrer toute la zone de travail.
- Recette réelle sur Supabase local : deux PNG carré/portrait, Facebook et Instagram sélectionnés avant dépôt, deux transferts et quatre annonces avec médias partagés. Associations conservées après rechargement, tableau Instagram contrôlé, vue mobile vérifiée. Une seule commande UI de création groupée.
- Seule la campagne synthétique `PM-Batch-20261027-0ac1bfa9` et ses deux fichiers ont été supprimés après cette recette. Aucune donnée préexistante ou distante modifiée par la recette.
- Rapport réel : `/tmp/studio-batch-20261027/connected-result.json`.
- Build local final : `9fzPpCMVDTD97bnXcjT-C`, manifest de 138 fichiers app/lib dans `/tmp/studio-batch-20261027/release.json`. Copies isolées : 3040 simulé, 3041 connecté local.

## Déploiement

- Site : https://mb-media-studio-dev.vercel.app/studio
- Projet de test : `yarma-tech/mb-media-studio-dev`.
- Déploiement : `dpl_3HbQt6Q7dMXDfXyBzRbdj934Wx8m`, état READY et alias confirmés par Vercel.
- Compilation Vercel et TypeScript réussis. Copie de déploiement sans fichiers `.env` ni instrumentation locale.
- Manifest : `/tmp/studio-batch-20261027/vercel.json`.
- Aucun changement du projet V1 historique ni nouvelle réinitialisation des données du site. Diff Git conservé non commité.

## Limites

Le test navigateur initial visant Vercel a été refusé par le contrôle automatique, qui invoquait les restrictions localhost de l’ancien audit. La reproduction et la recette ont donc été réalisées localement, sans contournement. Le déploiement distant a ensuite été autorisé et exécuté dans le périmètre de la demande utilisateur de mise en ligne. Aucune recette distante avec données métier n’a été exécutée pour cette nouvelle version.

Le test réel porte sur deux images et deux canaux. Les vidéos, autres combinaisons et règles Display sont couverts partiellement par les tests existants et unitaires, pas par une recette réelle exhaustive de tous les formats. Limite du site de test conservée : 50 Mo par fichier. Aucun test sur téléphone physique.

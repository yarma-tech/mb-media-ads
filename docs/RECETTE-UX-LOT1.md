# Lot 1 UX - recette locale du 24 octobre 2026

Base Git : `d0bd0047d6df8a3758114378dd410559a89fe36a`. Diff non commité. Aucun push, déploiement, changement de droits ou de données distantes.

## Corrections

- Corrections de validation conservées dans un brouillon local séparé, par personne et annonce. Fermeture propre sans confirmation ; confirmation seulement si copie locale impossible et saisie à perdre. Erreurs de sauvegarde gardent la saisie. Enregistrer et valider reste une action unique.
- Coalescence immédiate des commandes identiques en cours. Gardes avant sauvegarde/soumission et animation ; créations, duplication/version et soumission indiquent leur activité. Une nouvelle intention reste possible après succès ou erreur.
- Campagne, canal, statut, vue et recherche dans l’URL, conservés par liens, rechargement et historique. Sessions du tableau séparées par campagne/canal. Identifiant de campagne périmé : message explicite, aucune première campagne choisie silencieusement.
- Dialogue natif, Échap contrôlé, retour du focus après fermeture native, focus visible existant conservé.

## Preuves

- Ancien build : reproduction des trois régressions dans `/tmp/studio-lot1/before` et trois tests initialement rouges.
- Build simulé accepté par recette PM : `/tmp/studio-lot1/release`, build `-96GXnNt2qh4cTsY3trQ9`, `http://127.0.0.1:3018/studio`, PID 89312, session exec 58186. Ne pas arrêter pendant la revue.
- Auth/API navigateur simulées par `tests/studio/ux.spec.ts`. Requêtes serveur remplacées et réseau bloqué par `/tmp/studio-lot1/no-network.cjs`. Aucune clé réelle dans ce runtime.
- Commande : `STUDIO_UX_BASE_URL=http://127.0.0.1:3018 npx playwright test -c playwright.studio.config.ts tests/studio/ux.spec.ts`.
- Résultats : `/tmp/studio-lot1/results.json`, `/tmp/studio-lot1/e2e.log`, captures dans `/tmp/studio-lot1/after`. Douze E2E passent, desktop 1440 px, mobile 390/320 px, clavier, latences 800 ms et 2 s, erreurs/reprise, historique et changement de campagne.
- `npm test` : 65 passent, 1 ignoré. `npm run lint`, `tsc --noEmit --incremental false`, build webpack connecté : succès.
- Manifest source/build : `/tmp/studio-lot1/source-manifest.json`.

Limites : recette simulée distincte de la recette connectée SEM/image/vidéo du lot 2. Brouillons locaux au navigateur. Pourcentage de contexte non exposé.

## Complément après revue initiale

La navigation navigateur pendant une modale ouverte conservait le dialogue de l’ancienne vue. Régression reproduite dans `/tmp/studio-lot1/navigation-before.log`. Le composant Review est désormais identifié par page/campagne, ce qui ferme la session précédente tout en conservant son brouillon. Ce complément passe dans la recette simulée finale sur 3024 ; le serveur 3018 reste la preuve immuable du premier lot accepté.

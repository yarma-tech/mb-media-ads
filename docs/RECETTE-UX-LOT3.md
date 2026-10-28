# Passation UX Studio - 24 octobre 2026

État stable demandé pour revue. Aucun nouveau lot engagé après cette passation.

## Dépôt et périmètre

- Base Git : `d0bd0047d6df8a3758114378dd410559a89fe36a`, branche `codex/annonces-en-situation-v1`.
- Diff volontairement non commité. Aucun push, PR, déploiement, changement de droits, suppression de données ou intervention infrastructure.
- Détails précédents : `docs/RECETTE-UX-LOT1.md` et `docs/RECETTE-UX-LOT2.md`.

## Dernières corrections

- Carrousel parcouru : bouton Revoir les annonces parcourues. Une action pour reprendre, aucune décision ni modification de statut. Focus rendu au groupe Annonce courante, jamais directement à Approuver.
- Recherche vide : message spécifique et Effacer la recherche. Une action pour reprendre, campagne conservée, focus dans la recherche. Le carrousel sans résultat ne prétend plus que les annonces ont toutes été parcourues.
- Configuration sans campagne : création directe avec le même formulaire que la Home. Nom puis Entrée, sans détour par Home. Gardes contre double création conservées.
- Filtre sans résultat : accès direct à toutes les campagnes si aucune recherche n’est saisie.
- Canal actif visible sur mobile après sélection, navigation et rechargement ; seul le bandeau horizontal défile, aucun déplacement vertical forcé.
- Lien Aller au contenu : cible désormais une zone de travail réellement focusable.

## Reproductions avant correction

Six contrôles rouges sur le build 3022 : carrousel sans reprise, recherche sans action, Configuration vide sans création directe, canal Google hors écran à 390/320 px, raccourci de contenu sans transfert du focus.

- Journal : `/tmp/studio-lot3-red.log`.
- Détails : `/tmp/studio-lot3/before`.

Revue clavier : le premier focus de reprise ciblait Approuver. Deux Entrée produisaient une commande d’approbation, confirmé indépendamment par le PM. Régression rouge dans `/tmp/studio-lot3/review-red.log`. Correction : focus sur un groupe non mutatif avec indication visible ; Entrée répétée ne déclenche aucune décision, Tab permet ensuite de cibler une action volontaire.

## Build courant pour revue

- URL : `http://127.0.0.1:3024/studio`.
- PID : `15986`, session exec : `28456`.
- Répertoire : `/tmp/studio-lot3/final`.
- Build ID : `OQ-jWw4Kf9h5DFvhcYLeI`.
- Source identique au dépôt pour les composants workspace : `/tmp/studio-lot3/source-manifest.json`.
- Serveur entièrement simulé pour cette recette : Auth/API/TUS navigateur dans `tests/studio/ux.spec.ts`, réseau serveur remplacé/bloqué par `/tmp/studio-lot1/no-network.cjs`. Aucun secret de production.
- Commande serveur : `STUDIO_CONNECTED=true NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:55421 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-public-placeholder NODE_OPTIONS='--require /tmp/studio-lot1/no-network.cjs' node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3024`, depuis le répertoire du build.

Conserver les preuves immuables : 3018 lot 1, 3022 lot 2, 3023 premier lot 3 avant correction de la reprise clavier, 3024 version finale. Aucun serveur partagé interrompu.

## Vérifications finales

- Commande : `STUDIO_UX_BASE_URL=http://127.0.0.1:3024 npx playwright test -c playwright.studio.config.ts tests/studio/ux.spec.ts`.
- 22 E2E passent en 52,2 s. Desktop 1440 px, mobile 390/320 px, Tab/Shift+Tab, focus visible, Entrée/Échap, erreurs/reprise, latences 800 ms et 2 s, contexte/historique, image chargée, petit MP4 chargé et effectivement lu, états vides et reprise non mutative.
- JSON : `/tmp/studio-lot3/results.json`, journal : `/tmp/studio-lot3/e2e.log`, captures : `/tmp/studio-lot3/after`.
- Revue PM indépendante sur la même copie : 33 contrôles passent, y compris touche maintenue `repeat=true`, répétitions rapides, clic après focus, aller-retour, puis approbation volontaire au clavier exactement une fois. Rapport PM : `/Users/YarmaVideos/Documents/Codex/2026-10-23/task-4/audit/pm-evidence/lot3-final-results.json`.
- Build webpack, lint, TypeScript sans cache : succès. Vitest : 65 passent, 1 ignoré.

## Limite et reprise connectée

SEM/image/vidéo réels non certifiés. Le Supabase local a répondu par intermittence en dizaines de secondes, voire plusieurs minutes ; VM Colima partagée presque à court de mémoire selon diagnostic PM. Aucune modification des délais produit, du transport, de la VM, du tunnel ou des conteneurs. Les fixtures de recette sont conservées.

Après stabilisation coordonnée de l’infrastructure, recompiler une copie connectée à jour avec la seule configuration locale et reprendre les parcours décrits dans le lot 2. Les serveurs connectés 3020/3021 contiennent un build plus ancien que 3024 : ne pas les utiliser pour certifier le dernier code.

Contexte : pourcentage non exposé. Aucune mémoire persistante modifiée.

## Mise à jour après reprise connectée

La recette connectée finale et les quatre corrections résiduelles sont désormais validées localement. État courant, build 3026 et preuves : `docs/RECETTE-CONNECTEE-FINALE-2026-10-24.md`. Les limites Colima ci-dessus décrivent la situation avant le signal de reprise PM.

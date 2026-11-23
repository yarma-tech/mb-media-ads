# Studio connecté - passation finale du 24 octobre 2026

## État livré pour revue

Recette locale finale réussie sur Supabase `http://127.0.0.1:55421`. Diff conservé non commité sur `codex/annonces-en-situation-v1`, base Git `d0bd0047d6df8a3758114378dd410559a89fe36a`.

Aucun push, déploiement, changement de droits, suppression de données existantes, envoi externe ou intervention Colima par cet agent. L’infrastructure a été stabilisée séparément par le PM avant son signal explicite de reprise.

## Runtime courant

- Application : `http://127.0.0.1:3026/studio`.
- Copie : `/tmp/mb-media-connected-residual-phggppvv`.
- Build : `RMbq_-Qt0iVaLsvsbHUj8`.
- Serveur démarré et géré par le PM, PID `85463`, session exec PM `4200`.
- Les 134 fichiers `app/lib` correspondent au dépôt et à la copie compilée. Manifeste : `/tmp/studio-connected-residual.json`.
- Configuration chargée exclusivement depuis `.env.studio.local`, contrôlée sur l’origine locale avant compilation ; aucun secret copié dans le runtime ou les documents.
- Garde réseau temporaire `local-network.cjs` : seuls Supabase local et le serveur local sont accessibles ; fetch/HTTP(S) externe et redirections refusés. Le navigateur de recette autorise seulement ces deux origines, avec commandes limitées aux campagnes synthétiques de son propre scénario.
- Rubik des deux anciennes pages de decks est réutilisé depuis les six fichiers de police du build déjà accepté, via le mécanisme de réponses de test Next Font. Cela évite Google Fonts sans modifier le produit ou ouvrir le réseau. Voir `recipe-fonts-manifest.json` dans la copie. Aucune API Studio ni réponse Supabase simulée dans la recette réelle.

Le build précédent connecté `XBIA-zpYW6QDwxYSEoDHz` reste sur 3025, dans `/tmp/mb-media-connected-final-f6w36wzm`, PID `72010`, session `16434`. Conserver 3018/3022/3023/3024 comme preuves simulées précédentes. Ne pas utiliser ces anciens builds pour certifier les derniers correctifs.

## Causes reproduites et correctifs

1. **Marque neuve non affectée** : la création renvoyait la marque mais aucune commande ne l’associait à la campagne. Après création, affectation automatique à la campagne d’origine par la commande existante. En cas d’échec d’association, la marque demeure disponible dans le sélecteur ; aucune suppression ni création compensatoire.
2. **Vérification média contradictoire** : le serveur conserve `media.state=uploading` pendant le contrôle. La carte affichait Transfert à terminer et Vérifier le transfert alors que la progression annonçait Vérification du fichier. L’état client de vérification identifie désormais le média ; sa carte annonce la vérification et ne propose plus de relancer ce transfert pendant cette phase. Le test retient précisément la réponse `verify_media` et observe les mutations pendant toute la fenêtre, après la création du média uploading.
3. **Bail perdu au rechargement** : nouveau jeton à chaque montage, mais ancien bail serveur encore actif après rechargement du document. Reprise de ce seul bail via sessionStorage, par acteur et annonce, uniquement au premier montage après un vrai rechargement. Une navigation normale, un autre onglet ou une fenêtre avec stockage copié génèrent un jeton distinct. Suppression de la copie du bail après libération confirmée. Aucune modification SQL/API, de durée, de propriétaire ou de validation du jeton serveur.
4. **Commentaire sans focus initial** : React autoFocus s’exécutait avant l’ouverture du dialogue fermé. Focus explicite du textarea après `showModal()`, avec retour au déclencheur et confirmation d’abandon conservés.

Rouges ciblés : `/tmp/studio-connected-regressions-before.log`, `/tmp/studio-connected-media-before-exact.log`, `/tmp/studio-connected-window-before.log`. Reload réel rouge : `/tmp/mb-media-connected-final-f6w36wzm/lock-repro.log`. Les deux essais initiaux de test média qui attendaient l’absence du texte jusqu’à la fin ne prouvaient pas la contradiction ; ils ont été remplacés par l’assertion immédiate, puis par l’observation de la fenêtre retenue.

## Résultats de recette

- **26/26 E2E simulés**, aucun flaky : `/tmp/studio-connected-residual-simulated.json`, journal `/tmp/studio-connected-residual-simulated.log`, captures `/tmp/studio-connected-residual-simulated`.
- **6/6 étapes réelles** : connexion, campagne/marque/SEM, clavier/sauvegarde/soumission, correction/Échap/approbation/reload, image TUS/vérification/association/reload, vidéo TUS/vérification/association/reload. Rapport : `/tmp/mb-media-connected-residual-phggppvv/evidence/PM-Recette-20261024-8cc2a3fd/results.json`.
- Mesures navigateur réelles : image `1080 × 1080`, chargée ; vidéo `640 × 360`, lecture constatée `currentTime=0.0346`. Dimensions et lecture également contrôlées après rechargement. Mobile 390/320 px : absence de débordement du document.
- **5/5 contrôles réels de bail** : connexion ; éditeur propre après reload `200` ; onglet ouvert avec opener et sessionStorage effectivement copié bloqué `409` ; reprise après libération explicite `200` puis sauvegarde ; session Préparateur distincte bloquée `409`, puis reprise `200` après libération. Rapport : `/tmp/mb-media-connected-residual-phggppvv/evidence/PM-Lease-20261024-f305d40e/results.json`.
- Scripts reproductibles dans la copie : `connected-recipe.cjs`, `lease-sessions.cjs`. Ils exigent `STUDIO_INFRA_HEALTH_CONFIRMED=1` avant toute connexion. Arrêt des étapes dépendantes au premier échec.
- Revue PM indépendante : **37/37 simulés**, puis **5/5 étapes connectées principales + 8/8 étendues**, dont saisie invalide, Entrée répétée, erreur réseau injectée et reprise, commentaire, duplication, deux onglets et opener. Rapports : `/Users/YarmaVideos/Documents/Codex/2026-10-23/task-4/audit/pm-evidence/residual-simulated-results.json`, `residual-connected-main/results.json` et `residual-connected-extended/results.json` dans ce même dossier.
- Vérifications finales locales : build webpack, lint et TypeScript sans cache passent ; Vitest 65 passent, 1 ignoré.
- Les erreurs de préchargement `net::ERR_ABORTED` lors des navigations sont conservées séparément dans les traces ; aucun échec métier ou exception JS n’a été attribué à ces annulations. Les `409` des tests de concurrence sont attendus.

## Préservation des données

Fixtures séparées : `PM-Recette-20261024-8cc2a3fd-*` et `PM-Lease-20261024-f305d40e-*`. Marque et trois campagnes de parcours, plus une campagne de contrôle du bail, conservées dans la base locale. Aucun nettoyage supprimant des campagnes, marques ou médias. Les libérations concernent seulement les baux temporaires des éditeurs de ces fixtures.

Les comptes de recette existants ont été utilisés sans création, modification de rôle, invitation ou jeton agent. Aucune suite d’administration des accès n’a été exécutée. Les captures masquent les mots de passe ; journaux limités aux chemins sans query, méthodes, durées et statuts, sans JWT, clés ou corps d’authentification.

Pourcentage de contexte non exposé. Les limites antérieures de recette connectée dans les passations des lots 1 à 3 décrivent l’état avant stabilisation ; cette passation les remplace pour le périmètre testé. Aucune certification de production ou d’autres parcours n’est déduite de ces résultats locaux.

# Compatibilité des formats Meta - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. Exécution directe, sans sous-agents, conformément à la préférence du propriétaire.

**Goal:** Accepter les médias compatibles avec les placements Meta pris en charge, corriger les tolérances et rendre explicites les formats avancés encore absents.

**Architecture:** Une matrice de règles sourcées distingue canal, placement, type de média, proportions acceptées et recommandations. Le catalogue existant reste compatible avec les annonces enregistrées. L’import, le tableau et les prévisualisations consomment la même matrice, sans multiplier les annonces à chaque nouveau placement compatible.

**Tech Stack:** Next.js, React, TypeScript, Zod, Vitest, Playwright, vérification média ffprobe existante.

**Spec:** Demande utilisateur du 4 novembre 2026 et audit du catalogue dans cette conversation. Le périmètre et les références officiels figurent ci-dessous. Ce document est un plan technique, pas un engagement de conformité exhaustive ni de publication dans Meta.

## Global Constraints

- Conserver les identifiants existants `square`, `portrait`, `story`, `story_video`, `reel`, `video`, les médias et les statuts enregistrés.
- Aucune modification automatique des annonces approuvées, en diffusion ou arrêtées.
- Aucun recadrage, ajout de bandes ou conversion destructrice sans action volontaire.
- Les recommandations Meta ne deviennent pas des motifs de refus.
- Les limites internes de stockage de 50/200 Mo restent distinctes des limites Meta. Ne pas modifier le forfait ni ces limites dans ce chantier.
- Les formats exacts Display et les autres canaux gardent leurs règles.
- Types et états mutuellement exclusifs : unions discriminées et enums fermés.
- Pas de sous-agents. Pas de modification des campagnes réelles pour la recette.

## Références et précision sur les tolérances

Consultation directe du guide officiel Meta dans le navigateur le 4 novembre 2026 :

| Source | Donnée confirmée | Conséquence |
| --- | --- | --- |
| [Image / Fil Facebook](https://www.facebook.com/business/ads-guide/update/image/facebook-feed) | Tolérance 3 %, image maximale 30 Mo, largeur minimale 600 px, hauteur minimale 750 px pour le 4:5 | Remplacer le 1 % global par 3 % pour cette règle ; conserver la distinction recommandations/exigences |
| [Image / Fil Instagram](https://www.facebook.com/business/ads-guide/update/image/instagram-feed) | Tolérance 1 %, largeur minimale 500 px, proportions de 400:500 à 191:100, image maximale 30 Mo | Garder 1 % ici ; accepter la plage de proportions, pas uniquement deux ratios prédéfinis |
| [Proportions par placement](https://www.facebook.com/business/help/682655495435254) | Plusieurs proportions acceptées pour les fils, Stories et Reels ; le 9:16 est une recommandation pour les Reels | Éviter la règle générale « un seul ratio par placement » |

La matrice générale mélange images et vidéos. Le guide détaillé du couple placement/type prime pour ses restrictions : le 2:3 ou 9:16 indiqué dans une ligne générale Instagram ne prouve pas que le fil accepte une image fixe à ces proportions.

Les tolérances des autres couples placement/type doivent être relevées avant leur activation. Ne pas leur attribuer 3 % par défaut ni présenter un 1 % historique comme une exigence officielle. Conserver la source, la date et l’objectif consulté pour chaque règle.

## Review Focus

1. Un export proche d’une limite, avec arrondi d’un pixel, doit suivre une comparaison inclusive stable, malgré les flottants.
2. Un fichier reconnu pour plusieurs placements ne doit pas générer des annonces supplémentaires sans sélection explicite.
3. Un média compatible mais non recommandé doit rester utilisable, avec un avertissement compréhensible.
4. Les anciens formats et gabarits doivent rester lisibles, sans changer les annonces approuvées ou leurs versions.
5. La compatibilité, le texte explicatif et l’aperçu doivent donner le même résultat dans la création, la validation, On air et les liens partagés.

## Lot 1 - Corriger les imports et les formats à média unique

### Task 1: Règles officielles et tolérances par placement

**Files:** Create `lib/campaign-studio/workspace/meta-formats.ts`, `lib/campaign-studio/workspace/meta-formats.test.ts`; Modify `lib/campaign-studio/workspace/catalog.ts`, `catalog.test.ts`.

**Interfaces:** `MetaPlacement = "feed" | "story" | "reel"`; `MetaMediaKind = "image" | "video"`. `MetaRule` contient canal, placement, type, ratios ou plage autorisée, tolérance documentée éventuellement absente, exigences techniques, recommandations, source et date. `MetaCheck` est une union discriminée `accepted | warning | rejected | unverified`. `matchRatio(width, height, targetWidth, targetHeight, tolerance): boolean` et `validateMetaMedia(media, rule): MetaCheck` centralisent les décisions. `compatibleFormats` conserve sa signature publique.

- [x] Relever les fiches officielles Facebook/Instagram pour image et vidéo dans le fil, les Stories et les Reels. Documenter les contradictions avant de figer une règle ; distinguer import de fichier, placement et rendu avec recadrage.
- [x] Reproduire en E2E le refus actuel d’un média Meta réel ou synthétique valide : image paysage et vidéo carrée. Capturer le message affiché et les formats proposés avant modification.
- [x] Écrire les tests : `matchRatio(1030, 1000, 1, 1, 0.03)` vrai, `matchRatio(1031, 1000, 1, 1, 0.03)` faux ; à 1 %, 1010/1000 vrai et 1011/1000 faux. Tester également 0, dimensions non finies et frontières des plages documentées.
- [x] Exécuter les tests rouges, implémenter la matrice et les comparaisons inclusives avec une marge numérique négligeable. Appliquer 3 % au fil Facebook image et 1 % au fil Instagram image. Ne pas élargir les règles Display.
- [x] Vérifier : `npx vitest run lib/campaign-studio/workspace/meta-formats.test.ts lib/campaign-studio/workspace/catalog.test.ts`. Commit ciblé des règles et tests.

### Task 2: Catalogue des formats à média unique

**Files:** Modify `catalog.ts`, `catalog.test.ts`, `app/studio/_components/workspace/Configuration.tsx`, `AdTable.tsx`, `lib/campaign-studio/workspace/ad-import.ts`, `ad-import.test.ts`.

**Interfaces:** Enrichir `Format` avec ses métadonnées Meta, sans rendre ces champs obligatoires pour Google, TikTok, YouTube ou Display. Nouveaux identifiants additifs : `landscape` (image 1,91:1), `landscape_16_9` (image 16:9), `square_video`, `portrait_video`, `landscape_video`, `feed_image` pour les proportions intermédiaires documentées, et `reel_image`. Ajouter `story_video` à Facebook. Garder `video` pour la vidéo paysage Facebook existante. L’éligibilité finale dépend toujours de la règle détaillée placement/type, pas de la seule présence d’un identifiant.

- [x] Écrire les tests de catalogue : images 1200×628 et 1920×1080, vidéos 1080×1080 et 1080×1350 sur Facebook/Instagram ; Stories vidéo Facebook 1080×1920 ; vidéo paysage Instagram. Tester une image Instagram 3:2 autorisée par sa plage et une image 2:3 non autorisée dans le fil.
- [x] Ajouter les formats documentés, y compris les proportions alternatives des Reels. Une variante de placement réutilise le média original et n’impose pas son recadrage.
- [x] Afficher les noms sans ambiguïté : type, placement et proportions ; actualiser les sélecteurs et la liste des valeurs admises par les gabarits Excel/CSV, en conservant les anciens identifiants.
- [x] Vérifier les tests catalogue/import et les E2E du sélecteur sur mobile et bureau. Commit ciblé du catalogue et de ses consommateurs.

### Task 3: Reconnaissance, erreurs et création en lot

**Files:** Modify `lib/campaign-studio/workspace/media-batch.ts`, `media-batch.test.ts`, `workflow.ts`, `commands.ts`, `server.ts`, `verify-media.ts`, `app/studio/_components/workspace/MediaLibrary.tsx`, `upload.ts`, `tests/studio/ux.spec.ts`.

**Interfaces:** `mediaAdPlan` conserve ses sorties `{mediaId, channel, format, label}`. Ajouter aux commandes de création en lot une sélection explicite de ces triplets, validée par le serveur. La suggestion par défaut contient au plus une annonce par média/canal ; les autres placements sont des choix, pas des créations implicites.

- [x] Tests rouges : un média associé à deux canaux, plusieurs placements compatibles, aucun doublon au second envoi, sélection altérée côté client refusée par le serveur.
- [x] Distinguer les états : lecture/transfert du fichier, compatibilité du placement, recommandation. Un fichier valide sur un autre placement ne devient pas globalement « Non conforme ».
- [x] Pour une vraie incompatibilité, afficher la cause précise et les valeurs attendues. Pour une exigence non vérifiée, afficher « À vérifier dans Meta », sans annoncer une conformité acquise. Préserver le fichier original.
- [x] Vérifier les exigences techniques documentées pour les nouvelles associations et modifications volontaires ; une simple ouverture d’une ancienne annonce approuvée ne la désapprouve pas.
- [x] Vérifier : `npx vitest run lib/campaign-studio/workspace/catalog.test.ts lib/campaign-studio/workspace/media-batch.test.ts lib/campaign-studio/workspace/workflow.test.ts`; E2E import et création en lot. Commit ciblé.

### Task 4: Prévisualisations et compatibilité des campagnes existantes

**Files:** Modify `app/studio/_components/workspace/Preview.tsx`, `preview.module.css`, `lib/campaign-studio/workspace/share-types.ts` si la projection exige les nouvelles métadonnées ; tests `tests/studio/ux.spec.ts`, `tests/studio/sharing.spec.ts` et tests unitaires de partage existants.

**Interfaces:** Les prévisualisations consomment les métadonnées du format et les dimensions du média, plutôt qu’une liste de quelques identifiants `story`/`reel` codée dans chaque composant. La projection partagée ne révèle pas les chemins privés.

- [x] Tests rouges : même annonce paysage, carrée ou portrait dans création, validation, On air et partage ; aucun visuel déformé ou tronqué involontairement.
- [x] Adapter les rendus aux nouveaux types et proportions. Afficher un avertissement de recadrage uniquement quand le placement Meta concerné le justifie et que la source le documente.
- [x] Vérifier les campagnes anciennes et les liens révocables, sans modifier leurs données. Conserver les miniatures vidéo enregistrées.
- [x] Vérifier sur Chrome/WebKit, à 390 et 1440 px, puis committer les rendus et tests.

## Lot 2 - Formats composés

### Task 5: Carrousel

**Files:** Modify `types.ts`, `commands.ts`, `workflow.ts`, `server.ts`, `ad-import.ts`, `share-types.ts`, `share.ts`, `AdTable.tsx`, `MediaLibrary.tsx`, `Preview.tsx` et les tests correspondants. Create `lib/campaign-studio/workspace/carousel.ts`, `carousel.test.ts` et un éditeur de cartes dédié.

**Interfaces:** Ajouter un contenu d’annonce discriminé `single | carousel` avec lecture compatible des anciennes annonces sans discriminant. Le carrousel possède des cartes ordonnées avec identifiant, média et champs propres autorisés par le guide. Le statut, l’approbation et la version portent sur l’annonce complète.

- [ ] Relever les spécifications officielles du carrousel pour les placements retenus : nombre de cartes, mélanges image/vidéo, proportions, textes et liens. Fixer les valeurs et exemples dans les tests avant de coder.
- [ ] Tests rouges : ordre des cartes, limites documentées, média manquant, duplication, import/export, modification depuis la validation et nouvelle version d’une annonce On air.
- [ ] Implémenter création/édition des cartes, prévisualisation et projection partagée avec le même contrôle de révocation que les médias simples.
- [ ] Vérifier le parcours complet au clavier, sur mobile et bureau. Ne pas traiter le mode de navigation « carrousel » de validation comme un format publicitaire carrousel.

### Task 6: Collection - cadrage puis développement dédié

**Files:** Futur plan distinct `docs/superpowers/plans/YYYY-MM-DD-meta-collection.md`. Pas de changement du catalogue actif avant ce cadrage.

**Interfaces:** Définir d’abord les données nécessaires au format Collection et à sa destination Meta : couverture, éléments présentés, éventuel catalogue et expérience après clic. Le Studio reste un outil de préparation/validation, sans publication réelle.

- [ ] Vérifier les exigences Collection directement dans le guide Meta, avec un exemple correspondant à l’usage du collège.
- [ ] Faire préciser le besoin d’une présentation multi-éléments et la source de ces éléments. Ne pas inventer une intégration catalogue ni ajouter un faux format Collection réduit à une image.
- [ ] Produire le plan dédié : modèle discriminé, formulaire, import, validation, versionnement et aperçu. Développer seulement après validation de ce périmètre.

## Livraison et critères de sortie

- [ ] Lot 1 livrable indépendamment des carrousels/Collections. Aucun format annoncé comme disponible sans son parcours complet.
- [ ] Relancer les reproductions initiales avec les mêmes fichiers et les cas aux frontières de tolérance.
- [ ] `npm test`, `npm run lint`, `npm run build` réussissent ; E2E Chrome et WebKit couvrent import, association, création en lot, édition et aperçus.
- [ ] Vérifier les diff de campagnes existantes : aucune réécriture ou perte de statut non demandée.
- [ ] Déployer le même commit testé sur les domaines autorisés, puis contrôler les adresses exactes `mb-media-ads.vercel.app` et `mb-media-studio-dev.vercel.app`. Distinguer clairement version locale, déployée et vérifiée.

**Ordre recommandé :** terminer le Lot 1 en priorité, livrer, puis engager le carrousel. Le format Collection exige son cadrage dédié avant toute promesse de livraison.

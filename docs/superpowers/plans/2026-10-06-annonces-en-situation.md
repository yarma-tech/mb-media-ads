# Annonces en situation V1 - Implementation Plan

> Pour l'exécution ultérieure : suivre les tâches avec `superpowers:executing-plans` ou `superpowers:subagent-driven-development`. Cette livraison est une phase plan uniquement.

**Goal:** Importer une campagne Excel, associer ses visuels, afficher des mockups fidèles, recueillir corrections et décisions sans compte, puis exporter les textes finaux.

**Architecture:** Conserver le module Social Ads et ses chemins owner/RLS et review/token serveur. Centraliser les combinaisons autorisées dans un référentiel fermé ; isoler les quatre transformations pures : specs, import, manifeste et export. Réutiliser les uploads signés et les tables `sa_*` avec migrations additives.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Supabase Auth/Postgres/Storage ; ajout de Tailwind, Vitest et d'un lecteur XLSX serveur lors de l'implémentation.

**Spec:** `docs/prd/PRD-001-annonces-en-situation-v1.md`, complété par `docs/ads-formats-inventory.md` et les conventions ci-dessous.

## Contraintes et état de départ

- Aucun code, commit, migration appliquée ou accès production dans cette phase. Les migrations futures seront vérifiées sur une base locale isolée ; leur application en production relève d'une autre demande.
- Baseline `tsc` et build passée selon le parent ; ne pas relancer ces vérifications pendant la rédaction du plan.
- Fable pour la stratégie, Sonnet 5 pour le code, fallback Opus selon les instructions globales. Le harnais de cette session ne propose pas ces sous-agents ; aucun changement de modèle n'est prétendu.
- Une marque par utilisateur ; cinq plateformes : Facebook, Instagram, LinkedIn, TikTok, YouTube. Pas de SEM, display, publication régies, lecteur vidéo, recadrage ou historique de versions.
- Captures fixes pour les annonces vidéo, icône play, aucune durée inventée. Images JPG/JPEG, PNG, WebP et GIF, limite applicative de 50 Mo.
- Les quatre modules purs ont des tests Vitest de comportement. UI, marque, droits et migrations : vérifications E2E et SQL locales, sans nouvelle suite automatique de composants.
- Préserver les changements existants. Ne pas modifier les anciennes migrations, le lockfile à la main, les fichiers auto-générés ou `CHANGELOG.md`.
- Les huit modules ci-dessous constituent le périmètre ; aucune couche de contrôle, wrapper ou automatisation supplémentaire.

## Conventions et contradictions

### Colonne Format

| Valeur Excel | Placement | Média | Ratio |
|---|---|---|---|
| `Image` | Feed | image | défaut du référentiel |
| `Video 4/5` | Feed | vidéo | 4:5 |
| `Story image 9/16` | Stories | image | 9:16 |
| `Story vidéo 9/16` | Stories | vidéo | 9:16 |
| `Reel` | Reels | vidéo | 9:16 |

Normaliser casse, accents, espaces et notation `/` vers `:`. `Story` seul est ambigu et produit une erreur de ligne ; ne pas deviner son média. `Reel` n'est accepté que sur les plateformes possédant Reels. Pour YouTube et TikTok, le Feed implicite de FR-016 ne correspond pas aux placements du référentiel : traduire Feed en `in_feed` pour ces plateformes, puis vérifier le type de média. Documenter les valeurs explicites `In-stream vidéo 16/9`, `In-feed vidéo 16/9`, `Shorts vidéo 9/16` dans le gabarit. Un placement explicite invalide n'est jamais rabattu sur Feed.

### Excel historique : villes contre plateformes

FR-013 et les nouveaux fichiers imposent des feuilles plateformes. Le classeur historique évoqué par l'utilisateur comporte des feuilles villes : il ne peut donc pas satisfaire simultanément cette règle et le critère des 12 annonces. Le fichier `Facebook_AEC_Automne2026_CollegeUniversel.xlsx` n'est pas présent dans le dépôt inspecté ; sa structure exacte n'a pas été vérifiée.

Décision de plan : importer le nouveau gabarit strictement par nom de plateforme ; signaler les feuilles villes comme inconnues conformément à FR-018. Pour valider les 12 annonces historiques, obtenir une copie anonymisée et la convertir une fois au gabarit plateformes, en conservant ville, feuille et ligne dans les métadonnées. Ne pas ajouter silencieusement un deuxième mode d'import ni déduire Facebook du nom du fichier. La compatibilité directe avec l'ancien classeur serait un arbitrage produit supplémentaire.

### Dédoublonnage créa, formats et ratios

FR-022 demande un dédoublonnage par référence, mais une référence partagée par une image Feed 4:5 et une Story 9:16 ne désigne pas nécessairement un fichier interchangeable. Proposition explicite pour l'exécution : clé d'emplacement = référence normalisée + type de média de l'annonce + ratio. Plateforme et placement sont des destinations, pas des dimensions de la clé si le média et le ratio restent compatibles. Les cartes utilisent leur propre référence et ratio, tout en gardant leur index et leurs textes indépendants.

Le critère « six annonces, deux créas, deux visuels » reste vrai uniquement si les variantes sont compatibles. Un nom correspondant à plusieurs variantes ne déclenche aucune association automatique : demander un choix manuel. Ne pas fusionner les annonces ou les textes des cartes. Cette précision modifie l'interprétation littérale de FR-022 et doit être acceptée avant l'exécution du module 5.

### Autres écarts à traiter

- Shorts : le PRD impose mobile uniquement ; l'inventaire mentionne aussi un rendu bureau via Feed. Retenir le périmètre mobile V1 du PRD.
- Specs actuelles : `getSpec` possède un repli silencieux ; le supprimer. Distinguer seuil d'affichage, recommandation et plafond dur, notamment pour LinkedIn. Les valeurs inconnues restent explicitement inconnues jusqu'à revue sur captures.
- Migration : les anciennes Stories ne distinguent pas image et vidéo ; le ratio par défaut existant peut être 1:1. Conserver les données sources et signaler les cas ambigus, sans conversion destructive ni contrainte qui ferait perdre une annonce.
- Stockage : la migration existante annonce 300 Mo et les politiques sont ouvertes à tout utilisateur authentifié pour le bucket. La V1 limite ses uploads à 50 Mo et doit vérifier la propriété du plan/chemin, en préservant les médias historiques.
- Décisions : plusieurs relecteurs existent en base. Pour les compteurs et l'export, une révision courante l'emporte, sinon une approbation, sinon sans décision ; une annonce ne compte qu'une fois. Employer la même règle pour le statut du plan.

## Review Focus

1. Feuille inconnue ou colonne manquante : rapport contextualisé, autres feuilles conservées (module 4).
2. Format connu mais combinaison interdite : refus explicite, aucun repli silencieux (modules 1 et 4).
3. Même nom de créa avec ratios incompatibles ou collision normalisée : aucun rattachement erroné (module 5).
4. Token expiré, annonce d'un autre plan ou propriété injectée : aucune écriture publique (module 7).
5. Texte édité, accents, cartes et décisions multiples : export fidèle et compteurs par annonce (modules 7 et 8).

## Ordre d'exécution et huit modules

Ordre : 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Le modèle et les contraintes YouTube sont cadrés dès 1 ; le premier mockup du module 6 est YouTube In-stream pour lever tôt le risque visuel. Chaque module termine par sa vérification avant le suivant.

### 1. Modèle fermé et référentiel de specs - F2, FR-006 à FR-010

**Modifier :** `lib/social-ads/types.ts`.
**Créer :** `lib/social-ads/specs.ts`, `lib/social-ads/specs.test.ts`.
**Socle de cette tâche :** modifier `package.json` et `app/globals.css` ; créer `vitest.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`. Mettre à jour `package-lock.json` uniquement par le gestionnaire de paquets. Réparer la commande actuelle `next lint` pour utiliser ESLint directement, en restant compatible avec Next 16. Introduire Tailwind sans imposer un reset global aux pages existantes.

**Interfaces :** `AdVariant` est une union discriminée des tuples plateforme/placement/type_media/ratio autorisés, pas quatre enums librement combinables. `Ad` porte cette variante, `destination_url`, `creative_ref`, `import_meta` (objectif, angle, feuille, ligne, ordre source) et les médias/cartes enrichis. `FormatSpec` expose ratios, résolution, seuils, plafonds nullable, cartes, safe zones quatre côtés et vues admises. `parseVariant(input: unknown)` renvoie un résultat fermé succès/erreur ; `getSpec(variant: AdVariant): FormatSpec` et `getAllowedRatios(...)` ne font aucun repli. Conserver `tronquer` comme utilitaire partagé.

- [ ] Établir la matrice des 11 placements V1 depuis l'inventaire ; refuser notamment Stories/carrousel et Instagram Reels/image.
- [ ] Tester avant implémentation : Instagram Reels vidéo 9:16, seuil 44, marges 14/35/6/6 %, mobile ; Shorts 9:16 et description 90 ; Facebook Stories/carrousel refusé ; limites d'affichage distinctes des plafonds.
- [ ] Exécuter `npx vitest run lib/social-ads/specs.test.ts`, puis vérifier la coexistence CSS sur `/social`, `/campagne` et `/connexion` localement.

### 2. Persistance additive et compatibilité - FR-011, socle F1/F3/F4/F7

**Modifier :** `lib/social-ads/db.ts`, `app/social/actions.ts`.
**Créer :** `lib/social-ads/legacy.ts`, `supabase/migrations/20261006120000_social_ads_situation.sql`, `docs/social-ads-migration-checks.sql`.
**Test pur associé :** étendre `lib/social-ads/specs.test.ts` pour la conversion legacy.

**Interfaces :** `convertLegacyAd(row):` résultat discriminé `converted` ou `needs_review` avec données sources intactes et motif. `getPlanForOwner` et `getReviewByToken` conservent leur rôle, avec annonces normalisées et diagnostics legacy. `persistImportedPlan(imported, brand): Promise<{planId: string}>` persiste plan et annonces/cartes dans une transaction PostgreSQL owner-validée. `updateAd` vérifie le tuple résultant complet, pas seulement les champs du patch.

- [ ] Ajouter placement/type_media, URL, référence, métadonnées et table `sa_brand_settings` par utilisateur. Conserver `format` historique ; ne pas lui donner une fausse valeur pour YouTube. Prévoir une contrainte qui distingue lignes legacy à revoir et variantes nouvelles validées.
- [ ] Convertir Feed selon ancien format, TikTok reel vers In-feed vidéo, Stories selon média connu ; conserver les cas ambigus et anciens médias vidéo sans perte, avec avertissement dans l'éditeur.
- [ ] Vérifier localement nombre d'annonces, IDs, textes, médias, liens, commentaires et décisions avant/après ; aucune suppression. Contrôler RLS avec deux comptes et anon. Contraintes fermées et cohérence des tuples côté SQL comme côté serveur.
- [ ] Tester conversion déterministe et cas Story ambigu dans la suite specs ; exécuter les requêtes de contrôle sur une base isolée uniquement.

### 3. Paramétrage de marque et création manuelle - F1, FR-001 à FR-005

**Modifier :** `lib/social-ads/db.ts`, `app/social/actions.ts`, `app/social/page.tsx`, `app/social/_components/PlanEditor.tsx`.
**Créer :** `app/social/parametrage/page.tsx`, `app/social/_components/BrandSettings.tsx`.

**Interfaces :** `BrandSettings` = logo nullable + comptes indexés par plateforme (nom, handle). `getBrandSettings(): Promise<BrandSettings | null>` et `saveBrandSettings(settings): Promise<...>` passent par session/RLS. `applyBrandDefaults(ad, settings): Ad` remplit uniquement les champs absents à la création ; aucune propagation rétroactive. Upload logo signé sous `brands/{userId}/...`, vérifié côté serveur.

- [ ] Ajouter l'onglet Paramétrage et son formulaire cinq plateformes ; création manuelle conforme à `AdVariant`.
- [ ] Vérifier E2E : formulaire vide, enregistrement/rechargement, logo, défaut Instagram, surcharge d'une seule annonce, isolation de deux utilisateurs et accès connecté obligatoire.

### 4. Import XLSX pur et parcours d'import - F3, FR-012 à FR-021

**Créer :** `lib/social-ads/import.ts`, `lib/social-ads/import.test.ts`, `app/api/social/import/route.ts`, `app/social/_components/ImportCampaign.tsx`, `tests/fixtures/social-ads/campagne-plateformes.xlsx`, `tests/fixtures/social-ads/campagne-historique-anonymisee.xlsx`.
**Modifier :** `app/social/page.tsx`, `lib/social-ads/db.ts`, `package.json` (lecteur XLSX serveur).

**Interfaces :** `parseCampaignWorkbook(bytes: Uint8Array, filename: string): ImportResult`, sans stockage ni DB. `ImportResult` contient nom, annonces ordonnées et problèmes `{feuille, ligne, colonne, code, message}` ; état fermé valide/partiel/rejeté. `POST /api/social/import` reçoit FormData champ `file`, contrôle session et `.xlsx`, parse, applique marque puis appelle `persistImportedPlan`. Réponse avec planId, nombre importé et rapport ; zéro ligne valide ne crée pas de plan vide.

- [ ] Détecter les en-têtes Plateforme/Texte principal après titres/méta, ignorer Car., mapper les colonnes FR-015 et les cartes Photo n/Fiche n. Refuser une plateforme de ligne contradictoire avec sa feuille.
- [ ] Préserver toutes les chaînes et URL trackées, ordre global stable feuille/ligne, ordre source `#` dans les métadonnées ; les groupes suivent la première apparition de plateforme. Titre de première feuille, sinon nom fichier.
- [ ] Tester classeurs construits en mémoire : accents/casse, titres avant en-têtes, valeurs Format de la convention, feuille Brouillon, feuille ville, colonne manquante, ligne vide, format inconnu, cartes ordonnées et import partiel. La fixture historique dépend de l'obtention du fichier ; ne pas annoncer sa conformité avant comparaison.
- [ ] Exécuter `npx vitest run lib/social-ads/import.test.ts` ; comparer les 12 lignes et tous leurs champs avec la fixture convertie, puis mesurer l'import local <30 s. Montrer le rapport après sélection/dépôt et ne pas conserver le classeur serveur.

### 5. Manifeste et association des visuels - F4, FR-022 à FR-028

**Créer :** `lib/social-ads/manifest.ts`, `lib/social-ads/manifest.test.ts`, `app/social/_components/MediaManifest.tsx`.
**Modifier :** `app/social/actions.ts`, `lib/social-ads/db.ts`, `app/social/_components/PlanEditor.tsx`.

**Interfaces :** `buildMediaManifest(ads: Ad[]): MediaSlot[]` ; chaque slot contient clé, référence, variante média/ratio et destinations `{adId, cardIndex: number | null}`. `matchMediaFiles(slots, filenames)` renvoie associations uniques, fichiers orphelins et collisions, sous formes discriminées. `attachMediaAction(planId, slotKey, storagePath)` recalcule le manifeste serveur et rattache l'objet uniquement aux destinations du plan possédé. Réutiliser `createUploadUrlAction`, avec validation session, propriété, MIME et taille avant signature.

- [ ] Implémenter la clé référence/média/ratio sous réserve de l'arbitrage exposé plus haut ; conserver la référence originale pour affichage. Référence absente : slot spécifique à annonce/carte, jamais clé vide partagée.
- [ ] Tester deux créas compatibles pour six annonces = deux slots ; une créa 4:5/9:16 = deux slots ; image/vidéo distinguées ; quatre cartes, casse/accents/extensions, collisions, orphelins et remplacement partagé.
- [ ] Exécuter `npx vitest run lib/social-ads/manifest.test.ts`. Vérifier E2E dépôt multiple, compteur restant, choix manuel, retour à l'étape et capture vidéo ; fichier incorrect non associé, erreur upload visible.

### 6. Mockups dédiés et intégration éditeur - F5, FR-029 à FR-034

**Modifier :** `app/social/_components/SocialPreview.tsx`, `app/social/_components/PlanEditor.tsx`, `app/social/_components/CopyAssistant.tsx`, `lib/social-ads/copy.ts`, `app/api/social/copy/route.ts`, `app/globals.css`.
**Créer sous `app/social/_components/previews/` :** `PreviewParts.tsx`, `PhoneFrame.tsx`, `FacebookFeed.tsx`, `FacebookStories.tsx`, `FacebookReels.tsx`, `InstagramFeed.tsx`, `InstagramStories.tsx`, `InstagramReels.tsx`, `LinkedInFeed.tsx`, `TikTokInFeed.tsx`, `YouTubeInStream.tsx`, `YouTubeInFeed.tsx`, `YouTubeShorts.tsx`.

**Interfaces :** props communes `{ad: Ad, view: "desktop" | "mobile", showSafeZones: boolean}` ; `SocialPreview` sélectionne exclusivement le renderer correspondant au placement validé. `PreviewParts` regroupe avatar, troncature, média fixe, carte lien et avertissements. La variante remplace l'ancien `format` dans CopyAssistant, CopyInput et la route copy, avec validation du même référentiel.

- [ ] Commencer par YouTube In-stream bureau/mobile puis les autres placements ; compte à rebours simulé sans lecteur, aucune durée média inventée.
- [ ] Afficher ratios exacts, vrais libellés de plateforme, cartes navigables avec textes propres, safe zones et bascule seulement si disponible. Les dépassements sont signalés sans tronquer les données persistées.
- [ ] Revue E2E manuelle des 11 placements à 360 px et bureau, comparaison avec captures réelles ; aucun débordement, contrôle inaccessible ou icône incohérente. Réparer les défauts UI observés sur ce parcours. Tester les anciens médias sans charger de lecteur vidéo.

### 7. Review groupée et édition partagée - F6/F7, FR-035 à FR-044

**Modifier :** `app/preview/[token]/page.tsx`, `app/preview/[token]/_components/ReviewClient.tsx`, `app/preview/[token]/actions.ts`, `app/social/_components/PlanEditor.tsx`, `app/social/actions.ts`, `lib/social-ads/db.ts`.
**Créer :** `app/social/_components/AdTextEditor.tsx`, `lib/social-ads/review.ts`.

**Interfaces :** `EditableAdText` contient seulement texte_principal, titre, description, cta, destination_url. `editPublicAdAction(token, adId, patch: EditableAdText)` retourne l'annonce enregistrée et updated_at ou une erreur explicite. Vérifier token actif/non expiré et appartenance au plan à chaque écriture, rejeter les clés supplémentaires à l'exécution. `groupAdsByPlatform(ads)` conserve l'ordre de première apparition ; `decisionForAd(approvals): "sans_decision" | "approuve" | "revision"` applique la règle unique du plan/export.

- [ ] Sections scrollables, navigation rapide, compteurs sans double comptage, commentaires et décisions existants ; formulaire commun owner/public, plafonds visibles avant sauvegarde.
- [ ] Dernière écriture gagnante, date issue du serveur affichée, mockup rafraîchi ; erreur de sauvegarde visible et texte saisi conservé. Restreindre URL à http/https sans supprimer tracking.
- [ ] Vérifier E2E anonyme à 360 px : commenter, éditer, décider, recharger puis retrouver la correction côté owner ; deux écritures successives et date. Vérifier token invalide/expiré/désactivé, adId d'autre plan et injection médias/plateforme/plan_id : aucun effet.
- [ ] Vérifier plusieurs décisions sur une annonce : total par annonce, priorité révision et statut du plan cohérents.

### 8. Export texte et recette finale - F8, FR-045 à FR-048

**Créer :** `lib/social-ads/export.ts`, `lib/social-ads/export.test.ts`, `app/api/social/export/[planId]/route.ts`, `docs/social-ads-import-template.md`, `docs/social-ads-situation-recette.md`.
**Modifier :** `app/social/_components/PlanEditor.tsx`, `docs/SOCIAL_ADS.md`.

**Interfaces :** `exportPlanText(plan: Plan, ads: Ad[], approvals: Approval[], exportedAt: Date): string` est pur ; utilise `groupAdsByPlatform` et `decisionForAd`. `GET /api/social/export/[planId]` lit les dernières données avec session/RLS et renvoie UTF-8 `text/plain`, Content-Disposition attachment, nom nettoyé ; refus pour non-owner. Le lien public ne permet pas l'export.

- [ ] Blocs étiquetés : nom/date du plan, numéro/ordre, plateforme/placement/média/ratio, textes finaux, CTA, URL, référence, décision, chaque carte avec titre/description. Remplacer U+2014 par tiret simple uniquement dans la sortie export.
- [ ] Tester deux plateformes/12 blocs, ordre et groupes, texte modifié, quatre cartes, accents et URL intactes, décisions multiples, absence de U+2014 et plan vide. Exécuter `npx vitest run lib/social-ads/export.test.ts`.
- [ ] Documenter gabarit, conventions Format, rapport, limites, dédoublonnage proposé et incompatibilité du fichier historique. Conserver le PRD existant sans édition dans cette phase.
- [ ] Recette locale complète : paramétrage → import → deux visuels compatibles → lien anonyme → commentaire/édition/décision → export final. Mesurer <15 min, zéro ressaisie de texte, 100 % des champs conservés.
- [ ] Vérification finale future : `npm run test` (script Vitest run), `npx tsc --noEmit`, `npm run lint`, `npm run build`. Corriger les échecs/flakies observés ; ne pas accéder à la production pour les résoudre. Obtenir la revue visuelle utilisateur pour chaque placement avant de déclarer la fidélité acquise.

## Couverture et sortie attendue

F1 → module 3 ; F2 → modules 1/2 ; F3 → module 4 ; F4 → module 5 ; F5 → module 6 ; F6/F7 → module 7 ; F8 → module 8. Tests automatiques limités aux quatre transformations pures, conversion legacy comprise dans specs. La réussite sur le classeur historique et la règle de dédoublonnage restent des points explicites à résoudre avant leurs tâches dépendantes ; le reste du plan est exécutable localement dans l'ordre indiqué.

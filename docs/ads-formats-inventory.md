# Inventaire des formats publicitaires - référentiel pour les mockups « en situation »

Établi les 5-6 septembre 2026 pour MB Média Ads (Collège Universel). Objectif : lister tous les formats et placements des plateformes visées, en version bureau et mobile, avec leurs specs officielles, pour construire des mockups fidèles à la réalité. Chaque valeur cite sa source et sa date. Quand une spec n'a pas pu être confirmée sur une source fiable, elle est marquée « non trouvé » plutôt qu'estimée.

Légende : ★ = format le plus répandu / prioritaire pour les mockups.

## Vue d'ensemble

| Famille | Plateformes | Formats documentés | Sections du site concernées |
|---|---|---|---|
| Réseaux sociaux - Meta | Facebook, Instagram, Messenger, Audience Network | ~30 combinaisons placement × format | Campagnes réseaux sociaux |
| Réseaux sociaux - autres | YouTube, TikTok, LinkedIn | 7 + 6 + 10 | Campagnes réseaux sociaux |
| SEM | Google Search (RSA + assets), Shopping, Performance Max | ~12 | Section SEM |
| Display | Standards IAB + sites médias du Québec | ~30 tailles + 5 gabarits de site | Section Display / bannières |
| IA conversationnelle | ChatGPT Ads (OpenAI) | 1 | Section ChatGPT |

## Shortlist ★ - ce qui couvre l'essentiel des campagnes réelles

### Réseaux sociaux

| Plateforme | Placement | Formats ★ | Bureau | Mobile | Points clés pour le mockup |
|---|---|---|---|---|---|
| Facebook | Feed | Image 4:5 / 1:1, Vidéo 4:5, Carrousel 1:1 (2-10 cartes), Collection | Oui | Oui | Avatar + nom de Page + « Sponsorisé », texte tronqué ~125 car. (« Voir plus »), carte lien (domaine, titre 27 car., bouton CTA), barre J'aime / Commenter / Partager |
| Facebook | Stories | Image / Vidéo 9:16 | Non | Oui | Barre de progression, safe zones haut 14 % / bas 20 %, CTA en bas |
| Facebook | Reels | Image / Vidéo 9:16 | Non | Oui | Colonne d'icônes à droite, safe zones haut 14 % / bas 35 % / côtés 6 %, CTA bandeau bas |
| Facebook | In-Stream | Vidéo 16:9 ou 1:1 | Oui | Oui | Overlay « Publicité », skip après 5 s, bureau 5-15 s |
| Facebook | Colonne droite | Image 1:1 | Oui | Non (bureau uniquement) | Petit encart, titre 40 car., pas d'engagement |
| Instagram | Feed | Image 4:5, Vidéo, Carrousel 1:1, Collection | Oui (web) | Oui | Handle + « Sponsorisé », texte 125 car., icônes cœur / commentaire / partage / enregistrer |
| Instagram | Stories | Image / Vidéo 9:16 | Non | Oui | Safe zones haut 14 % / bas 35 % / côtés 6 %, CTA bas |
| Instagram | Reels | Vidéo 9:16 (0 s-15 min), texte 44 car. | Non | Oui | Idem Reels FB |
| Messenger | Stories | Image / Vidéo 9:16 | Non | Oui | Idem Stories FB |
| Messenger | Inbox | [RETIRÉ le 11 nov. 2025] | - | - | À trancher : conserver en mode historique ou abandonner |
| YouTube | In-stream skippable | Vidéo 16:9 / 9:16 / 1:1 | Oui | Oui | « Annonce » + compte à rebours « Passer l'annonce » (5 s), companion 300×60 bureau, CTA overlay mobile |
| YouTube | In-feed | Vignette + titre (100 car., 2×40 reco) | Oui | Oui | Ressemble à une reco organique, mention « Annonce » |
| YouTube | Shorts | Vidéo 9:16, description 90 car. | Oui (via feed) | Oui | Boutons latéraux, CTA bas, « Sponsorisé » |
| YouTube | Bumper | Vidéo 6 s non skippable | Oui | Oui | Idem in-stream sans bouton Passer |
| TikTok | In-Feed | Vidéo 9:16 (≥540×960), légende, nom 20 car. | Web = même rendu vertical | Oui | Avatar + @handle + « Commandité », colonne d'actions à droite, CTA bandeau bas, disque audio |
| TikTok | TopView | Vidéo 9:16, 5-60 s, légende 100 car. | Non | Oui | Plein écran à l'ouverture de l'app |
| LinkedIn | Feed | Single Image 1.91:1 / 1:1, Vidéo 16:9 / 1:1 / 4:5 / 9:16, Carrousel 1:1 (2-10) | Oui | Oui | Logo + nom Page + « Promu », intro 150 car. avant troncature, titre 70 car., barre J'aime / Commenter / Republier / Envoyer |

### SEM (Google Search)

| Format ★ | Bureau | Mobile | Points clés pour le mockup |
|---|---|---|---|
| Annonce responsive de recherche (RSA) | Oui | Oui | Libellé « Annonce » + favicon + nom d'annonceur, URL affichée, jusqu'à 3 titres (30 car.) séparés par « \| » en bureau, 1-2 sur mobile, descriptions 90 car., au-dessus des résultats organiques |
| Assets : sitelinks, accroches, extraits, appel, prix, image | Empilés / 2 colonnes | Carrousel horizontal (swipe), bouton d'appel direct | Sitelinks 25 car., accroches 25 car., image 1:1 ou 1.91:1 |
| Shopping | Carrousel produits | Carrousel horizontal | Photo, titre, prix, marchand, étoiles, « Sponsorisé » |

### Display / bannières

| Format ★ | Dimensions | Bureau | Mobile | Emplacement typique sur un site média |
|---|---|---|---|---|
| Big Box / Îlot | 300×250 | Oui | Oui | Colonne latérale, in-article, in-feed |
| Half Page / Double îlot | 300×600 | Oui | Non | Colonne latérale sticky |
| Leaderboard | 728×90 | Oui | Non | Bandeau sous l'entête |
| Billboard | 970×250 | Oui | Non | Bandeau au-dessus de l'entête (premium) |
| Bannière mobile | 320×50 / 300×50 | Non | Oui | Sticky bas d'écran |
| Grande bannière mobile | 320×100 | Non | Oui | Variante plus haute |
| Natif in-feed | variable | Oui | Oui | Entre les articles |
| Interstitiel mobile | 320×480 | Non | Oui | Transition entre pages |

Gabarits de mise en situation recommandés (couvrent ~90 % des cas au Québec) : « Quotidien - Accueil bureau », « Quotidien - Article bureau », « Quotidien - Accueil mobile », « Quotidien - Article mobile », plus une variante « Média régional coopératif » (CN2i : Le Soleil, La Tribune, Le Droit, etc., 4 formats confirmés : 300×250, 728×90, 300×600, 970×250).

### ChatGPT Ads

| Format ★ | Bureau | Mobile | Points clés pour le mockup |
|---|---|---|---|
| Unité « Sponsorisé » sous la réponse | Oui | Oui (même structure) | Bloc séparé sous la réponse, label « Sponsorisé », favicon + nom annonceur, titre, texte court, image carrée, lien, menu « ⋯ ». Specs chiffrées non publiées officiellement (image ≥256×256 rapportée par des tiers) |

## Points à trancher avant le PRD

1. **Messenger Inbox** : placement retiré par Meta le 11 novembre 2025 (sources secondaires convergentes, pas de page officielle). Recommandation : l'abandonner et garder Messenger Stories. À confirmer.
2. **Le Devoir** : aucune spec digitale récupérable (site et kit média en 403). Recommandation : gabarit générique quotidien + les tailles IAB courantes, à vérifier à la main avant le mockup final.
3. **ChatGPT Ads** : format unique confirmé, mais dimensions d'image et plafonds de caractères non publiés officiellement. Recommandation : mocker d'après la description officielle de l'UI, marquer « à re-vérifier » et ajuster quand OpenAI publie les specs.
4. **YouTube mobile** : le bandeau CTA overlay in-player n'a pas de dimensions officielles. À caler sur des captures réelles.
5. **TikTok** : plateforme mobile ; le « bureau » = même lecteur vertical dans un navigateur. Un seul mockup vertical suffit, présenté dans un cadre téléphone.
6. **LinkedIn Text Ads / Dynamic Ads** : bureau uniquement, specs pixel partielles. Priorité basse.
7. **Formats longue traîne** (Marketplace, Business Explore, Explore IG, Audience Network, TopView, LinkedIn Message / Document / Event, Masthead, Outstream, Shopping) : documentés ci-dessous, à placer en V2+.

## Proposition de phasage

- **V1 - réseaux sociaux + workflow** : Meta Feed / Stories / Reels (FB + IG, image / vidéo / carrousel), YouTube (in-stream, in-feed, Shorts), TikTok In-Feed, LinkedIn (image / vidéo / carrousel), en bureau et mobile. Import Excel, étape visuels, page review responsive, édition inline, export texte.
- **V2 - SEM + Display** : RSA bureau / mobile + assets, page de tous les formats IAB, 4 gabarits de mise en situation sur site média + variante coopérative.
- **V3 - ChatGPT + longue traîne** : unité ChatGPT, Messenger Stories, colonne droite FB, In-Stream FB, TopView, LinkedIn Message Ads, Marketplace, etc.

Le détail complet par plateforme suit.

---

# Partie 1 - Réseaux sociaux : Meta


Inventaire des formats publicitaires Meta (Facebook, Instagram, Messenger, Audience Network) pour la construction de mockups fidèles. Sources : Meta Ads Guide (facebook.com/business/ads-guide), Meta Business Help Center, Meta for Developers (Marketing API), recoupés avec des agrégateurs spécialisés quand la page Meta officielle ne restituait pas son contenu (rendu JavaScript). Accès le 2026-09-05. Quand une valeur n'a pas pu être confirmée sur une source fiable, la mention « non trouvé » est utilisée plutôt qu'une estimation.

**Note importante** : le placement **Messenger Inbox** (boîte de réception) a été **retiré par Meta le 11 novembre 2025** (annonce relayée par plusieurs partenaires Meta, cf. section Sources). Il n'est plus achetable depuis cette date, y compris via Advantage+ placements. Il reste documenté ci-dessous à titre historique/patrimonial (annonces déjà diffusées, contexte de compréhension), marqué **[RETIRÉ]**.

Légende : ★ = format le plus répandu / prioritaire pour les mockups.

---

## Facebook

### Feed (fil d'actualité) ★

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | Description | CTA | Média | Durée vidéo | Safe zones | Cartes carrousel | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Facebook | Feed ★ | Image | Bureau + Mobile | 1:1 ou 4:5 (recommandé) ; supporté de 16:9 à 9:16 | 1440x1800 px (4:5) ou 1080x1080/1440x1440 px (1:1) ; min. 600x750 px ; tolérance ratio 3% | 50-150 caractères affichés (plafond dur Meta général : 2200 caractères, coupure « Voir plus » vers ~125 car. sur mobile) | 27 caractères | Non trouvé (souvent masquée en Feed) | Liste complète en section CTA | Image (JPG/PNG, 30 Mo max) | - | - | - | ads-guide/update/image | 2026-09-05 |
| Facebook | Feed ★ | Vidéo | Bureau + Mobile | 4:5 (recommandé) | 1440x1800 px | 50-150 caractères | 27 caractères | Non trouvé | Liste complète en section CTA | Vidéo (MP4/MOV/GIF, H.264, audio AAC stéréo ≥128kbps, 4 Go max) | 1 seconde à 241 minutes | - | - | ads-guide/update/video | 2026-09-05 |
| Facebook | Feed ★ | Carrousel | Bureau + Mobile | 1:1 (tolérance 3%) | Min. 1080x1080 px | 80 caractères / carte | 20 caractères / carte | 18 caractères / carte | Liste complète en section CTA | Image (JPG/PNG, 30 Mo) ou vidéo (MP4/MOV/GIF, 4 Go, 1s-240min) | 1s à 240 min (cartes vidéo) | - | 2 à 10 cartes | ads-guide/update/carousel | 2026-09-05 |
| Facebook | Feed ★ | Collection | Bureau + Mobile | Couverture 1.91:1 à 1:1 | Min. 1080x1080 px | 125 caractères | 40 caractères | Non trouvé | Liste complète en section CTA | Couverture image/vidéo + grille de 3 produits, ouvre une Instant Experience (obligatoire : Storefront, Lookbook, Customer Acquisition ou custom) | - | - | 3 produits affichés sous la couverture (grille), catalogue complet dans l'Instant Experience | ads-guide/update/collection | 2026-09-05 |

### Video Feeds (fils vidéo)

Placement distinct de Feed : diffuse des vidéos publicitaires entre des vidéos organiques, dans un environnement 100% vidéo (onglet vidéos suggérées après visionnage d'une vidéo). Portée de centaines de millions de personnes/mois, taux de complétion légèrement supérieur à Feed, majorité des impressions avec le son activé. Objectifs supportés : Notoriété, Installations d'appli, Engagement, Vues de vidéo, Couverture, Conversions, Trafic.

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte | CTA | Média | Durée vidéo | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Facebook | Video Feeds | Vidéo | Bureau + Mobile | Non trouvé de façon distincte dans le Guide - Meta ne publie pas de fiche technique séparée ; utiliser par prudence les specs Facebook Feed vidéo (4:5, 1440x1800 px) | - | - | - | Vidéo | - | facebook.com/business/help/1559984974021610 (titre de page seul, contenu non restitué) | 2026-09-05 |

### Stories

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | CTA | Média | Durée vidéo | Safe zones | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Facebook | Stories ★ | Image | Mobile uniquement | 9:16 | Non confirmé séparément - par cohérence avec Reels/Messenger Stories, probablement 1440x2560 px | Non trouvé (probablement 125 car., par cohérence avec la vidéo) | Non trouvé (probablement 40 car.) | Liste en section CTA | Image plein écran | - | Haut ~14% / Bas ~20% (par cohérence avec la vidéo) | ads-guide/update/image (placement non isolé lors du fetch) | 2026-09-05 |
| Facebook | Stories ★ | Vidéo | Mobile uniquement | 9:16 | 1440x2560 px | 125 caractères | 40 caractères | Liste en section CTA | Vidéo (MP4/MOV/GIF, H.264, AAC stéréo ≥128kbps, 4 Go max) | 1 seconde à 3 minutes (≤15s affichée intégralement ; au-delà, découpée en plusieurs cartes Stories) | Haut : 14% (~250 px) / Bas : 20% (~340 px) | ads-guide/update/video/facebook-story | 2026-09-05 |

### Reels

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | CTA | Média | Durée vidéo | Safe zones | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Facebook | Reels ★ | Image | Mobile uniquement | 9:16 (tolérance 3%) | 1440x2560 px, min. 600x600 px | 40 caractères | 55 caractères | Liste en section CTA | Image (JPG/PNG, 30 Mo) | - | Haut ~14% / Bas ~35% / Côtés ~6% chacun | ads-guide/update/image/facebook-facebook-reels | 2026-09-05 |
| Facebook | Reels ★ | Vidéo | Mobile uniquement | 9:16 | Non trouvé de façon isolée pour Facebook Reels vidéo (probable alignement sur Instagram Reels : 1440x2560 px, 0s à 15 min) | Non trouvé | Non trouvé | Liste en section CTA | Vidéo | Non confirmé (probable 0s-15min par cohérence avec Instagram Reels) | Haut ~14% / Bas ~35% / Côtés ~6% (par cohérence avec Instagram Reels et l'image FB Reels) | Déduction croisée, non confirmée par une fiche dédiée | 2026-09-05 |

### In-Stream Video ★

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | CTA | Média | Durée vidéo | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Facebook | In-Stream Video ★ | Vidéo | Bureau + Mobile | 16:9 ou 1:1 | Min. 1080x1080 px | 125 caractères | 40 caractères | Liste en section CTA | Vidéo (MP4/MOV/GIF, H.264, AAC stéréo ≥128kbps, 4 Go max) | Bureau : 5-15s. Mobile : 5s à 10 min (insertion mid-roll après 15s de contenu organique ; recommandation Meta : 15s max ; skippable après 5s) | ads-guide/update/video/facebook-instream-video | 2026-09-05 |
| Facebook | In-Stream Video | Image | Bureau + Mobile | Non trouvé (specs distinctes non confirmées) | - | - | - | - | Image | - | ads-guide/update/image/facebook-instream-video (titre de page seul) | 2026-09-05 |

### Marketplace

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | Description | CTA | Média | Durée vidéo | Cartes carrousel | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Facebook | Marketplace | Image | Mobile + Bureau | 1:1 | Min. 1080x1080 px | 125 caractères | 40 caractères | 30 caractères | Liste en section CTA | Image (JPG/PNG, 30 Mo) | - | - | ads-guide/update/image/facebook-marketplace | 2026-09-05 |
| Facebook | Marketplace | Vidéo | Mobile + Bureau | 1:1 | Min. 1080x1080 px, min. 120x120 px | Non trouvé | 25 caractères | Non trouvé | Liste en section CTA | Vidéo (MP4/MOV/GIF, 4 Go max) | 1 seconde à 241 minutes | - | ads-guide/update/video/facebook-marketplace/outcome-awareness | 2026-09-05 |
| Facebook | Marketplace | Carrousel | Mobile + Bureau | 1:1 (tolérance 3%) | Min. 1080x1080 px | 125 caractères/carte | 40 caractères/carte | 20 caractères/carte | Liste en section CTA | Image (30 Mo) ou vidéo (4 Go, 1s-240min) | 1s à 240 min | 2 à 10 cartes | ads-guide/update/carousel/facebook-marketplace | 2026-09-05 |
| Facebook | Marketplace | Collection | Mobile + Bureau | Non trouvé isolément (probable 1.91:1 à 1:1, cohérent avec les autres placements Collection) | - | - | - | - | - | Couverture + grille produits | - | - | Existence confirmée par ads-guide/update/collection (liste de placements), fiche dédiée non ouverte | 2026-09-05 |

### Right Column (colonne de droite, BUREAU uniquement)

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Titre | CTA | Média | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|
| Facebook | Right Column | Image | **Bureau uniquement** (aucune version mobile) | 1:1 | Min. 1080x1080 px ; dimensions mini affichées 254x133 px | 40 caractères | Liste en section CTA (~40 options selon secteur) | Image (JPG/PNG) | ads-guide/update/image/facebook-right-hand-column | 2026-09-05 |

Recommandation Meta explicite : éviter le texte sur l'image, l'encart étant très petit.

### Search Results (résultats de recherche)

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | Description | CTA | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Facebook | Search Results | Image | Bureau + Mobile | 1.91:1 à 1:1 (tolérance 3%) | Min. 1080x1080 px, min. 600x600 px | 125 caractères | 40 caractères | 30 caractères | Liste en section CTA | ads-guide/update/image/facebook-search | 2026-09-05 |
| Facebook | Search Results | Vidéo | Bureau + Mobile | Non trouvé isolément | - | - | - | - | - | ads-guide/update/video/facebook-search (titre seul) | 2026-09-05 |

### Facebook Business Explore

Apparaît sous des posts organiques d'autres Pages ; clic ouvre une section « Découvrir plus dans [catégorie] » avec des annonces d'entreprises apparentées.

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | Description | CTA | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Facebook | Business Explore | Image | Mobile (principalement) | 1.91:1 à 1:1 (tolérance 3%) | Min. 1080x1080 px, min. 600x600 px | 125 caractères | 27 caractères | 27 caractères | Liste en section CTA | ads-guide/update/image/facebook-biz-disco-feed | 2026-09-05 |

### Groupes Facebook (Groups Feed)

Placement confirmé comme existant (mentionné explicitement comme placement disponible pour le format Carrousel : « Facebook Groups Feed »), mais Meta ne publie pas de fiche de specs dédiée et isolée dans l'Ads Guide accessible. **Non trouvé** pour les valeurs précises ; par défaut, il hérite vraisemblablement des specs Facebook Feed (image 4:5/1:1, vidéo 4:5).

---

## Instagram

### Feed ★

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | CTA | Média | Durée vidéo | Cartes carrousel | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Instagram | Feed ★ | Image | Mobile (app) + affichage bureau via web/embed | 4:5 (recommandé) ; supporté 400x500 à 191x100 (tolérance 1%) | 1440x1800 px, min. largeur 500 px | 125 caractères | 40 caractères | Liste en section CTA | Image (JPG/PNG, 30 Mo) | - | - | ads-guide/update/image/instagram-feed | 2026-09-05 |
| Instagram | Feed ★ | Vidéo | Mobile + bureau | Non isolé lors du fetch - par cohérence avec l'image, 4:5 (1440x1800 px) | - | Non trouvé isolément (probablement 125 car., cohérent avec le reste d'Instagram) | Non trouvé | Liste en section CTA | Vidéo (MP4/MOV, H.264) | Non confirmé isolément | - | Existence confirmée (ads-guide/update/video/instagram-feed), contenu détaillé non restitué | 2026-09-05 |
| Instagram | Feed ★ | Carrousel | Mobile + bureau | 1:1 (cohérent avec Facebook Feed carrousel) | Min. 1080x1080 px | 80 caractères/carte (par cohérence FB) | 20 caractères/carte | Liste en section CTA | Image ou vidéo | 1s-240min (cartes vidéo) | 2 à 10 cartes | Existence confirmée (ads-guide/update/carousel), specs détaillées non isolées pour IG Feed spécifiquement | 2026-09-05 |
| Instagram | Feed ★ | Collection | Mobile + bureau | Couverture 1.91:1 à 1:1 | Min. 1080x1080 px, min. 500x500 px | 125 caractères | 40 caractères | Liste en section CTA | Couverture image/vidéo + grille de 3 produits, Instant Experience obligatoire (Storefront ou Customer Acquisition) | - | 3 produits sous la couverture | ads-guide/update/collection/instagram-feed | 2026-09-05 |

### Stories ★

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | CTA | Média | Durée vidéo | Safe zones | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Instagram | Stories ★ | Image | Mobile uniquement | 9:16 (par cohérence, non isolé précisément) | Non isolé - probable 1440x2560 px (cohérent avec la vidéo IG Stories) | Non trouvé isolément | Non trouvé isolément | Liste en section CTA | Image plein écran | - | Haut 14% / Bas 35% / Côtés 6% (par cohérence avec la vidéo) | Existence confirmée (ads-guide/update/image/instagram-story), contenu détaillé non isolé | 2026-09-05 |
| Instagram | Stories ★ | Vidéo | Mobile uniquement | 9:16 | 1440x2560 px, min. largeur 250 px, tolérance ratio ±1% | 125 caractères | Non trouvé isolément (probable 40 car.) | Liste en section CTA | Vidéo (MP4/MOV/GIF, H.264, AAC stéréo ≥128kbps, 4 Go max) | 1 seconde à 60 minutes (<16s affichée intégralement ; au-delà, découpée en plusieurs cartes) | Haut : 14% / Bas : 35% / Côtés : 6% chacun | ads-guide/update/video/instagram-story | 2026-09-05 |

### Reels ★

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | CTA | Média | Durée vidéo | Safe zones | Restrictions | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Instagram | Reels ★ | Vidéo | Mobile uniquement | 9:16 | 1440x2560 px ; largeur min. 250 px (<30s) ou 500 px (≥30s) | 44 caractères maximum | Liste en section CTA | Vidéo (MP4/MOV, H.264, AAC stéréo ≥128kbps, 4 Go max) | 0 seconde à 15 minutes | Haut : 14% / Bas : 35% / Côtés : 6% chacun (évite le chevauchement avec icône profil et CTA) | Pas de musique sous licence, pas d'effets caméra/visage, pas de GIF, pas de tags produit, pas de Reels publiés avant le 15/10/2021 | ads-guide/update/video/instagram-reels | 2026-09-05 |
| Instagram | Reels | Image | Mobile uniquement | 9:16 | Non isolé - probable 1440x2560 px | Non trouvé | Liste en section CTA | Image | - | Probable Haut14%/Bas35%/Côtés6% (cohérence) | - | Non confirmé par une fiche dédiée isolée | 2026-09-05 |

### Explore / Explore home

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | Hashtags | CTA | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Instagram | Explore home | Image | Mobile uniquement | 4:5 | 1440x1800 px, min. largeur 500 px, tolérance 1% (plage 400x500 à 191x100) | 125 caractères | 40 caractères | 30 max | Liste en section CTA | ads-guide/update/image/instagram-explore-home | 2026-09-05 |
| Instagram | Explore (grille) | Image | Mobile uniquement | Non trouvé isolément (fiche existante mais contenu non restitué au fetch ; la page distincte « instagram-explore » existe séparément de « instagram-explore-home ») | Non trouvé | Non trouvé | Non trouvé | Non trouvé | Liste en section CTA | Existence confirmée : ads-guide/update/image/instagram-explore | 2026-09-05 |
| Instagram | Explore | Vidéo | Mobile uniquement | Non trouvé isolément | Non trouvé | Non trouvé | Non trouvé | - | Liste en section CTA | Existence confirmée : ads-guide/update/video/instagram-explore | 2026-09-05 |

### Résultats de recherche (Search Results)

Les annonces apparaissent dans les résultats quand l'utilisateur tape un mot-clé dans la barre de recherche Instagram. Existence confirmée par plusieurs sources tierces croisées avec la nomenclature Meta Ads Guide, mais **aucune fiche de specs chiffrées n'a pu être ouverte avec succès** (page non trouvée / contenu non restitué). Recommandation prudente pour un mockup : aligner sur Instagram Feed (4:5, 1440x1800 px, primary 125/titre 40) en l'absence de spec officielle isolée. **Non trouvé** pour les valeurs propres à ce placement.

### Profil (Profile Feed)

Annonces apparaissant dans le fil du profil d'un compte. Existence confirmée (pages « Awareness/Traffic Image Ad Specs on Instagram Profile Feed » référencées par Meta), mais le contenu détaillé n'a pas pu être récupéré (erreurs 404 au fetch direct, probablement lié à une redirection nécessitant une session connectée). **Non trouvé** pour les valeurs chiffrées précises ; probable alignement sur Instagram Feed (4:5).

---

## Messenger

### Inbox (boîte de réception) - [RETIRÉ le 11 novembre 2025]

Ce placement a été retiré par Meta le 11 novembre 2025 (source : annonces de partenaires Meta relayées par plusieurs agences, cf. Sources ; aucune page Help Center officielle de rétractation n'a pu être ouverte directement, mais la convergence de plusieurs sources indépendantes - LinkedIn, Instagram, blogs spécialisés en marketing - date précisément l'arrêt). Les campagnes en cours ont continué sans cette option (y compris via Advantage+ placements) ; les annonceurs ont dû migrer vers Feed, Stories, Reels, WhatsApp ou les points d'entrée Direct Message.

Specs historiques (fiche Meta Business Help Center « Best Practices for Ads in Messenger Inbox », toujours en ligne à titre documentaire) :
- Les mêmes images que la campagne Facebook Feed peuvent être réutilisées.
- Dans la vue Inbox (liste de conversations), l'image est automatiquement recadrée/masquée au centre en 1:1, quel que soit le ratio d'origine.
- La vue Inbox n'affiche NI titre NI description au clic - seul le champ « Description » (texte principal) est visible ; le message clé doit donc être placé en tout début de ce champ.
- Résolution recommandée usuelle (secondaire) : 1080x1080 px, ratio 1:1.

### Stories

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | CTA | Média | Safe zones | Comportement | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Messenger | Stories | Image | Mobile uniquement | 9:16 (plein écran) | Min. 1080x1080 px, largeur min. 500 px, tolérance ratio 1% (valeur telle qu'affichée par Meta ; en écart avec la résolution 1440x2560 des Stories FB/IG - non harmonisée dans le Guide) | 125 caractères | 40 caractères | Liste en section CTA | Image (JPG/PNG, 30 Mo) | Haut : ~14% (250 px) / Bas : ~20% (340 px) | Annonce image affichée 5 secondes ou jusqu'à sortie de la Story par l'utilisateur | ads-guide/update/image/messenger-story | 2026-09-05 |
| Messenger | Stories | Vidéo | Mobile uniquement | 9:16 | Non isolé - probable 1440x2560 px (cohérence avec Facebook Stories vidéo) | Non trouvé isolément | Non trouvé isolément | Liste en section CTA | Vidéo | Probable Haut14%/Bas20% (cohérence) | - | Non confirmé par une fiche dédiée isolée | 2026-09-05 |

### Sponsored Messages (messages commandités)

Message publicitaire envoyé directement dans une conversation Messenger existante entre la Page et l'utilisateur (nécessite un historique de conversation - opt-in implicite).

| Plateforme | Placement | Format | Texte | Titre | CTA | Source | Date |
|---|---|---|---|---|---|---|---|
| Messenger | Sponsored Messages | Image + texte | 125 caractères (valeur relayée par agrégateurs spécialisés, non retrouvée sur une page Meta officielle directement accessible - à confirmer) | 40 caractères (idem, non confirmé officiellement) | Liste en section CTA | Source secondaire (socialrails.com, agrégateur) recoupée avec la structure générale Meta ; **non confirmé sur une page Meta officielle ouverte avec succès** | 2026-09-05 |

---

## Audience Network

### Native, Bannière et Interstitiel

Trois familles de rendu regroupées par Meta sur une même fiche de specs : Native (intégré au design de l'app/site hôte), Bannière (format rectangle standard, haut/bas d'écran), Interstitiel (plein écran, entre deux écrans/tâches).

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | Description | CTA | Média | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Audience Network | Native / Bannière / Interstitiel | Image | Mobile (in-app), non applicable bureau | 9:16 (valeur affichée par Meta pour cette fiche combinée - à nuancer : la bannière classique est plutôt horizontale dans l'usage réel ; Meta ne détaille pas de ratio séparé par sous-format) | Min. 398x208 px | 125 caractères | 40 caractères | 30 caractères | Liste en section CTA | Image (JPG/PNG, 30 Mo) | ads-guide/update/image/audience-network-native | 2026-09-05 |
| Audience Network | Native / Bannière / Interstitiel | Vidéo | Mobile (in-app) | Non trouvé isolément pour ce sous-ensemble (distinct de Rewarded Video) | Non trouvé | Non trouvé | Non trouvé | Non trouvé | - | Vidéo | Non confirmé par une fiche dédiée isolée | 2026-09-05 |

### Vidéo avec récompense (Rewarded Video)

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Texte principal | Titre | Description | CTA | Média | Durée vidéo | Contexte | Source | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Audience Network | Rewarded Video | Vidéo | Mobile (in-app) | 9:16 | Min. 1080x1080 px | 125 caractères | 40 caractères | 30 caractères | Liste en section CTA | Vidéo (MP4/MOV/GIF, H.264, AAC stéréo ≥128kbps, 4 Go max). Sous-titres NON supportés | 3 à 61 secondes | Modèle opt-in : l'utilisateur accepte de regarder la vidéo en échange d'une récompense (monnaie virtuelle, objet in-app, contenu exclusif, etc.) | ads-guide/update/video/audience-network-rewarded-video | 2026-09-05 |
| Audience Network | Rewarded Video | Image | Mobile (in-app) | Non trouvé isolément | Non trouvé | Non trouvé | Non trouvé | Non trouvé | - | Image | Existence confirmée (ads-guide/update/image/audience-network-rewarded-video), contenu non isolé | 2026-09-05 |

---

## Boutons CTA

### CTA usuels proposés dans Ads Manager (rencontrés sur les fiches placements ci-dessus, liste non exhaustive mais représentative des plus fréquents, dépend de l'objectif de campagne choisi)

En savoir plus (Learn more), Acheter maintenant (Shop now), S'inscrire (Sign up), Télécharger (Download), Réserver maintenant (Book now), Nous contacter (Contact us), S'abonner (Subscribe), Voir plus (Watch more), Envoyer un message (Send message), Obtenir un devis (Get quote), Postuler maintenant (Apply now), Commander maintenant (Order now), Acheter des billets (Buy tickets), Obtenir une offre (Get offer), Obtenir l'itinéraire (Get directions), Appeler maintenant (Call now), Envoyer un message WhatsApp (Send WhatsApp message), Voir le menu (See menu), Écouter maintenant (Listen now), Demander un horaire (Request time), Voir les horaires (Get showtimes), Jouer (Play game), Installer (Install now), Utiliser l'appli (Use app), Faire un don (Donate now), Obtenir des promotions (Get promotions), Suivre la Page (Follow page), Envoyer un cadeau (Send a gift), Rejoindre la chaîne (Join channel).

Note Meta : le libellé du bouton n'est pas personnalisable au-delà de cette liste fermée, et la disponibilité d'un CTA dépend de l'objectif de campagne et du secteur d'activité de l'annonceur.

### Énumération technique complète (Marketing API - Graph API v26.0, `call_to_action_type`, 127 valeurs)

OPEN_LINK, LIKE_PAGE, SHOP_NOW, PLAY_GAME, INSTALL_APP, USE_APP, CALL, CALL_ME, VIDEO_CALL, INSTALL_MOBILE_APP, USE_MOBILE_APP, MOBILE_DOWNLOAD, BOOK_TRAVEL, LISTEN_MUSIC, WATCH_VIDEO, LEARN_MORE, SIGN_UP, DOWNLOAD, WATCH_MORE, NO_BUTTON, VISIT_PAGES_FEED, CALL_NOW, APPLY_NOW, CONTACT, BUY_NOW, GET_OFFER, GET_OFFER_VIEW, BUY_TICKETS, UPDATE_APP, GET_DIRECTIONS, BUY, SEND_UPDATES, MESSAGE_PAGE, DONATE, SUBSCRIBE, SAY_THANKS, SELL_NOW, SHARE, DONATE_NOW, GET_QUOTE, CONTACT_US, ORDER_NOW, START_ORDER, ADD_TO_CART, VIEW_CART, VIEW_IN_CART, VIDEO_ANNOTATION, RECORD_NOW, INQUIRE_NOW, CONFIRM, REFER_FRIENDS, REQUEST_TIME, GET_SHOWTIMES, LISTEN_NOW, TRY_DEMO, WOODHENGE_SUPPORT, SOTTO_SUBSCRIBE, FOLLOW_USER, RAISE_MONEY, SEE_SHOP, GET_DETAILS, FIND_OUT_MORE, VISIT_WEBSITE, BROWSE_SHOP, EVENT_RSVP, WHATSAPP_MESSAGE, FOLLOW_NEWS_STORYLINE, SEE_MORE, BOOK_NOW, FIND_A_GROUP, FIND_YOUR_GROUPS, PAY_TO_ACCESS, PURCHASE_GIFT_CARDS, FOLLOW_PAGE, SEND_A_GIFT, SWIPE_UP_SHOP, SWIPE_UP_PRODUCT, SEND_GIFT_MONEY, PLAY_GAME_ON_FACEBOOK, GET_STARTED, OPEN_INSTANT_APP, AUDIO_CALL, GET_PROMOTIONS, JOIN_CHANNEL, MAKE_AN_APPOINTMENT, ASK_ABOUT_SERVICES, BOOK_A_CONSULTATION, GET_A_QUOTE, BUY_VIA_MESSAGE, ASK_FOR_MORE_INFO, CHAT_WITH_US, VIEW_PRODUCT, VIEW_CHANNEL, GET_IN_TOUCH, ASK_A_QUESTION, START_A_CHAT, CHAT_NOW, ASK_US, WATCH_LIVE_VIDEO, JOIN_LIVE_VIDEO, SHOP_WITH_AI, TRY_ON_WITH_AI (+ variantes non listées par la page consultée pour atteindre 127 valeurs totales déclarées).

Cette énumération technique est plus large que ce qui est réellement proposé dans l'UI d'Ads Manager pour un annonceur donné (filtrage par objectif/secteur/placement) - pour un mockup, se baser sur la liste « CTA usuels » ci-dessus.

---

## Composants d'UI par placement (pour mockups)

### Feed (Facebook et Instagram)

1. En-tête : avatar rond de la Page/du compte + nom de la Page + libellé « Sponsorisé » (Facebook) ou « Sponsorisé » sous le nom de compte (Instagram), horodatage remplacé par ce libellé.
2. Menu contextuel « ... » en haut à droite du post.
3. Texte principal au-dessus du média, tronqué avec « ... Voir plus » si long.
4. Média plein largeur (image, vidéo avec bouton lecture/mute, carrousel avec pagination par points, ou couverture Collection).
5. Carte lien sous le média (formats Image/Vidéo/Collection avec destination externe) : nom de domaine en majuscules gris clair, titre en gras (H3), description grise optionnelle, bouton CTA aligné à droite (ou pleine largeur sur mobile étroit).
6. Barre d'engagement en bas : compteurs J'aime/Commentaires/Partages, puis rangée d'actions J'aime · Commenter · Partager (Facebook) ou cœur/commentaire/partage/enregistrer (Instagram, sans compteur de likes visible par défaut selon réglages).
7. Vidéo : compteur de vues, sous-titres auto activables, barre de progression fine en bas du média.

### Stories (Facebook, Instagram, Messenger)

1. Plein écran vertical 9:16.
2. Barre(s) de progression segmentée en haut (une barre par carte/segment de la Story).
3. Sous la barre : avatar + nom du compte + libellé « Sponsorisé », bouton fermer « X » à droite.
4. Média plein cadre (image ou vidéo en boucle/lecture unique).
5. Zone basse (safe zone) : bouton CTA (texte + flèche, ex. « En savoir plus ↑ ») ou en Instagram une flèche « swipe up » stylisée intégrée au bouton, barre de réponse rapide (« Envoyer un message »), icône avion en papier (partage en DM).
6. Icônes d'interaction Instagram (like/envoyer) alignées à droite ou en bas selon version.

### Reels (Facebook et Instagram)

1. Plein écran vertical 9:16, lecture en boucle automatique avec son.
2. Colonne d'icônes d'engagement à droite : J'aime (cœur), Commenter (bulle), Partager (flèche), Enregistrer (marque-page), menu « ... ».
3. Bas de l'écran à gauche : avatar + nom de compte + libellé « Sponsorisé », légende (caption) tronquée, attribution audio (icône disque + nom du son, souvent « Audio original »).
4. Bouton CTA fixe en bas de l'écran (bande semi-transparente, ex. « Acheter maintenant »).
5. Barre de progression fine tout en haut (défilement entre Reels).

### Carrousel

1. Structure Feed standard (en-tête identique) puis une bande de cartes défilables horizontalement au tap/swipe.
2. Chaque carte : image ou vidéo carrée + titre court en dessous + éventuellement description + son propre lien de destination.
3. Points de pagination ou légère indication de defilement (flèche latérale sur bureau).
4. Bouton CTA global sous la dernière interaction ou par carte selon configuration.
5. Une carte de fin optionnelle peut afficher le logo de la Page en grand avec un CTA récapitulatif.

### Collection

1. Post Feed classique avec image/vidéo de couverture en haut.
2. Grille de 3 vignettes produits directement sous la couverture, dans le même post.
3. Tap sur la couverture ou une vignette ouvre une Instant Experience (expérience plein écran immersive type catalogue, avec grille produits complète, fiches produit, et CTA d'achat).

### Messenger Inbox [RETIRÉ]

1. Apparaissait comme un élément de la liste de conversations : avatar de la Page, nom de la Page, aperçu du texte (description) sur une ligne, horodatage.
2. Image miniature carrée (recadrage centré automatique en 1:1) à droite ou gauche de la ligne selon plateforme.
3. Titre et description complète non affichés dans la liste - visibles seulement après ouverture de la conversation, qui affichait alors un message structuré avec média, texte et bouton CTA.

### Right Column (Facebook, bureau uniquement)

1. Petit encart vertical dans la colonne droite du Feed bureau, hors du flux de publications.
2. Image carrée ou quasi-carrée + titre court à droite ou en dessous + nom de la Page en petit.
3. Bouton CTA discret, taille réduite, pas de zone de commentaires ni de compteurs d'engagement.

### In-Stream Video

1. Overlay pendant la lecture d'une vidéo organique : mention « Publicité » ou compte à rebours de skip (5 secondes) en haut/coin de la vidéo pour les formats skippables.
2. Sous la vidéo, une « carte de reprise » (contextual card) permet de revenir au contenu organique interrompu.
3. Barre de progression vidéo standard du lecteur, contrôles son/plein écran.

---

## Sources

- [Facebook Ads Guide - Update Image](https://www.facebook.com/business/ads-guide/update/image) - 2026-09-05
- [Facebook Ads Guide - Update Video](https://www.facebook.com/business/ads-guide/update/video) - 2026-09-05
- [Facebook Ads Guide - Update Carousel](https://www.facebook.com/business/ads-guide/update/carousel) - 2026-09-05
- [Facebook Ads Guide - Update Collection (en-gb)](https://en-gb.facebook.com/business/ads-guide/update/collection) - 2026-09-05
- [Image Ad Specs - Facebook Right Column](https://www.facebook.com/business/ads-guide/update/image/facebook-right-hand-column) - 2026-09-05
- [Image Ad Specs - Facebook Reels](https://www.facebook.com/business/ads-guide/update/image/facebook-facebook-reels) - 2026-09-05
- [Video Ad Specs - Facebook Stories](https://www.facebook.com/business/ads-guide/update/video/facebook-story) - 2026-09-05
- [Image Ad Specs - Instagram Feed](https://www.facebook.com/business/ads-guide/update/image/instagram-feed) - 2026-09-05
- [Video Ad Specs - Instagram Stories](https://www.facebook.com/business/ads-guide/update/video/instagram-story) - 2026-09-05
- [Video Ad Specs - Instagram Reels](https://www.facebook.com/business/ads-guide/update/video/instagram-reels) - 2026-09-05
- [Image Ad Specs - Instagram Explore home](https://www.facebook.com/business/ads-guide/update/image/instagram-explore-home) - 2026-09-05
- [Image Ad Specs - Instagram Explore (référence, contenu non isolé)](https://www.facebook.com/business/ads-guide/update/image/instagram-explore) - 2026-09-05
- [Image Ad Specs - Instagram Profile Feed (référence, contenu non isolé)](https://www.facebook.com/business/ads-guide/update/image/instagram-profile-feed) - 2026-09-05
- [Image Ad Specs - Messenger Stories](https://www.facebook.com/business/ads-guide/update/image/messenger-story/traffic/website) - 2026-09-05
- [Best Practices for Ads in Messenger Inbox (Meta Business Help Center, historique)](https://www.facebook.com/business/help/2132838610126349) - 2026-09-05
- [Image Ad Specs - Audience Network Native, Banner, Interstitial](https://www.facebook.com/business/ads-guide/update/image/audience-network-native) - 2026-09-05
- [Video Ad Specs - Audience Network Rewarded Video](https://www.facebook.com/business/ads-guide/update/video/audience-network-rewarded-video) - 2026-09-05
- [Video Ad Specs - Facebook In-Stream Video](https://www.facebook.com/business/ads-guide/update/video/facebook-instream-video) - 2026-09-05
- [Image Ad Specs - Facebook Marketplace](https://www.facebook.com/business/ads-guide/update/image/facebook-marketplace) - 2026-09-05
- [Video Ad Specs - Facebook Marketplace](https://www.facebook.com/business/ads-guide/update/video/facebook-marketplace/outcome-awareness) - 2026-09-05
- [Carousel Ad Specs - Facebook Marketplace](https://www.facebook.com/business/ads-guide/update/carousel/facebook-marketplace) - 2026-09-05
- [Image Ad Specs - Facebook Search Results](https://www.facebook.com/business/ads-guide/update/image/facebook-search) - 2026-09-05
- [Image Ad Specs - Facebook Business Explore](https://www.facebook.com/business/ads-guide/update/image/facebook-biz-disco-feed/link-clicks) - 2026-09-05
- [Collection Ad Specs - Instagram Feed](https://www.facebook.com/business/ads-guide/update/collection/instagram-feed) - 2026-09-05
- [About Facebook video feeds ad placement (titre de page, contenu non restitué)](https://en-gb.facebook.com/business/help/1559984974021610) - 2026-09-05
- [About Ad Placements Across Meta Technologies (titre de page, contenu non restitué)](https://www.facebook.com/business/help/407108559393196) - 2026-09-05
- [Available call-to-action buttons in Ads Manager (titre de page, contenu non restitué directement)](https://www.facebook.com/business/help/410873986524407) - 2026-09-05
- [Ad Creative Link Data Call To Action - Meta for Developers (Graph API v26.0)](https://developers.facebook.com/docs/marketing-api/reference/ad-creative-link-data-call-to-action/) - 2026-09-05
- [What Call-to-action Buttons Are Available in Meta Ads Manager (SaveMyLeads, source secondaire)](https://savemyleads.com/blog/other/what-call-to-action-buttons-are-available-in-meta-ads-manager) - 2026-09-05
- [Messenger Inbox ad placement retirement (LinkedIn, annonce de partenaire Meta, source secondaire)](https://www.linkedin.com/posts/f-dconsultancy_metaads-paidsocial-digitalmarketing-activity-7393817465924968449-dcx4) - 2026-09-05
- [Meta Ads update: Messenger inbox placement removed (Embryo, source secondaire)](https://embryo.com/industry-updates/meta-ads-update-messenger-inbox-placement-removed/) - 2026-09-05
- [Facebook Ad Character Limits 2026 (socialrails.com, source secondaire - Sponsored Messages)](https://socialrails.com/blog/facebook-ad-character-limits) - 2026-09-05

---

# Partie 2 - Google : SEM, YouTube, Display responsive


Inventaire exhaustif des formats publicitaires Google (SEM/Search, YouTube, Display responsive) destiné à la construction de mockups fidèles. Sources officielles Google (support.google.com/google-ads, support.google.com/youtube) consultées le 2026-09-05. Quand une valeur précise n'a pas été trouvée sur une page officielle, la mention « non trouvé » est utilisée plutôt qu'une estimation.

Légende : ★ = format le plus répandu / prioritaire pour les mockups.

---

## SEM - Search (specs + rendu bureau + rendu mobile + assets)

### ★ Annonces responsives sur le Réseau de Recherche (RSA - Responsive Search Ads)

Format d'annonce texte standard et quasi unique aujourd'hui sur le Réseau de Recherche (les annonces texte classiques/ETA ne sont plus créables depuis 2022).

| Élément | Quantité | Longueur max | Obligatoire | Détails |
|---|---|---|---|---|
| Titres (headlines) | 3 à 15 (max saisissable 15) | 30 caractères chacun | Oui (min. 3) | Au moins Titre 1 quasi systématiquement affiché |
| Descriptions | 2 à 4 (max saisissable 4) | 90 caractères chacune | Oui (min. 2) | Description 1 quasi systématiquement affichée |
| Chemin d'URL (path 1 et path 2) | 2 champs optionnels | 15 caractères chacun | Non | Ajoutés après le domaine du Final URL pour former l'URL affichée |
| Final URL | 1 | 2 048 caractères | Oui | URL de destination réelle (non affichée) |

Règles de rendu :
- Google sélectionne et teste automatiquement différentes combinaisons de titres/descriptions selon ce qui est prédit comme le plus performant, ou selon l'espace disponible.
- Il est possible d'« épingler » (pin) un titre ou une description à une position fixe (Titre 1/2/3, Description 1/2), mais Google déconseille cette pratique pour la plupart des annonceurs (impact sur l'Ad Strength).
- Tout texte devant apparaître dans 100 % des annonces (ex. mention légale) doit être placé en Titre 1 ou Description 1.
- Chaque caractère d'une langue à largeur double (coréen, japonais, chinois) compte pour 2 caractères.
- Certains titres additionnels peuvent servir d'assets de type lien (comme des sitelinks) au sein de la même annonce, pointant vers le même domaine que le Final URL.

Source : [About responsive search ads](https://support.google.com/google-ads/answer/7684791?hl=en), [Search campaigns specs and format requirements](https://support.google.com/google-ads/answer/17092074?hl=en) - consultées le 2026-09-05.

### Rendu RSA - version BUREAU

Composants d'UI, de haut en bas :
1. Libellé **« Annonce »** (ou « Ad » en anglais ; « Ads » au pluriel s'il y a plusieurs annonces groupées) accolé en petit, en gras, devant l'URL affichée - jamais « Sponsorisé » pour une annonce texte Search classique (le libellé « Sponsorisé » est réservé aux Shopping ads, voir plus bas).
2. **Favicon** du site (petite icône carrée) + **nom de l'annonceur/du domaine** affichés sur la même ligne que le libellé « Annonce ».
3. **URL affichée** (display path) : domaine du site + chemin optionnel (path1/path2), en vert/gris selon le thème.
4. **Titre(s)** : jusqu'à 3 titres affichés, séparés par un tiret vertical « | » ou un point médian, en bleu et cliquables (lien hypertexte), formant une ligne de titre longue.
5. **Description(s)** : 1 à 2 lignes de description en dessous du titre, en texte noir/gris standard.
6. **Extensions/assets** en dessous de la description : sitelinks (jusqu'à 6, sur 1 ou 2 lignes, empilés verticalement ou côte à côte), callouts (jusqu'à 10, séparés par des points, sur une seule ligne), structured snippets (jusqu'à 2 en-têtes visibles), price assets (carrousel de cartes), etc.
7. **Position** : les annonces Search s'affichent au-dessus des résultats organiques (jusqu'à 4 emplacements en haut de page) et/ou en bas de page ; elles sont visuellement identiques aux résultats organiques à l'exception du libellé « Annonce » et de la présence d'extensions.

### Rendu RSA - version MOBILE

Différences clés par rapport au bureau :
1. Libellé **« Annonce »** toujours présent, en haut de l'annonce, au-dessus ou à côté du favicon/nom de domaine (mise en page verticale, plus compacte).
2. **Favicon + nom de domaine** sur leur propre ligne, au-dessus du titre.
3. **Titre** : généralement 1 à 2 titres visibles (moins d'espace horizontal qu'en bureau).
4. **Description** : tronquée plus vite qu'en bureau.
5. **Sitelinks** : jusqu'à 8, affichés en **carrousel horizontal** (swipe gauche/droite) plutôt qu'empilés ; si l'annonce est tout en haut des résultats, un format « pleine largeur », un sitelink par ligne, peut apparaître.
6. **Callouts** : passent à la ligne en mode paragraphe (wrap) plutôt qu'alignés sur une seule ligne comme en bureau.
7. **Call asset** : un bouton d'appel cliquable apparaît sous l'annonce si l'appareil peut passer des appels (vs. bouton « Appelez-nous » + QR code en bureau).
8. **Price assets** : carrousel de cartes scrollable, prix pouvant être tronqués/arrondis (ex. « $12,4K »).

Source : [About sitelink assets](https://support.google.com/google-ads/answer/2375416?hl=en), [About callout assets](https://support.google.com/google-ads/answer/6079510?hl=en), [About call assets](https://support.google.com/google-ads/answer/2453991?hl=en), [How Google search results differ from ads](https://support.google.com/google-ads/answer/1722080?hl=en) - consultées le 2026-09-05.

### Assets / extensions Search - tableau détaillé

| Asset | Quantité min/max | Longueur des champs | Rendu bureau | Rendu mobile | Source |
|---|---|---|---|---|---|
| Sitelinks | min. 2 pour s'afficher, recommandé 6+ | Texte de lien : 25 car. (12 en langue double largeur) ; description : jusqu'à 35 car./ligne (2 lignes optionnelles) | Jusqu'à 6 sitelinks, empilés verticalement ou 2 par ligne | Jusqu'à 8 sitelinks en carrousel swipe ; 1/ligne si tout en haut | [About sitelink assets](https://support.google.com/google-ads/answer/2375416?hl=en) |
| Callouts (accroches) | min. 2, jusqu'à 10 affichables | 25 car. (12 en langue double largeur) | Jusqu'à 4 visibles selon l'espace, séparés par des points sur 1 ligne | Passent en mode paragraphe (wrap) | [About callout assets](https://support.google.com/google-ads/answer/6079510?hl=en) |
| Extraits structurés (structured snippets) | min. 3 valeurs par en-tête, recommandé 4+ ; en-tête choisi parmi une liste fermée (Amenities, Brands, Courses, Degree programs, Destinations, Featured hotels, Insurance coverage, Models, Neighborhoods, Service catalog, Shows, Styles, Types) | Valeur : 25 car. (12 en langue double largeur) - limite non documentée officiellement sur la page produit, confirmée via doc API | Jusqu'à 2 en-têtes affichés simultanément | 1 seul en-tête affiché | [About structured snippet assets](https://support.google.com/google-ads/answer/6280012?hl=en) |
| Appel (call asset) | 1 numéro par niveau (compte/campagne/groupe/annonce) | Numéro au format E.164 strict ; pas de numéros surtaxés/vanité/fax | Bouton « Appeler » sous l'annonce + QR code affichant le numéro | Bouton d'appel cliquable direct sous l'annonce | [About call assets](https://support.google.com/google-ads/answer/2453991?hl=en) |
| Lieu (location asset) | lié à un compte Google Business Profile | Adresse, téléphone, horaires, photos du point de vente | Carte/adresse sous l'annonce | Idem, avec lien « itinéraire » | [About location assets](https://support.google.com/adwords/answer/2404182?hl=en) |
| Prix (price asset) | min. 3 items, recommandé 5+, max. 8 (carrousel) | En-tête : 25 car. ; description : 25 car. ; prix éventuellement tronqué/arrondi sur mobile | Carrousel de cartes sous l'annonce, entièrement visible | Carrousel scrollable, texte potentiellement raccourci | [About price assets](https://support.google.com/google-ads/answer/7065415?hl=en) |
| Promotion | 1 par annonce | Champs (occasion, type de remise %, ou montant, nom du produit/service) : longueurs non documentées précisément (« non trouvé ») ; jusqu'à 2 lignes de texte affichées | Libellé « occasion » en gras + texte promo sous le titre | Idem, format compact | [About promotion assets](https://support.google.com/google-ads/answer/7367521?hl=en) |
| Image | jusqu'à 20 images ; recommandé 4+ dont 1 carré et 1 paysage | Carré (1:1) : min. 300x300 px, recommandé 1200x1200 px ; Paysage (1.91:1) : min. 600x314 px, recommandé 1200x628 px ; JPG/PNG, max 5120 Ko ; pas de texte/logo incrusté | Vignette accolée à l'annonce texte | Idem, taille réduite | [About image assets for Search campaigns](https://support.google.com/google-ads/answer/9566341?hl=en) |
| Formulaire pour prospects (lead form) | 1 par annonce (Search et Performance Max) | Titre : 30 car. ; description : 30 car. ; CTA choisi dans une liste ; lien vers politique de confidentialité obligatoire | Bouton/CTA sous l'annonce ouvrant le formulaire in-app | Idem | [About lead form assets](https://support.google.com/google-ads/answer/9423234?hl=en), [Best practices for lead form assets](https://support.google.com/google-ads/answer/17051443?hl=en) |
| Application (app asset) | 1 app affichée par annonce texte (plusieurs assets possibles, un par store) | Pas de champ texte libre : nécessite Package Name (Android) ou App ID (iOS) + URL fiche store | Lien app store sous l'annonce, redirection automatique Google Play/App Store selon l'appareil | Idem | [About app assets](https://support.google.com/google-ads/answer/2402582?hl=en) |

### ★ Shopping (annonces produits)

| Élément | Spécification |
|---|---|
| Contenu affiché | Photo produit, titre, prix, nom du magasin, avis (étoiles) éventuels |
| Source des données | Flux produit Google Merchant Center (product data specification) |
| Libellé | « Sponsorisé » (ou « Ad »/« Ads ») au-dessus du carrousel de produits |
| Placement | En haut ou à droite des résultats de recherche (bureau), carrousel horizontal scrollable (mobile) |
| Fréquence de mise à jour des données | Flux produit à renvoyer au moins tous les 30 jours |

Source : [About Shopping ads](https://support.google.com/google-ads/answer/2454022?hl=en), [Product data specification](https://support.google.com/merchants/answer/7052112?hl=en) - consultées le 2026-09-05.

### Performance Max - rendu Search

Performance Max n'a pas de format Search dédié : il réutilise le rendu RSA standard sur le Réseau de Recherche, alimenté par les text assets du groupe d'assets.

| Élément | Quantité | Longueur max |
|---|---|---|
| Titres | min. 3, max. 15 | 30 caractères (au moins un titre ≤ 15 car. recommandé) |
| Titre long (long headline) | min. 1, max. 5 | 90 caractères |
| Descriptions | min. 2, max. 5 | 90 caractères |
| Nom de l'entreprise (business name) | 1 | 25 caractères (doit correspondre au domaine ou à la raison sociale vérifiée) |
| Call to action | 1 | Automatique ou choisi dans une liste |
| Chemin d'affichage (display path) | 0 à 2 | 15 caractères chacun |
| Final URL | 1 | - |

Source : [Performance Max campaigns specs and format requirements](https://support.google.com/google-ads/answer/17091269?hl=en) - consultée le 2026-09-05.

---

## YouTube

### ★ In-stream désactivable (skippable in-stream ads)

| Champ | Valeur |
|---|---|
| Durée | Aucune limite min/max en libre-service (Reco. : 15-20 s notoriété, 2-3 min considération) ; en réservation (Google Ads Reservation) : min. 12 s, max. 6 min |
| Skip | Bouton « Passer l'annonce » disponible après 5 secondes de lecture |
| Ratio | 16:9 (horizontal), 9:16 (vertical), 1:1 (carré) |
| Résolution recommandée | 1080p : 1920x1080 (horizontal), 1080x1920 (vertical), 1080x1080 (carré) |
| Résolution minimale | 720p : 1280x720 (horizontal), 720x1280 (vertical), 480x480 (carré) |
| Placement | Avant, pendant ou après une autre vidéo, sur YouTube et sur les sites/apps du réseau vidéo partenaire Google |
| Companion banner (bureau) | Optionnel, 300x60 px, JPEG/GIF/PNG, max 150 Ko, affiché à côté du lecteur |
| Formats vidéo acceptés | MP4, MOV, WMV, AVI, FLV, WebM, MPEG-4, etc. ; taille max 256 Go |

Source : [Skippable in-stream ads](https://support.google.com/google-ads/answer/6055025?hl=en) - consultée le 2026-09-05.

#### Rendu bureau
Lecteur YouTube classique : vidéo plein cadre du player, mention « Annonce » en haut à gauche du player pendant la lecture, compte à rebours puis bouton « Passer l'annonce » en bas à droite du player, companion banner 300x60 px optionnel à droite du player (sidebar), nom de l'annonceur + lien affiché sous le player ou en overlay bas.

#### Rendu mobile
Lecteur plein écran ou intégré au fil (app YouTube) : mention « Annonce », compte à rebours/bouton « Passer » superposé en bas du player (zone tactile), pas de companion banner (remplacé par un CTA overlay in-player type bandeau cliquable en bas de la vidéo menant au site annonceur), durée du compte à rebours identique (5 s).

### In-stream non désactivable (non-skippable in-stream ads)

| Champ | Valeur |
|---|---|
| Durée | 7 à 15 secondes (standard) ; 16 à 30 secondes uniquement en Connected TV (30 s = format horizontal uniquement) |
| Skip | Aucun bouton, lecture forcée jusqu'à la fin |
| Ratio | 16:9 (horizontal), 9:16 (vertical), 1:1 (carré) ; 4:3 et 2:3 tolérés mais non recommandés |
| Résolution recommandée | 1080p (mêmes valeurs que skippable) |
| Résolution minimale | 720p (mêmes valeurs que skippable) ; SD 640x480 minimum absolu, non recommandé |
| Placement | Avant, pendant ou après une vidéo, sur YouTube (bureau, mobile, apps) et Connected TV |

Source : [Non-skippable in-stream ads](https://support.google.com/google-ads/answer/11462260?hl=en) - consultée le 2026-09-05.

### ★ Bumper (6 secondes)

| Champ | Valeur |
|---|---|
| Durée | 6 secondes maximum (non désactivable) |
| Ratio | 16:9, 9:16, 1:1 |
| Résolution | Identique aux in-stream (reco. 1080p, min. 720p) |
| Placement | Avant, pendant ou après une vidéo, YouTube + réseau vidéo partenaire |
| Usage typique | Notoriété/reach, complément de campagnes skippable |

Source : [Non-skippable in-stream ads](https://support.google.com/google-ads/answer/11462260?hl=en) - consultée le 2026-09-05.

### ★ In-feed (ex-Discovery / vidéo dans le fil)

| Champ | Valeur |
|---|---|
| Titre | Jusqu'à 100 caractères saisissables ; au-delà de 25 caractères, peut être tronqué sur certains appareils ; recommandé : 2 lignes de 40 caractères |
| Description | Jusqu'à 2 lignes de 35 caractères max chacune ; n'apparaît pas sur les pages de visionnage bureau ni sur TV |
| Vignette (thumbnail) | 4 miniatures auto-générées proposées au choix, ou vignette personnalisée via YouTube Studio |
| Durée vidéo | Aucune limite stricte (reco. 15-20 s notoriété, 2-3 min considération) ; min. 12 s pour activer remarketing/analytics |
| Placements | Résultats de recherche YouTube (au-dessus des résultats organiques), page « À suivre » (watch next, en tête ou entre les vidéos suggérées), fil d'accueil YouTube (1re vidéo recommandée ou entre les vidéos), fil d'abonnements (mobile/tablette) |
| Clic | Redirige vers la page de visionnage YouTube de la vidéo annonce (pas directement vers le site) |

Source : [In-feed video ads](https://support.google.com/google-ads/answer/6227733?hl=en) - consultée le 2026-09-05.

#### Rendu bureau
Apparaît comme une vignette classique de résultat/suggestion avec petit encart vidéo, titre sur 2 lignes, nom de la chaîne annonceur, mention « Annonce » sous la vignette ; ressemble visuellement à une recommandation vidéo organique.

#### Rendu mobile
Même logique en carte verticale dans le fil (accueil, recherche, à suivre, abonnements) ; titre tronqué plus vite (interface plus étroite), mention « Annonce » toujours visible sous/à côté de la vignette.

### ★ Shorts ads

| Champ | Valeur |
|---|---|
| Ratio recommandé | 9:16 (vertical) - obligatoire pour un rendu plein écran natif |
| Ratio horizontal | Accepté mais affiché avec un flou en haut/bas (letterboxing flouté) dans le fil Shorts |
| Durée | Jusqu'à 3 minutes acceptées, mais seules les 60 premières secondes sont lues dans le fil Shorts ; recommandé : moins de 60 secondes |
| Overlay | À 50 secondes, un overlay propose de regarder la suite sur la page de visionnage classique |
| Description | Limitée à 90 caractères saisis (utilise nom de chaîne + description de l'annonceur) |
| Son | Fortement recommandé (musique/voix), +20 % de conversions constaté selon Google |
| Placement | Fil Shorts (entre les vidéos courtes), également diffusable sur bureau/tablette/Connected TV mais les bonnes pratiques restent celles du mobile |
| UI | Boutons latéraux type Shorts (like, commentaires, partager), bouton CTA en bas de l'écran, nom de la chaîne annonceur en overlay bas-gauche, mention « Sponsorisé »/« Annonce » |

Source : [YouTube Shorts ads: Asset specs and best practices](https://support.google.com/google-ads/answer/16041697?hl=en) - consultée le 2026-09-05.

### Masthead

| Champ | Valeur |
|---|---|
| Formats | Vidéo native (auto-play muet) ou diffusion en direct (livestream) |
| Ratio image recommandé | Carré (1:1) pour une couverture optimale ; tolérance de ratio 0,6 à 1,4 |
| Ratio vidéo | 16:9, résolution 1920x1080 px |
| Textes | Titre : ≤ 40 caractères ; Description : ≤ 60 caractères ; CTA : ≤ 15 caractères |
| Placement | Page d'accueil YouTube (tous appareils) et page d'accueil Google TV (Connected TV) |
| Modèles de tarification | CPM Masthead (volume d'impressions réservé) ou CPH Masthead (Share-of-Voice 100 % pendant les heures réservées) |
| Non supporté | Vidéos 360°, campagnes d'installation d'appli ; support limité pour les Premieres YouTube |

Source : [YouTube Masthead](https://support.google.com/google-ads/answer/9709826?hl=en), [Video ads specs and format requirements](https://support.google.com/google-ads/answer/17091270?hl=en) - consultées le 2026-09-05.

### Outstream

| Champ | Valeur |
|---|---|
| Lecture | Vidéo qui s'affiche hors lecteur YouTube, sur des sites/apps du Display/réseau partenaire (mobile principalement) |
| Autoplay | Démarre automatiquement en muet dès que 50 % du bloc pub est visible à l'écran ; se met en pause si l'utilisateur scrolle hors champ |
| Son | Coupé par défaut ; activation par clic/tap de l'utilisateur |
| Skip | Non skippable à proprement parler (l'utilisateur peut simplement scroller pour ne plus la voir) |
| Dimensions | Au moins 256 px sur chaque dimension (exceptions : 300x250 et 320x180) |
| Ratio | 4:3 ou 16:9 (horizontal) ; 3:4 ou 9:16 (vertical) - sinon l'annonce ne peut pas être diffusée |
| Fin de lecture | Le bloc reste affiché avec un bouton « Rejouer » |
| Emplacement | Uniquement dans le corps principal de la page (jamais sidebar, header ou footer) |

Source : [Requirements for non-in-stream video ads](https://support.google.com/admanager/answer/9607167?hl=en) - consultée le 2026-09-05.

---

## Display responsive

### ★ Responsive Display Ads (RDA)

| Asset | Quantité | Spécification |
|---|---|---|
| Titres courts (short headlines) | Jusqu'à 5 | 30 caractères chacun |
| Titre long (long headline) | 1 | 90 caractères |
| Descriptions | Jusqu'à 5 | 90 caractères chacune |
| Nom de l'entreprise (business name) | 1 | 25 caractères (aligné sur la spec Performance Max/RSA ; non retrouvé de valeur distincte sur la page RDA dédiée) |
| Images marketing (paysage 1.91:1) | Jusqu'à 20 (min. 1 requise) | Recommandé 1200x628 px, min. 600x314 px, max 5120 Ko, JPG/PNG |
| Images carrées (1:1) | Jusqu'à 20 (min. 1 requise) | Recommandé 1200x1200 px, min. 300x300 px, max 5120 Ko |
| Logos | Jusqu'à 5 (optionnel) | Carré (1:1) : recommandé 1200x1200 px, min. 128x128 px ; Paysage (4:1) : recommandé 1200x300 px, min. 512x128 px ; max 5120 Ko ; marge blanche ≤ 1/16e de la taille du logo |
| Vidéos | Optionnel (support ajouté aux formats avancés) | Non trouvé de spec pixel précise sur la page RDA de base |
| CTA | 1 | Automatique ou choisi dans une liste |
| Final URL | 1 | - |

Source : [Manage your responsive display ads](https://support.google.com/google-ads/answer/9050310?hl=en), [Create a responsive display ad](https://support.google.com/google-ads/answer/7005917?hl=en), [Responsive display ads specs and format requirements](https://support.google.com/google-ads/answer/17090561?hl=en) - consultées le 2026-09-05.

### Rendu natif vs bannière

- **Rendu natif** : Google assemble automatiquement titre(s), description(s), image/logo et nom de l'entreprise dans un gabarit qui épouse le design du site éditeur hôte (ex. carte article avec image + titre + description, mise en page « in-feed »). C'est le rendu par défaut recherché par le format responsive.
- **Rendu bannière statique** : sur certains emplacements (notamment quand l'espace correspond à un format IAB standard : 300x250, 728x90, 160x600, etc.), Google peut composer une bannière image classique à partir des mêmes assets (image + logo + titre superposés), plus proche d'une display ad traditionnelle qu'un habillage natif.
- Le moteur choisit dynamiquement combinaison d'assets + gabarit + taille selon l'inventaire disponible sur chaque page/app du Réseau Display, dans la limite du champ voir « A new look for responsive display ads » qui a modernisé le rendu par défaut (fond neutre, image mise en avant).

Source : [A new look for responsive display ads](https://support.google.com/google-ads/answer/9975738?hl=en), [About advanced format options for responsive display ads](https://support.google.com/google-ads/answer/9848687?hl=en) - consultées le 2026-09-05.

---

## Composants d'UI par placement (pour mockups)

### Search - bureau
- Bloc favicon + nom de domaine, libellé « Annonce » en gras juste avant/à côté de l'URL affichée.
- URL affichée en vert/gris (domaine + path1/path2).
- Titre en bleu, cliquable, jusqu'à 3 segments séparés par « | ».
- Description(s) en texte standard, 1 à 2 lignes.
- Extensions sous la description : sitelinks (empilés ou 2 colonnes), callouts (ligne de points), structured snippets (en-tête + valeurs), price/promotion (cartes/carrousel).
- Positionnement : au-dessus des résultats organiques (jusqu'à 4 slots) et/ou en bas de page.

### Search - mobile
- Même hiérarchie verticale compacte : libellé « Annonce » + favicon/domaine sur leur propre ligne, puis titre, puis description.
- Sitelinks en carrousel horizontal swipe (jusqu'à 8).
- Callouts en paragraphe avec retour à la ligne.
- Bouton d'appel direct (call asset) sous l'annonce.
- Carrousel de prix scrollable horizontalement.

### Shopping
- Carrousel horizontal de cartes produit : image carrée/portrait, titre produit tronqué, prix, nom du marchand, étoiles d'avis optionnelles.
- Libellé « Sponsorisé » au-dessus du carrousel.

### YouTube in-stream (skippable/non-skippable/bumper)
- Player vidéo plein cadre.
- Mention « Annonce » superposée en haut à gauche pendant la lecture.
- (Skippable uniquement) Compte à rebours puis bouton « Passer l'annonce » en bas à droite du player.
- Companion banner 300x60 optionnel à droite du player (bureau uniquement).
- CTA overlay bas de player (nom annonceur + bouton, souvent « En savoir plus » ou « Visiter le site »).

### YouTube in-feed
- Carte vidéo dans un fil (recherche, accueil, à suivre, abonnements) : vignette + play button superposé, titre 2 lignes, nom de la chaîne, mention « Annonce ».

### YouTube Shorts
- Plein écran vertical 9:16.
- Colonne de boutons d'interaction à droite (like/commentaire/partager, spécifiques à l'expérience Shorts).
- Nom de chaîne annonceur + texte overlay en bas à gauche.
- Bouton CTA en bandeau bas d'écran.
- Mention « Sponsorisé »/« Annonce ».

### Display responsive - natif
- Gabarit « carte » : image (1.91:1 ou 1:1) + logo + titre court + description + nom entreprise, dans le style visuel du site éditeur.

### Display responsive - bannière
- Image/logo + titre superposés dans un format IAB standard (ex. 300x250, 728x90), avec bouton CTA.

---

## Sources (URL + date)

- [About responsive search ads](https://support.google.com/google-ads/answer/7684791?hl=en) - 2026-09-05
- [Search campaigns specs and format requirements](https://support.google.com/google-ads/answer/17092074?hl=en) - 2026-09-05
- [About sitelink assets](https://support.google.com/google-ads/answer/2375416?hl=en) - 2026-09-05
- [About callout assets](https://support.google.com/google-ads/answer/6079510?hl=en) - 2026-09-05
- [About structured snippet assets](https://support.google.com/google-ads/answer/6280012?hl=en) - 2026-09-05
- [About call assets](https://support.google.com/google-ads/answer/2453991?hl=en) - 2026-09-05
- [About location assets](https://support.google.com/adwords/answer/2404182?hl=en) - 2026-09-05
- [About price assets](https://support.google.com/google-ads/answer/7065415?hl=en) - 2026-09-05
- [About promotion assets](https://support.google.com/google-ads/answer/7367521?hl=en) - 2026-09-05
- [About image assets for Search campaigns](https://support.google.com/google-ads/answer/9566341?hl=en) - 2026-09-05
- [About lead form assets](https://support.google.com/google-ads/answer/9423234?hl=en) - 2026-09-05
- [Best practices for lead form assets](https://support.google.com/google-ads/answer/17051443?hl=en) - 2026-09-05
- [About app assets](https://support.google.com/google-ads/answer/2402582?hl=en) - 2026-09-05
- [About Shopping ads](https://support.google.com/google-ads/answer/2454022?hl=en) - 2026-09-05
- [Product data specification](https://support.google.com/merchants/answer/7052112?hl=en) - 2026-09-05
- [Performance Max campaigns specs and format requirements](https://support.google.com/google-ads/answer/17091269?hl=en) - 2026-09-05
- [How Google search results differ from ads](https://support.google.com/google-ads/answer/1722080?hl=en) - 2026-09-05
- [Skippable in-stream ads](https://support.google.com/google-ads/answer/6055025?hl=en) - 2026-09-05
- [Non-skippable in-stream ads](https://support.google.com/google-ads/answer/11462260?hl=en) - 2026-09-05
- [In-feed video ads](https://support.google.com/google-ads/answer/6227733?hl=en) - 2026-09-05
- [YouTube Shorts ads: Asset specs and best practices](https://support.google.com/google-ads/answer/16041697?hl=en) - 2026-09-05
- [YouTube Masthead](https://support.google.com/google-ads/answer/9709826?hl=en) - 2026-09-05
- [Video ads specs and format requirements](https://support.google.com/google-ads/answer/17091270?hl=en) - 2026-09-05
- [Requirements for non-in-stream video ads (outstream)](https://support.google.com/admanager/answer/9607167?hl=en) - 2026-09-05
- [Manage your responsive display ads](https://support.google.com/google-ads/answer/9050310?hl=en) - 2026-09-05
- [Create a responsive display ad](https://support.google.com/google-ads/answer/7005917?hl=en) - 2026-09-05
- [Responsive display ads specs and format requirements](https://support.google.com/google-ads/answer/17090561?hl=en) - 2026-09-05
- [A new look for responsive display ads](https://support.google.com/google-ads/answer/9975738?hl=en) - 2026-09-05
- [About advanced format options for responsive display ads](https://support.google.com/google-ads/answer/9848687?hl=en) - 2026-09-05
- [Google Ads specs: ad formats, sizes, and best practices](https://support.google.com/google-ads/answer/13676244?hl=en) - 2026-09-05

### Points non trouvés / incertains (à vérifier avant mockup final)
- Longueur exacte des champs texte de l'asset Promotion (occasion, nom produit/service) : non documentée précisément sur la page officielle.
- Limite de caractères exacte des valeurs d'extraits structurés (structured snippets) : 25 caractères retrouvée uniquement via la documentation API (AdWords/Google Ads API), pas confirmée telle quelle sur la page d'aide grand public.
- Spécifications vidéo précises (dimensions/poids) pour les Responsive Display Ads avec asset vidéo : non trouvées sur la page de base (mentionnées seulement comme option avancée).
- Nom de l'entreprise (business name) pour RDA : limite de 25 caractères déduite par cohérence avec Performance Max/RSA, non confirmée littéralement sur la page RDA dédiée.
- Dimensions exactes du bandeau CTA « overlay » in-player sur mobile (in-stream) : non documentées avec des valeurs pixel précises par Google (contrairement au companion banner bureau 300x60).

---

# Partie 3 - Display / bannières et sites médias du Québec


Inventaire établi le 2026-09-06. Sources : IAB Technology Laboratory (« New Ad Portfolio »), kits média et pages « publicité » des médias eux-mêmes, plateformes publicitaires en libre-service (pubM32 / M32 Connect, pubLib CN2i), et inspection en direct (code source, tailles de conteneurs d'annonces réellement chargés) des sites de La Presse, Le Journal de Montréal, TVA Nouvelles, Journal Métro, La Tribune et Radio-Canada. Quand une donnée n'a pas pu être confirmée par une source publique, la mention « non trouvé » est utilisée plutôt qu'une valeur inventée.

---

## Standards IAB

Référence : IAB Technology Laboratory, *New Standard Ad Unit Portfolio* (v1.1, juillet 2017, toujours le référentiel en vigueur en 2026 - IAB n'a pas publié de refonte complète depuis). Deux volets : tailles fixes (« Fixed Size Ad Specifications ») et tailles flexibles basées sur des ratios (« Flexible Size Ad Specifications »).

### Tailles fixes recommandées par l'IAB

| ★ | Nom usuel | Dimensions (px) | Ratio (L:H) | Bureau/mobile | Poids max recommandé (chargement initial / sous-chargement) | Formats de fichiers | Statut 2026 |
|---|---|---|---|---|---|---|---|
| ★ | Medium Rectangle (Big Box / MREC) | 300 x 250 | 1:1 (proche) | Bureau + mobile | 150 ko / 300 ko | JPG, PNG, GIF, HTML5 | Standard courant, format le plus vendu au monde |
| ★ | Leaderboard | 728 x 90 | 8:1 | Bureau | 150 ko / 300 ko | JPG, PNG, GIF, HTML5 | Standard courant |
| ★ | Half Page (Double îlot) | 300 x 600 | 1:2 | Bureau | 200 ko / 400 ko | JPG, PNG, GIF, HTML5 | Standard courant, en forte croissance |
| ★ | Wide Skyscraper | 160 x 600 | 1:4 | Bureau | 150 ko / 300 ko | JPG, PNG, GIF, HTML5 | Standard courant mais en déclin (colonnes de contenu plus larges) |
| ★ | Billboard | 970 x 250 | 4:1 (proche) | Bureau | 250 ko / 500 ko | JPG, PNG, GIF, HTML5 | Standard courant, format premium au-dessus de l'entête |
| Super Leaderboard / Pushdown | 970 x 90 | 10:1 | Bureau | 200 ko / 400 ko | JPG, PNG, GIF, HTML5 | Standard courant |
| Portrait | 300 x 1050 | 1:3,5 | Bureau | 250 ko / 500 ko | JPG, PNG, GIF, HTML5 | Standard mais peu répandu au Québec |
| ★ | Mobile Leaderboard / Smartphone Banner | 300 x 50 ou 320 x 50 | 6:1 | Mobile | 50 ko / 100 ko | JPG, PNG, GIF, HTML5 | Standard courant, l'unité mobile la plus répandue |
| ★ | Large Mobile Banner | 320 x 100 | 3:1 | Mobile | 50-75 ko (non normalisé par l'IAB 2017 ; confirmé par les specs Radio-Canada 2022) | JPG, PNG, GIF, HTML5 | Standard courant (extension du 320x50) |
| ★ | Mobile Banner (legacy) | 300 x 50 | 6:1 | Mobile | 50 ko / 100 ko | JPG, PNG, GIF | Standard courant, coexiste avec 320x50 |
| ★ | Mobile Interstitial (portrait) | 320 x 480 | 2:3 | Mobile (app/mobile web) | non trouvé de valeur normée univoque ; Radio-Canada : image 80 ko | JPG, PNG, HTML5 | Courant ; l'IAB 2017 recommande plutôt 640x1136 / 750x1334 / 1080x1920 (interstitiels haute résolution), le 320x480 reste la valeur de référence historique toujours utilisée en pratique |
| Mobile Phone Interstitial (HD) | 640x1136, 750x1334, 1080x1920 | variable (~9:16) | Mobile | 300 ko / 600 ko | JPG, PNG, HTML5 | Standard courant sur app mobile |
| 120x60 (Financial/Button) | 120 x 60 | 2:1 | Bureau | 50 ko / 100 ko | JPG, PNG, GIF | Legacy, rarement vendu seul en 2026 |
| Large Rectangle | 336 x 280 | proche 1:1 (Medium) | Bureau | non normé par l'IAB 2017 (absent du New Ad Portfolio, mais toujours répertorié par Google/AdSense) | JPG, PNG, GIF, HTML5 | Toujours répandu (Google Ad Manager) mais absent des specs éditeurs QC consultés |
| Square | 250 x 250 | 1:1 | Bureau + mobile | non normé | JPG, PNG, GIF, HTML5 | Legacy, peu utilisé au Québec |
| Small Square | 200 x 200 | 1:1 | Bureau + mobile | non normé | JPG, PNG, GIF, HTML5 | Legacy, rare |
| Feature Phone Small/Medium/Large Banner | 120x20, 168x28, 216x36 | variable | Mobile (téléphones à touches) | 5 ko | GIF, JPG | Déprécié (téléphones à clapet obsolètes) |

### Unités flexibles (« Flexible Size Ad Specifications », basées sur des ratios)

| Type | Ratio | Taille de référence (transition depuis le fixe) | Plage min-max (dp) | Poids max init./sous-chargement | Placement typique |
|---|---|---|---|---|---|
| Horizontal | 2:1 | Half Page 300x600 recalculé horizontal | 900x450 - 1800x900 | 250/500 ko | Milieu de page |
| Horizontal | 4:1 | Billboard 970x250 | 900x225 - 1800x450 | 250/500 ko | Haut de page |
| Horizontal | 6:1 | Smartphone Banner 300x50/320x50 | 300x50 - 450x75 | 50/100 ko | Bas d'écran mobile |
| Horizontal | 8:1 | Leaderboard 728x90 | 600x75 - 1200x150 | 150/300 ko | Haut de page |
| Horizontal | 10:1 | Super Leaderboard 970x90 | 900x90 - 1800x180 | 200/400 ko | Haut de page (pushdown) |
| Vertical | 1:2 | 300x600 | 300x600 - 450x900 | 200/400 ko | Colonne latérale |
| Vertical | 1:3 | Portrait 300x1050 | 300x900 - 450x1350 | 250/500 ko | Colonne latérale |
| Vertical | 1:4 | Skyscraper 160x600 | 160x640 - 240x960 | 150/300 ko | Colonne latérale |
| Tuile | 1:1 | Medium Rectangle 300x250 | 300x300 - 450x450 | 150/300 ko | Article, grille, in-feed |
| Plein écran portrait | 9:16, 10:16, 2:3, 3:4 | - | variable, jusqu'à 1200x1920 | 300/600 ko | Interstitiel mobile |
| Plein écran paysage | 16:9, 16:10, 3:2, 4:3 | - | variable, jusqu'à 1920x1200 | 200-300 / 400-600 ko | Interstitiel tablette/vidéo |

### Formats natifs / in-feed

Aucune taille pixel fixe n'est définie par l'IAB pour le natif (IAB Native Advertising Playbook) : l'unité est un « bloc » de contenu (image + titre + marque + accroche) qui hérite de la mise en page éditoriale de l'hôte. Au Québec, tous les grands médias consultés (La Presse « Atelier Direct », Le Journal de Montréal, Métro, Radio-Canada « Fluid/Native ») vendent ce format sous forme de contenu commandité intégré au fil de la page d'accueil ou entre les articles, avec les dimensions d'image imposées par le média (le plus souvent proches de 300x250 ou 16:9 pour la vignette).

---

## Sites médias du Québec

### La Presse (incl. LaPresse+ mobile)

- **Formats display vendus** (source : atelier.lapresse.ca, page « Formats publicitaires », consultée le 2026-09-05) : Îlot 300x250, Double îlot (demi-page) 300x600, Bannière 728x90, Super billboard 970x415, Billboard 970x250, Bannière mobile 300x50. S'y ajoutent des formats non standards : carrousel, carrousel dynamique, collection, native, vidéo pré-roll et vidéo in-text.
- **Emplacements observés en direct** (lapresse.ca, 2026-09-06) : le site prioritise fortement le contenu éditorial et les encadrés de dons/abonnement ; les encarts publicitaires classiques sont peu visibles sur la page d'accueil (modèle financé par dons/abonnements), un encadré de type « îlot » (~300px) apparaît en colonne droite des pages d'article.
- **Structure de page** : bandeau rouge « LA PRESSE » en tête, ligne de navigation noire (ACTUALITÉS, INTERNATIONAL, DIALOGUE, AFFAIRES, SPORTS...), contenu en deux colonnes sur les pages d'article (article ~2/3, colonne droite ~1/3 pour encart/infolettre), fond blanc, structure sobre.
- **Contact/plateforme** : Atelier Direct La Presse (libre-service), pub@lapresse.ca.

### Le Devoir

- **Kit média officiel** : un PDF « Kit média 2020 » existe (ledevoir.com/documents/pdf/media-kit-2020-fr.pdf) mais son accès a été refusé (HTTP 403) à la fois en récupération directe et via navigateur automatisé au moment de la recherche - **non trouvé** en contenu exploitable.
- **Formats display** : Le Devoir a lancé une plateforme publicitaire libre-service avec M32 Connect (pubm32.com/centre-publicitaire/le-devoir-publicite-libre-service/), mais la liste précise des formats n'y est pas publiée en accès libre (page marketing sans grille de tailles). **Non trouvé** de dimensions officielles à jour ; par défaut, les standards IAB Canada les plus répandus (300x250, 728x90, 300x600, 970x250, 320x50) s'appliquent très probablement, comme pour l'ensemble des éditeurs de presse québécois utilisant Google Ad Manager, mais ceci n'est pas confirmé par une source Le Devoir elle-même.
- **Structure de page** : non vérifiable en direct (le site a bloqué l'accès automatisé, HTTP 403 / page blanche). D'après la notoriété publique de la marque : bandeau « LE DEVOIR » en typographie serif, dominante noir/blanc/rouge, mise en page sobre orientée texte. **À confirmer visuellement avant tout mockup final.**

### Le Journal de Montréal / Le Journal de Québec (Québecor)

- **Kit média trouvé** : quebecorexpertisemedia.com propose des PDF « Formats et specs techniques » par titre (ex. `1-JDM-JDQ-Formats-and-specs.pdf`), mais ce document couvre exclusivement les **formats PRINT** (annonces papier en pouces : pleine page, 1/2, 1/3, bandeau de une, etc.) - aucune spec de bannière display numérique n'y figure. **Non trouvé** de PDF public listant les tailles digitales.
- **Emplacements réels confirmés par inspection du code source** (journaldemontreal.com, 2026-09-06) : bandeau publicitaire sticky sous l'entête (`top-ad-multiplex-sticky`, conteneur pleine largeur, comportement de Billboard/Leaderboard), deux blocs « bigbox » collants de 300px de large en colonne latérale (`bigbox-container ... sticky-ad-container`, empilement probable Medium Rectangle 300x250 + Half Page 300x600), et des blocs « multiplex » réservés au mobile (`dfp-multiflex-mobile-only`) pour de la publicité native/in-feed entre les contenus. Technologie ad-serving : Google Ad Manager (`div-gpt-ad`), réseau « SMCO_FRUR_JDM_FR_WEB ».
- **TVA Nouvelles** (même groupe, quebecorexpertisemedia.com) utilise exactement la même architecture publicitaire (`dfp-multiflex-bigbox`, `multiflex-banner-sticky-wrapper`, `multiplex-mobile-only`), confirmée en direct le 2026-09-06 - même famille de formats standards (Big Box 300x250, bannière sticky, natif mobile multiplex).
- **Structure de page** : entête rouge vif avec logo « le Journal de Montréal », nav noire, colonnes 2/3 contenu + 1/3 latérale sur desktop, ton tabloïd (grosses images, gros titres).

### Le Soleil, La Tribune, Le Droit, Le Nouvelliste, Le Quotidien, La Voix de l'Est (CN2i / Les Coops de l'information)

- **Formats confirmés** (source : pubm32.com/centre-publicitaire/les-coops-de-l-information-centre-publicitaire/, consulté 2026-09-06, plateforme libre-service pubLib) : **300x250, 728x90, 300x600, 970x250** - ces quatre formats sont disponibles identiquement sur les six sites du réseau CN2i.
- **Plateforme d'achat** : centrepublicitaire.lescoops.ca (pubLib), pas de grille de poids/formats de fichiers en accès public sans compte - **non trouvé** pour le détail des poids max et formats de fichiers acceptés.
- **Structure observée en direct** (latribune.ca, 2026-09-06) : logo « la Tribune » (« la » en rouge, « Tribune » en noir), bandeau de consentement (Poool) bloquant le rendu initial ; site coopératif à la mise en page classique de quotidien régional.
- Le Soleil n'a pas pu être inspecté en direct dans le temps imparti ; sa structure de page suit vraisemblablement le même gabarit CN2i que La Tribune (même plateforme technique, même régie pubLib).

### Radio-Canada / ICI Radio-Canada.ca (et réseau CBC)

- **Kit officiel trouvé et exploité** : « Publicité plateforme numérique - Instructions techniques », CBC & Radio-Canada Solutions Média (formats-numeriques-solutionsmedia.cbcrc.ca, document 2022-07, toujours la référence en 2026 selon la page Solutions Média). Formats standards listés avec ratio, dimensions, poids et notes d'implantation :

| Nom (doc RC) | Dimensions | Ratio | Poids image / HTML5 | Plateformes |
|---|---|---|---|---|
| Super bannière | 728x90 | - | 50 ko / 100 ko | cbc.ca, ici.radio-canada.ca (bureau/tablette) |
| Billboard | 970x250 | - | 80 ko / 150 ko | bureau uniquement |
| Îlot | 300x250 | - | 50 ko / 100 ko | bureau + mobile + appli |
| Double îlot (demi-page) | 300x600 | - | 80 ko / 150 ko | bureau + mobile + appli |
| Demi-page HTML5 responsive | - | 2:1 | 250 ko / 500 ko | annonces réactives |
| Bannière mobile | 320x50 | 6:1 | GIF/JPEG 40 ko, HTML5 50 ko | mobile (catfish/fixe) |
| Bannière mobile | 320x100 | 3:1 | idem | mobile |
| Interstitiel (Splash) | téléphone 320x480 (portrait) / 480x320 (paysage, CBC seul.) ; tablette 768x1024 / 1024x768 | - | JPG 80 ko, max 2,2 Mo si vidéo en continu | mobile/tablette |
| Maquillage (habillage/skin) | max 2000x1000, min 1304x1000 | - | JPG/GIF 100 ko, PNG 1 Mo | bureau |

- **Emplacements confirmés en direct** (ici.radio-canada.ca, 2026-09-06) : bandeau publicitaire collant en tête de page (`g-adbox-sticky`, `sticky-ads-top`), blocs `AdBox` répétés en colonne (« ad-trailer-column-gutter », probable skyscraper/MREC), et un bloc publicitaire mobile pleine largeur (`unique-ad-xs`, 320px).
- **Structure de page** : dominante rouge/blanc/noir Radio-Canada, nav horizontale par grandes rubriques (Info, Radio, Télé, Sports), colonnes classiques de site d'information public.

### Journal Métro (Montréal)

- **Kit média trouvé mais insuffisant** : « Kit Média 2019 » (journalmetro.com/wp-content/uploads/2019/08/KitMedia2019.pdf) est un document de lectorat/distribution (chiffres d'audience papier et web, réseau de distribution) sans grille de formats display numériques - **non trouvé** de PDF de specs digitales à jour (2019 est daté et ne couvre pas le display).
- **Emplacements confirmés par inspection en direct** (journalmetro.com, 2026-09-06) : bandeau publicitaire collant sous l'entête, conteneur de 970px de large contenant un iframe de **728x90** centré (`section-pub--under-header pub-sticky`) ; bloc **300x250** en colonne (`centered-container`, iframe confirmé à 300x250).
- **Structure de page** : entête blanc avec logo « métro » en vert forêt, nav horizontale (Actualités, M Local, Culture, Inspiration, Immobilier...), disposition classique 2/3 contenu + 1/3 colonne « À ne pas manquer ».

---

## Gabarits de mise en situation recommandés (bureau + mobile)

À partir de l'inventaire ci-dessus, les formats et gabarits suivants suffisent à couvrir la très large majorité des cas réels rencontrés sur les sites médias du Québec.

### Formats à mocker en priorité (couvrent ~90 % des cas)

| ★ | Format | Dimensions | Emplacement type |
|---|---|---|---|
| ★ | Medium Rectangle / Big Box | 300x250 | Colonne latérale (empilé), in-article, in-feed |
| ★ | Half Page | 300x600 | Colonne latérale sticky (souvent empilé sous un 300x250) |
| ★ | Leaderboard | 728x90 | Bandeau sous l'entête, sticky ou non |
| ★ | Billboard | 970x250 | Bandeau au-dessus de l'entête (habillage premium) |
| ★ | Mobile Banner | 320x50 / 300x50 | Bannière sticky en bas d'écran mobile |
| ★ | Large Mobile Banner | 320x100 | Variante mobile plus haute |
| ★ | Native in-feed | variable (vignette ~300x250 ou 16:9) | Entre les articles, fil d'accueil |
| Interstitiel mobile | 320x480 | Transition entre pages, app |

### Gabarits de page à construire

1. **★ Gabarit « Quotidien - Accueil bureau »** : entête coloré (rouge, vert ou bleu selon le média) + nav noire, bandeau Billboard/Leaderboard sticky sous l'entête (970px ou 728px centré), grille d'articles avec image en tête, colonne latérale droite avec Big Box + Half Page empilés en sticky. Couvre La Presse, Journal de Montréal, TVA Nouvelles, Journal Métro, Radio-Canada.
2. **★ Gabarit « Quotidien - Article bureau »** : colonne de texte ~600-700px, MREC in-article après le 2e-3e paragraphe, colonne latérale avec Big Box/Half Page sticky, fil natif in-feed en bas d'article (« à lire aussi »).
3. **★ Gabarit « Quotidien - Accueil mobile »** : entête compact, bannière 320x50/300x50 sticky en bas d'écran, blocs natifs in-feed entre les blocs d'articles (pattern « multiplex »), Big Box 300x250 ponctuel dans le fil.
4. **Gabarit « Quotidien - Article mobile »** : texte pleine largeur, MREC 300x250 in-article, bannière sticky bas d'écran, interstitiel occasionnel entre deux articles.
5. Gabarit secondaire « Média régional coopératif » (CN2i : Le Soleil, La Tribune, Le Droit, Le Nouvelliste, Le Quotidien, La Voix de l'Est) : même logique que le gabarit 1/2 mais limité aux 4 formats confirmés (300x250, 728x90, 300x600, 970x250), sans sticky mobile confirmé.

---

## Tableau récapitulatif par format

| Nom | Dimensions | Ratio | Bureau/mobile | Emplacement typique | Poids/format fichier | Sites QC qui l'utilisent | Source URL | Date |
|---|---|---|---|---|---|---|---|---|
| Medium Rectangle (Big Box / Îlot) | 300x250 | 1:1 (proche) | Bureau + mobile | Colonne latérale, in-article, in-feed | 150 ko init/300 ko sous-chg (IAB) ; 50-80 ko (Radio-Canada) | Radio-Canada, La Presse, Journal de Montréal, TVA Nouvelles, Journal Métro, Le Soleil/La Tribune (CN2i) | iab.com/newadportfolio ; formats-numeriques-solutionsmedia.cbcrc.ca ; atelier.lapresse.ca ; pubm32.com | 2017 (IAB) ; 2022-07 (RC) ; 2026-09-05/06 (inspection) |
| Leaderboard | 728x90 | 8:1 | Bureau | Bandeau sous l'entête, sticky | 150/300 ko (IAB) ; 50-100 ko (RC) | Radio-Canada, Journal Métro (confirmé live), La Presse, Le Soleil/La Tribune (CN2i) | iab.com/newadportfolio ; journalmetro.com (inspection) ; pubm32.com | 2017 ; 2026-09-06 |
| Half Page (Double îlot) | 300x600 | 1:2 | Bureau | Colonne latérale sticky | 200/400 ko (IAB) ; 80-150 ko (RC) | Radio-Canada, La Presse, Journal de Montréal (probable, sticky bigbox), Le Soleil/La Tribune (CN2i) | iab.com/newadportfolio ; atelier.lapresse.ca ; pubm32.com | 2017 ; 2026-09-05/06 |
| Billboard | 970x250 | ~4:1 | Bureau | Bandeau au-dessus de l'entête | 250/500 ko (IAB) ; 80-150 ko (RC) | Radio-Canada, La Presse, Le Soleil/La Tribune (CN2i) | iab.com/newadportfolio ; atelier.lapresse.ca ; pubm32.com | 2017 ; 2026-09-05/06 |
| Super Leaderboard/Pushdown | 970x90 | 10:1 | Bureau | Bandeau sous l'entête | 200/400 ko | non confirmé nommément sur un site QC précis (format IAB générique) | iab.com/newadportfolio | 2017 |
| Wide Skyscraper | 160x600 | 1:4 | Bureau | Colonne latérale | 150/300 ko | non confirmé nommément sur un site QC (probable sur Radio-Canada « AdBox » colonne, non mesuré précisément) | iab.com/newadportfolio | 2017 |
| Super billboard (variante La Presse) | 970x415 | ~2,3:1 | Bureau | Habillage premium | non trouvé | La Presse | atelier.lapresse.ca | 2026-09-05 |
| Mobile Banner | 320x50 / 300x50 | 6:1 | Mobile | Bannière sticky bas d'écran ou catfish | 50/100 ko (IAB) ; 40-50 ko (RC) | Radio-Canada, La Presse (300x50), Journal de Montréal (multiplex mobile) | iab.com/newadportfolio ; atelier.lapresse.ca ; formats-numeriques-solutionsmedia.cbcrc.ca | 2017 ; 2022-07 ; 2026-09-05/06 |
| Large Mobile Banner | 320x100 | 3:1 | Mobile | Bannière mobile | non normé IAB 2017 ; confirmé RC | Radio-Canada | formats-numeriques-solutionsmedia.cbcrc.ca | 2022-07 |
| Mobile Interstitial | 320x480 (portrait) | ~2:3 | Mobile | Transition/app | 80 ko image, 2,2 Mo si vidéo (RC) | Radio-Canada/CBC | formats-numeriques-solutionsmedia.cbcrc.ca | 2022-07 |
| Native in-feed | variable | variable | Bureau + mobile | Fil d'accueil, entre articles | non normé | La Presse (Atelier Direct), Journal de Montréal/TVA (multiplex natif mobile), Radio-Canada (« Fluid/Native »), Métro (publicité native) | atelier.lapresse.ca ; journaldemontreal.com (inspection) ; formats-numeriques-solutionsmedia.cbcrc.ca ; journalmetro.com/wp-content/uploads/2019/08/KitMedia2019.pdf | 2019-2026 |
| Habillage / Skin | max 2000x1000 | - | Bureau | Arrière-plan de page | JPG/GIF 100 ko, PNG 1 Mo | Radio-Canada/CBC | formats-numeriques-solutionsmedia.cbcrc.ca | 2022-07 |
| Formats CN2i (les 4 réunis) | 300x250, 728x90, 300x600, 970x250 | - | Bureau | Emplacements standards (non détaillés publiquement) | non trouvé (poids/formats fichiers) | Le Soleil, La Tribune, Le Droit, Le Nouvelliste, Le Quotidien, La Voix de l'Est | pubm32.com/centre-publicitaire/les-coops-de-l-information-centre-publicitaire/ | 2026-09-06 |
| Formats Le Devoir | non trouvé | non trouvé | non trouvé | non trouvé | non trouvé | Le Devoir (plateforme libre-service M32 Connect existe mais grille non publique) | pubm32.com/centre-publicitaire/le-devoir-publicite-libre-service/ ; ledevoir.com/documents/pdf/media-kit-2020-fr.pdf (403, inaccessible) | 2026-09-06 |
| Formats digitaux Journal de Montréal/Journal de Québec/TVA Nouvelles | non publiés en PDF ; emplacements confirmés = Big Box 300x250 empilé + Half Page probable, bandeau sticky ~728-970 large, natif multiplex mobile | - | Bureau + mobile | Sticky top, sidebar sticky, multiplex mobile | non trouvé | Journal de Montréal, Journal de Québec (probable, même régie), TVA Nouvelles | quebecorexpertisemedia.com (kit PDF = print seulement) ; journaldemontreal.com et tvanouvelles.ca (inspection code source) | 2026-09-06 |

---

## Sources (URL + date)

- IAB Technology Laboratory, *IAB New Standard Ad Unit Portfolio*, juillet 2017 (v1.1) - Fixed Size Ad Specifications : https://www.iab.com/wp-content/uploads/2019/04/IABNewAdPortfolio_LW_FixedSizeSpec.pdf (consulté 2026-09-05)
- IAB Technology Laboratory, Flexible Size Ad Specifications : https://www.iab.com/wp-content/uploads/2019/04/IABNewAdPortfolio_LW_FlexSizeSpec.pdf (consulté 2026-09-05)
- IAB New Ad Portfolio (page de référence) : https://iabtechlab.com/standards/iab-new-ad-portfolio-guidelines/ (consulté 2026-09-05)
- La Presse, Atelier La Presse - Formats publicitaires : http://atelier.lapresse.ca/trousse-de-creation/formats-publicitaires (consulté 2026-09-05)
- Le Devoir, kit média 2020 (PDF, inaccessible - HTTP 403) : https://www.ledevoir.com/documents/pdf/media-kit-2020-fr.pdf ; plateforme libre-service : https://pubm32.com/centre-publicitaire/le-devoir-publicite-libre-service/ (consulté 2026-09-06)
- Québecor Expertise Média, kit média Journal de Montréal / Journal de Québec (formats PRINT uniquement) : https://quebecorexpertisemedia.com/wp-content/uploads/2025/10/1-JDM-JDQ-Formats-and-specs.pdf (consulté 2026-09-06)
- Journal de Montréal, inspection du code source en direct : https://www.journaldemontreal.com/ (consulté 2026-09-06)
- TVA Nouvelles, inspection du code source en direct : https://www.tvanouvelles.ca/ (consulté 2026-09-06)
- Les Coops de l'information (CN2i), pubLib - Centre publicitaire : https://pubm32.com/centre-publicitaire/les-coops-de-l-information-centre-publicitaire/ et https://centrepublicitaire.lescoops.ca/ (consulté 2026-09-06)
- La Tribune, inspection en direct : https://www.latribune.ca/ (consulté 2026-09-06)
- CBC & Radio-Canada Solutions Média, *Publicité plateforme numérique - Instructions techniques* (PDF, 2022-07) : http://formats-numeriques-solutionsmedia.cbcrc.ca/data/2022-07_AdSpecsB2B_Guide_Publicitaire_Radio-Canada_CBC_Fr.pdf (consulté 2026-09-06)
- Radio-Canada, inspection du code source en direct : https://ici.radio-canada.ca/ (consulté 2026-09-06)
- Journal Métro, Kit Média 2019 (lectorat/distribution, pas de specs display) : https://journalmetro.com/wp-content/uploads/2019/08/KitMedia2019.pdf (consulté 2026-09-06)
- Journal Métro, inspection du code source en direct : https://www.journalmetro.com/ (consulté 2026-09-06)

### Limites et zones d'incertitude

- **Le Devoir** : aucune spec digitale officielle n'a pu être récupérée (site et PDF bloquant l'accès automatisé). À vérifier manuellement avant la mise en situation finale.
- **Journal de Montréal / Journal de Québec / TVA Nouvelles** : les formats digitaux exacts ne sont pas publiés en PDF public (seul le kit PRINT est en ligne) ; les emplacements et tailles ci-dessus proviennent de l'inspection du code source en direct (Big Box confirmé, Half Page déduit de l'empilement sticky) et non d'un document officiel de l'annonceur.
- **CN2i (Le Soleil, La Tribune, etc.)** : les 4 formats sont confirmés, mais poids maximaux et formats de fichiers acceptés ne sont pas publiés en accès libre (nécessite un compte pubLib).
- **Le Soleil** n'a pas pu être inspecté en direct dans le temps imparti (probable même gabarit que La Tribune, non vérifié).
- **336x280, 250x250, 200x200** : tailles historiquement répandues sur le marché nord-américain mais non retrouvées dans les kits médias québécois consultés ; incluses dans le tableau IAB à titre de référence générale, marquées « non normé » localement.

---

# Partie 4 - TikTok, LinkedIn, ChatGPT Ads


Date de rédaction : 2026-09-05. Sources priorisées : documentation officielle (ads.tiktok.com/help, business.linkedin.com, linkedin.com/help, openai.com, help.openai.com). Quand une valeur précise n'a pas été trouvée sur une source officielle, elle est marquée **non trouvé**, ou signalée explicitement comme provenant d'agrégateurs tiers (non officiel, à vérifier).

Légende : ★ = format le plus répandu / prioritaire pour les mockups.

---

## TikTok

TikTok est une plateforme nativement **mobile** (app iOS/Android, flux vertical plein écran). Il existe une version web (tiktok.com) qui reproduit le flux dans un lecteur vertical centré au milieu de la page - ce n'est pas un format « bureau » natif au sens d'un design horizontal dédié, seulement le même rendu 9:16 affiché dans un navigateur desktop. La gestion des campagnes se fait sur ads.tiktok.com (bureau), mais le **rendu final de l'annonce vue par l'utilisateur reste mobile/vertical** dans tous les formats ci-dessous, sauf mention contraire.

## In-Feed Ads (Auction) ★

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TikTok | For You Feed (in-feed, auction) | In-Feed Ads (non-Spark) | Mobile (rendu réel) ; web = même rendu vertical | 9:16 (recommandé), 16:9, 1:1 | Vertical ≥ 540×960px (720×1280+ recommandé) ; horizontal ≥ 960×540px ; carré ≥ 640×640px | Nom de compte/marque : max 10 caractères (CN/JP/KR) ou 20 (autres langues). Légende : blanche, police imposée, sans lien cliquable, sans @ ni # | Vidéo (.mp4/.mov/.mpeg/.3gp/.avi, ≤500 Mo, bitrate ≥516 kbps) ou image | Jusqu'à 10 minutes (bonnes pratiques TikTok : cible 21-34s) | Zone déterminée par le format (vertical/horizontal/carré), la longueur de la légende et les add-ons utilisés ; TikTok fournit des gabarits de zone sûre téléchargeables plutôt qu'une valeur px unique officielle | https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads?lang=en | 2026-09-05 |

Détails complémentaires (officiels) :
- Photo de profil (optionnelle) : 98×98px, carré 1:1, .jpg/.jpeg/.png, < 50 Ko, zone sûre interne de 66×66px.
- Non officiel/agrégateurs (à recouper) : marges de zone sûre couramment citées sur canevas 1080×1920 - haut ~108px, bas ~320-370px (barre CTA/légende), droite ~120-140px (colonne d'icônes), gauche ~60px. Ces chiffres ne sont pas repris tels quels sur une page officielle TikTok consultée.

## TopView ★ (parmi les plus visibles, format premium)

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TikTok | Premier écran à l'ouverture de l'app, puis transition vers le flux For You | TopView | Mobile uniquement | 9:16 vertical uniquement | Minimum 540×960px ; recommandé 720×1280 ou 1080×1920 | Nom de compte : max 10 (CN/JP/KR) / 20 (autres). Légende : max 100 caractères, 4 lignes affichées avant « Voir plus » (recommandé 50 CN/JP/KR ou 100 autres) | Vidéo .mp4/.mov/.mpeg/.3gp, ≤500 Mo, bitrate ≥2 500 kbps | 5-60s (recommandé 9-15s) pour non-Spark ; Spark Ads Pull = aucune restriction | Idem In-Feed (zone bas réservée au CTA et à la légende) | https://ads.tiktok.com/help/article/tiktok-reservation-topview | 2026-09-05 |

Particularités : takeover plein écran obligatoire avant préchargement (assets non modifiables une fois préchargés), max 20 annonces par groupe d'annonces, pré-approbation créative obligatoire. Photo de profil : 98×98px 1:1, <50 Ko, zone sûre 66×66px.

## Spark Ads

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TikTok | In-Feed / Search (boost d'un post organique existant, propre ou d'un créateur autorisé) | Spark Ads | Mobile | Celles du post organique d'origine (pas de format créatif propre) | Celles du post organique d'origine | Légende reprise telle quelle du post organique, non modifiable dans Ads Manager, max 4 lignes affichées ; @ cliquable, # autorisé pour campagnes hashtag approuvées | Vidéo .mp4/.mov (formats du post organique) | Aucune restriction (peut dépasser 60s) | Celles du post organique d'origine | https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads?lang=en | 2026-09-05 |

Particularités : nécessite un code d'autorisation généré par le créateur (30 jours standard, jusqu'à 365 jours en accord avec le créateur) ; max 10 000 Spark Ads par compte Ads Manager ; utilisable aussi en TopView et Search Ads.

## Carousel Ads (image carousel / « photo mode »)

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TikTok | In-Feed | Carousel Ads (images) | Mobile | 9:16, 1.91:1, 1:1 | Vertical 720×1280 ; horizontal 1200×628 ; carré 640×640 | Une seule légende + un seul CTA pour l'ensemble des images (URL unique) ; pas de limite de caractères précise trouvée officiellement pour la légende carousel (**non trouvé**) | Images JPG/JPEG/PNG, ≤100 Ko suggéré ; musique de fond **obligatoire** (MP3, ≥2s, ≤10 Mo, lecture en boucle, CML ou upload selon placement) | N/A (images fixes, pas de vidéo dans le carousel standard) | Idem In-Feed | https://ads.tiktok.com/help/article/specifications-for-carousel-ads | 2026-09-05 |

Nombre d'images : Carousel standard min 2 - max 35 ; Carousel VSA (Video Shopping Ads) min 2 - max 20, avec lien produit distinct par image via catalogue.

## Collection Ads (statut : dépréciées)

Les Collection Ads classiques ne sont plus disponibles à la création pour les annonceurs mondiaux (remplacées en 2023 par les Video Shopping Ads, qui combinent vidéo in-feed + fiches produit, dans les régions avec TikTok Shop). Spécifications historiques (pour référence, non actives) : durée recommandée 5-16s ; ratio 9:16 préféré (aussi 1:1, 16:9) ; résolution ≥720×1280 (vertical), 640×640 (carré), 1280×720 (horizontal).

## Search Ads

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TikTok | Résultats de recherche TikTok (extension de placement, ciblée par mots-clés au niveau ad group) | Search Ads Campaign | Mobile | Identique au format vidéo In-Feed, ou Carousel Image | Identique In-Feed / Carousel | Identique au format vidéo ou carousel utilisé | Vidéo (mêmes specs qu'In-Feed) ou Carousel Image ; Spark Ads supportés | Identique In-Feed | Identique In-Feed | https://ads.tiktok.com/help/article/about-search-ads-campaign?lang=en | 2026-09-05 |

Search Ads n'est pas un format créatif à part entière mais un placement additionnel (réutilise les créas In-Feed vidéo ou Carousel). Objectifs supportés : Trafic, Ventes, Génération de leads, Promotion d'application. L'annonce est marquée « Sponsorisé »/« Commandité » dans les résultats de recherche. Budget recommandé : 20x le montant de l'enchère.

## Composants d'UI (pour mockups)

- **Avatar** : rond, en bas de la colonne d'actions à droite, souvent avec un bouton « + » de suivi superposé.
- **@handle** : nom d'utilisateur affiché sous ou à côté de l'avatar, dans le bloc d'infos en bas à gauche de l'écran.
- **Badge « Commandité »/« Sponsorisé »** : remplace l'horodatage habituel, affiché en petit texte gris clair juste sous le @handle.
- **Légende (caption)** : texte blanc, police uniforme non personnalisable, sous le handle, plusieurs lignes possibles avec troncature « ...plus ». Pas de lien cliquable, pas de @ ni # dans les captions in-feed classiques.
- **Icône son/musique** : petit disque rond tournant en bas à droite, au-dessus de la colonne d'actions (obligatoire même pour un carousel silencieux à l'origine, TikTok impose une piste).
- **Colonne d'actions verticale à droite** : avatar (+ bouton follow), cœur (like) + compteur, bulle de commentaire + compteur, icône favoris (bookmark), icône partage + compteur.
- **Bouton CTA** : bandeau plein largeur en bas d'écran (« En savoir plus », « Acheter maintenant », « Télécharger »...) juste au-dessus/à la place de la légende, ou carte produit intégrée (TikTok Shop / VSA).
- **Barre de progression** : fine ligne en haut de l'écran pendant la lecture vidéo.
- Pas de bouton « dislike » ; seul le cœur sert de réaction.

## Sources

- [TikTok Auction In-Feed Ads](https://ads.tiktok.com/help/article/tiktok-auction-in-feed-ads?lang=en) - consulté 2026-09-05
- [TopView ad specifications](https://ads.tiktok.com/help/article/tiktok-reservation-topview) - consulté 2026-09-05
- [Specifications for Carousel Ads](https://ads.tiktok.com/help/article/specifications-for-carousel-ads) - consulté 2026-09-05
- [About Carousel Ads](https://ads.tiktok.com/help/article/carousel-ads?lang=en) - consulté 2026-09-05
- [About Search Ads Campaign](https://ads.tiktok.com/help/article/about-search-ads-campaign?lang=en) - consulté 2026-09-05
- [How to set up a Search Ads Campaign](https://ads.tiktok.com/resources/help/article/how-to-set-up-a-search-ads-campaign-in-tiktok-ads-manager?lang=en) - consulté 2026-09-05
- Non officiel, à titre indicatif uniquement pour recoupement des marges de zone sûre en pixels : admanage.ai, tikadsuite.com, sovran.ai (blogs tiers, 2026) - valeurs non confirmées sur une page officielle TikTok.

---

## LinkedIn

LinkedIn diffuse ses formats à la fois sur **bureau** et **mobile**, sauf mentions contraires (les formats colonne droite - Text Ads, Dynamic Ads - sont **bureau uniquement**, l'app mobile LinkedIn n'a pas de colonne droite).

## Single Image Ad ★

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn | Fil d'actualité + LinkedIn Audience Network (LAN) | Single Image Ad | Bureau ET mobile (le format vertical 1:1.91 est mobile uniquement, ne se livre pas sur bureau) | 1.91:1 (horizontal), 1:1 (carré), 1:1.91 (vertical, mobile only) | Horizontal : min 640×360, max 7680×4320, recommandé 1200×628. Carré : min 360×360, max 4320×4320, recommandé 1200×1200. Vertical : min 360×640, max 2430×4320 (ex. 628×1200, 600×900, 720×900) | Nom annonce (optionnel) : 255 c. Titre/headline : 70 c avant troncature (max 200). Texte d'intro : 150 c avant troncature (max 3000). Description (LAN uniquement) : 100 c avant troncature (max 300) | Image JPG/PNG/GIF, ≤5 Mo | N/A | N/A (format image) | https://www.linkedin.com/help/lms/answer/a426534/single-image-ads-advertising-specifications?lang=en | 2026-09-05 |

URL de destination : max 2000 caractères, préfixe http(s):// obligatoire. 10 options de CTA prédéfinies.

## Video Ad ★

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn | Fil d'actualité + LAN | Video Ad | Bureau et mobile | 16:9 (horizontal), 1:1 (carré), 4:5 (vertical), 9:16 (vertical) | 16:9 recommandé 1920×1080 (min 640×360) ; 1:1 min 360×360 max 1920×1920 ; 4:5 recommandé 720×900 (plage 360×450 à 1080×1350) ; 9:16 recommandé 720×1280 (plage 360×640 à 1080×1920) | Titre : 70 c avant troncature (max 200). Texte d'intro : 150 c avant troncature (max 3000). Nom annonce : 255 c | Vidéo MP4 uniquement, codec H.264 ou VP8, <30 fps, audio AAC/MPEG4 ≤64kHz, 75 Ko à 500 Mo | 3s à 30 min (recommandé 15-30s) ; jusqu'à 90s pour l'in-stream | N/A | https://www.linkedin.com/help/lms/answer/a424737 | 2026-09-05 |

URL de destination max 2000 caractères.

## Carousel Ad ★

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn | Fil d'actualité | Carousel Ad | Bureau et mobile | 1:1 par carte | Recommandé 1080×1080 (affichage final réduit à 312×312), max 4320×4320 | Nom annonce : 255 c. Texte d'intro : 150 c (max 255). Titre par carte : max 2 lignes avant troncature (**valeur en caractères non trouvée officiellement**, LinkedIn indique une limite en lignes). CTA lien : 45 c max | Images JPG, PNG, GIF non-animé, ≤10 Mo par image | N/A | N/A | https://www.linkedin.com/help/linkedin/answer/a427022 | 2026-09-05 |

2 à 10 cartes. Chaque carte peut pointer vers une URL différente, sauf si un Lead Gen Form est utilisé (il s'applique alors à toutes les cartes). URL max 2000 caractères.

## Document Ad

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn | Fil d'actualité | Document Ad | Bureau et mobile (lecture en visionneuse intégrée, feuilletable) | Pas de ratio de page imposé ; les pages doivent toutes partager les mêmes dimensions entre elles | Aucune dimension pixel fixe requise pour les pages (mise en page libre, standard document ou custom) | **Non trouvé** : limites de caractères spécifiques pour le titre/texte d'intro d'un Document Ad (probablement identiques aux specs Sponsored Content standard, non confirmé sur une page officielle dédiée) | PDF uniquement, ≤100 Mo, jusqu'à 300 pages (recommandé <10) | N/A | N/A | https://www.linkedin.com/help/lms/answer/a493903 | 2026-09-05 |

## Event Ad

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn | Fil d'actualité | Event Ad | Bureau et mobile | 4:1 (image d'événement) | **Non trouvé** (résolution exacte non précisée dans les sources consultées) | Nom annonce (optionnel) : 255 c. Texte d'intro : 150 c avant troncature (max 600 sur bureau selon la source) | Image auto-tirée de la page Event LinkedIn (titre, image, détails auto-remplis) | N/A | N/A | https://www.linkedin.com/help/linkedin/answer/a462024/event-ads-advertising-specifications?lang=en | 2026-09-05 |

URL obligatoire = page Event LinkedIn (max 2000 caractères).

## Thought Leader Ads

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn | Fil d'actualité | Thought Leader Ad | Bureau et mobile | Hérite du post original promu (image simple, vidéo, événement, article ou newsletter) - pas de ratio universel | Hérite du post original | Pas de headline ni de texte d'intro ajoutable par l'annonceur ; les modifications ne peuvent venir que de l'auteur du post original ; pas de CTA ni d'URL ajoutés par l'annonceur | Hérite du média du post original | Hérite du post original | N/A | https://www.linkedin.com/help/lms/answer/a1399568 | 2026-09-05 |

Formats non éligibles à la promotion en Thought Leader Ad : célébrations, documents, sondages, posts multi-images, reposts. Objectifs compatibles : Notoriété de marque, Engagement, Vues vidéo.

## Message Ads / Conversation Ads (Messagerie)

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn | Messagerie LinkedIn (boîte de réception) | Message Ads | Bureau et mobile (bannière image optionnelle = bureau uniquement) | 300×250px (bannière, ratio ~6:5) | 300×250px max | Nom annonce : 255 c. Objet : max 60 c. Corps du texte : jusqu'à 1500 c (max 10 emojis). Texte hyperlien : max 70 c. CTA bouton : max 20 c. Pied de page personnalisé : jusqu'à 20 000 c | Bannière image optionnelle : JPG, GIF non-animé, PNG, ≤2 Mo | N/A | N/A | https://www.linkedin.com/help/lms/answer/a425533 | 2026-09-05 |

URL de destination : max 1024 caractères (préfixe http/https). Jusqu'à 3 liens cliquables. Bouton « Non merci » (Not Interested) automatique et obligatoire. **Conversation Ads** (variante interactive à embranchements avec plusieurs boutons de réponse menant à des sous-messages différents) : structure de base similaire (expéditeur, objet, corps, bannière optionnelle) mais **nombre maximal exact de branches/boutons non trouvé** sur les pages officielles consultées - la documentation dédiée séparée n'a pas été atteinte directement (recherche uniquement).

## Text Ads (colonne droite bureau)

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn | Colonne droite (right rail) de pages LinkedIn diverses | Text Ad | Bureau uniquement (pas de rendu mobile, l'app n'a pas de right rail) | 1:1 (image) | 100×100px | Titre : max 25 c. Description : max 75 c. Nom annonce (optionnel) : 255 c | Image JPG/PNG, ≤2 Mo | N/A | N/A | https://www.linkedin.com/help/lms/answer/a423705 | 2026-09-05 |

## Dynamic Ads (Spotlight, Follower)

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn | Colonne droite (right rail) bureau | Spotlight Ad | Bureau uniquement | Carte verticale colonne droite (**dimensions pixel exactes non trouvées** officiellement) | **Non trouvé** | Description (au-dessus des images) : max 70 c | Logo entreprise + photo de profil du membre ciblé (auto-injectée), fond personnalisable optionnel | N/A | N/A | https://www.linkedin.com/help/linkedin/answer/a420342/advertising-specifications-for-dynamic-ads?lang=en | 2026-09-05 |
| LinkedIn | Colonne droite (right rail) bureau | Follower Ad | Bureau uniquement | Carte verticale colonne droite (**dimensions pixel exactes non trouvées**) | **Non trouvé** | Description (au-dessus) : max 70 c. Headline (en dessous) : max 50 c | Logo entreprise + photo de profil du membre ciblé | N/A | N/A | https://www.linkedin.com/help/lms/answer/a420350 | 2026-09-05 |

Spotlight Ad : composants = photo de profil du membre, logo entreprise, headline, bouton CTA, URL de destination (clic n'importe où sur la carte). Follower Ad : bouton « Suivre » en un clic, sans tracking tiers possible (croissance suivie via l'onglet Analytics de la Page).

## Lead Gen Forms (add-on, pas un format autonome)

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| LinkedIn | Ajouté à Single Image, Video, Carousel ou Message/Conversation Ads | Lead Gen Form | Bureau et mobile | Hérite du format hôte | Hérite du format hôte | Nom formulaire : 256 c. Titre offre : 60 c. Détails offre : 70 recommandé (max 160). Politique confidentialité (optionnel) : 2000 c. URL page atterrissage : 2000 c. Message confirmation : 300 c. Champs formulaire : 3-4 recommandé (max 12). Questions personnalisées : jusqu'à 3, 100 c chacune. CTA : 20 c | Formulaire natif pré-rempli avec les données du profil LinkedIn | N/A | N/A | https://www.linkedin.com/help/lms/answer/a423364 | 2026-09-05 |

## Composants d'UI (pour mockups)

- **En-tête** : logo/photo rond de la Page (ou photo de l'auteur pour Thought Leader Ads), nom de la Page, badge « Promu »/« Sponsorisé » (petit texte gris sous le nom, remplace l'horodatage), bouton « ⋯ » (options) et bouton « + Suivre » alignés à droite.
- **Texte d'introduction** : au-dessus du média, tronqué avec « ...voir plus » au-delà de la limite d'affichage.
- **Média** : image / vidéo / carrousel swipable / document feuilletable, pleine largeur du post.
- **Carte lien** (Single Image / Video avec CTA) : bandeau gris clair sous le média avec titre (headline), domaine du site affiché en petit, bouton CTA aligné à droite.
- **Carousel** : cartes défilables horizontalement, chaque carte affichant son titre sous l'image, flèches ou swipe tactile.
- **Barre d'engagement** en bas : réactions (icône « J'aime » + variantes empilables), Commenter, Republier, Envoyer, chacun avec compteur.
- **Text Ads** (colonne droite bureau) : format compact rectangulaire, petite image carrée à gauche, titre + description à droite, pas de barre d'engagement, pas de logo de Page visible.
- **Message/Conversation Ads** : apparaît comme un message entrant dans l'onglet Messagerie - photo + nom de l'expéditeur avec mention « Sponsorisé », bannière image optionnelle, corps de texte, bouton(s) CTA, pied de page mentions légales, bouton « Non merci » systématique.
- **Dynamic Ads** (Spotlight/Follower) : carte verticale colonne droite, photo de profil du membre superposée au logo de l'entreprise, headline, CTA - fortement personnalisée par viewer (nom, poste affichés).

## Sources

- [Single Image Ads Specifications (Marketing Solutions)](https://business.linkedin.com/marketing-solutions/success/ads-guide/single-image-ads) - consulté 2026-09-05
- [Single image ads advertising specifications (LinkedIn Help)](https://www.linkedin.com/help/lms/answer/a426534/single-image-ads-advertising-specifications?lang=en) - consulté 2026-09-05
- [Video ads advertising specifications](https://www.linkedin.com/help/lms/answer/a424737) - consulté 2026-09-05
- [Carousel Ads advertising specifications](https://www.linkedin.com/help/linkedin/answer/a427022) - consulté 2026-09-05
- [Message ads advertising specifications](https://www.linkedin.com/help/lms/answer/a425533) - consulté 2026-09-05
- [Document ads advertising specifications](https://www.linkedin.com/help/lms/answer/a493903) - référencé via recherche, non fetché intégralement, 2026-09-05
- [Event Ads advertising specifications](https://www.linkedin.com/help/linkedin/answer/a462024/event-ads-advertising-specifications?lang=en) - référencé via recherche, 2026-09-05
- [Thought leader ads](https://www.linkedin.com/help/lms/answer/a1399568) - référencé via recherche, 2026-09-05
- [Text Ads - Advertising Specifications](https://www.linkedin.com/help/lms/answer/a423705) - référencé via recherche, 2026-09-05
- [Dynamic Ads - Advertising Specifications](https://www.linkedin.com/help/linkedin/answer/a420342/advertising-specifications-for-dynamic-ads?lang=en) - référencé via recherche, 2026-09-05
- [Dynamic Ads Follower format advertising specifications](https://www.linkedin.com/help/lms/answer/a420350) - référencé via recherche, 2026-09-05
- [Lead Gen Form specifications](https://www.linkedin.com/help/lms/answer/a423364) - référencé via recherche, 2026-09-05

Note méthodologique : les pages Single Image, Video, Carousel et Message Ads ont été récupérées et lues intégralement (WebFetch). Les pages Document, Event, Thought Leader, Text, Dynamic et Lead Gen Form ont été recoupées via extraits de résultats de recherche citant explicitement ces pages officielles linkedin.com/help ; les chiffres rapportés en sont extraits mais n'ont pas été vérifiés page par page dans leur intégralité - à confirmer si une précision pixel-perfect est nécessaire pour le mockup.

---

## ChatGPT Ads

## État général (confirmé officiellement)

- **Un seul format publicitaire existe à ce jour** (5 septembre 2026) : une unité publicitaire « sponsorisée » affichée **sous la réponse de ChatGPT** dans le fil de conversation.
- **Lancement** : test démarré le **9 février 2026** aux États-Unis, pour les utilisateurs adultes des forfaits **Free** et **Go** uniquement. Les forfaits **Plus, Pro, Business, Enterprise et Edu n'affichent aucune publicité**.
- **Expansion géographique confirmée officiellement** :
  - 26 mars 2026 : annonce d'extension à venir vers Canada, Australie, Nouvelle-Zélande.
  - 7 mai 2026 : annonce d'extension à venir vers Royaume-Uni, Mexique, Brésil, Japon, Corée du Sud.
  - 11 août 2026 : confirmation que ChatGPT Ads est effectivement lancé dans ces 5 marchés (UK, Mexique, Brésil, Japon, Corée du Sud).
  - 31 août 2026 : ChatGPT Ads disponible dans plus de 40 pays ; accès self-service (Ads Manager) étendu à l'Inde, l'Europe, le Moyen-Orient et l'Afrique du Nord.
- **Ne s'affiche pas** : dans le navigateur ChatGPT Atlas (pendant le test), dans les « Temporary Chats », pour les comptes identifiés comme appartenant à des mineurs, ni à proximité de sujets sensibles/réglementés (santé, santé mentale, politique - aucune publicité politique autorisée à ce jour).
- **Indépendance des réponses** : les publicités tournent sur un système technique séparé du modèle de chat ; elles ne peuvent ni influencer, ni classer, ni modifier les réponses de ChatGPT.
- **Confidentialité** : les annonceurs n'ont jamais accès aux conversations, à l'historique, aux mémoires ou aux données personnelles ; ils reçoivent uniquement des statistiques agrégées (vues, clics).

## Format unique : « Sponsored » sous la réponse ★

| Plateforme | Placement | Format | Bureau/Mobile | Ratio | Résolution | Limites texte | Type média | Durée vidéo | Safe zones | Source URL | Date |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ChatGPT (OpenAI Ads) | Sous la réponse de ChatGPT, dans le fil de conversation | Unité publicitaire sponsorisée (« ad unit ») | Web desktop et app mobile (iOS/Android) - aucune différence structurelle documentée officiellement entre les deux ; non affiché dans ChatGPT Atlas | Image annonce : carré 1:1 (**rapporté par outils/guides tiers, non confirmé texto sur une page officielle avec un chiffre**) | Minimum 256×256px, recommandé 512×512px+ pour écrans retina (**rapporté par la presse/outils tiers - non confirmé avec un chiffre exact sur une page officielle OpenAI consultée**) | Composants confirmés officiellement (sans chiffres) : nom de l'annonceur, favicon, titre (« ad title »), texte descriptif (« ad copy »), lien vers la page de destination, une image. La page officielle « Create Ads for ChatGPT Ads » recommande de « rester dans les limites de caractères recommandées » **sans donner de chiffre précis**. Chiffres circulant côté presse/outils tiers (non officiels, à vérifier dans l'interface Ads Manager) : titre ~16-50 caractères, description ~32-100 caractères | Une image statique par annonce (formats de vidéo ou carrousel non confirmés comme généralisés - voir incertitudes) | N/A (pas de format vidéo confirmé officiellement à ce jour) | Non applicable (pas de superposition sur un média plein écran ; l'annonce est un bloc distinct, visuellement séparé et étiqueté « Sponsorisé », sous la réponse) | https://help.openai.com/en/articles/20001047-ads-in-chatgpt | 2026-09-05 |

Détails officiels complémentaires :
- « Ads can appear below the end of a response. Ads are clearly labeled as sponsored and visually separated from ChatGPT's response. »
- Une unité peut afficher un ou plusieurs items d'un même annonceur, ou de plusieurs annonceurs, sélectionnés par pertinence et enchère.
- Menu contextuel sur l'annonce (icône « ⋯ ») : Masquer l'annonce, Signaler l'annonce, « À propos de cette annonce », « Demander à ChatGPT » (partage l'annonce dans le chat pour poser des questions dessus).
- Modèles d'achat confirmés : CPM au lancement (9 février 2026) → ajout du CPC (5 mai 2026, avec Ads Manager self-serve beta) → ajout de l'oCPC bêta pour campagnes « product feed » (7 août 2026, rapporté par la presse spécialisée, ex. Search Engine Land).
- Formats additionnels **en test, rapportés par la presse spécialisée** (non trouvés sur une page officielle OpenAI consultée avec le même luxe de détail) : un format **carrousel multi-produits** pour les campagnes « product feed » (testé à partir du 7 août 2026 selon Search Engine Land/SEOroundtable). Certains guides tiers évoquent aussi trois familles de placements (carte de réponse sponsorisée, mise en avant produit, barre latérale contextuelle) apparues en mars 2026 - **cette segmentation en trois formats n'a pas été retrouvée telle quelle sur les pages officielles openai.com/help.openai.com consultées** et doit être traitée comme non confirmée.

## Composants d'UI (pour mockups)

- **Bloc distinct sous la réponse** : séparé visuellement de la réponse organique (bordure, fond légèrement teinté selon des captures rapportées par la presse - couleur/style exact non documenté officiellement).
- **Label « Sponsorisé »/« Sponsored »** : toujours visible, en haut du bloc publicitaire.
- **Favicon/logo de l'annonceur** : petite icône carrée à côté du nom de l'annonceur.
- **Nom de l'annonceur**.
- **Titre (headline)**.
- **Texte descriptif court (copy)**.
- **Image** : un visuel carré associé à l'annonce.
- **Lien / bouton vers la page de destination** de l'annonceur.
- **Menu « ⋯ »** en coin du bloc : Masquer, Signaler, « À propos de cette annonce », « Demander à ChatGPT ».
- Rendu identique dans son principe sur web desktop et app mobile (aucune divergence structurelle officiellement documentée) ; largeur du bloc s'adapte à la largeur de la colonne de conversation (plus étroite sur mobile, comme le reste du fil).

## Incertitudes (à traiter avec prudence pour les mockups)

- **Dimensions exactes de l'image et limites de caractères chiffrées** : non confirmées sur une page officielle OpenAI consultée (seulement des recommandations qualitatives « restez concis »). Les chiffres circulant (image carrée ≥256×256px JPG/PNG/WEBP, titre/description avec plafonds précis) proviennent de guides tiers (agences, outils SaaS) et non d'une spec officielle publiée en clair.
- **Existence de plusieurs formats distincts** (carte de réponse sponsorisée / mise en avant produit / barre latérale) : rapportée par la presse marketing, non retrouvée formulée ainsi sur les pages officielles consultées. Le seul format multiple confirmé officiellement (indirectement, via presse spécialisée sérieuse type Search Engine Land) est le **carrousel multi-produits en test** pour les campagnes product feed (depuis le 7 août 2026).
- **Rendu visuel précis** (couleurs, rayon de bordure, largeur exacte de la carte) : non documenté techniquement par OpenAI dans les pages consultées ; uniquement décrit qualitativement (« clairement étiqueté », « visuellement séparé »).
- **Différences bureau vs mobile** : aucune divergence de structure n'est mentionnée officiellement ; seule certitude officielle indirecte : les contrôles publicitaires (Settings > Ad Controls) nécessitent parfois une mise à jour de l'app mobile pour apparaître, ce qui suggère un décalage possible de déploiement des fonctionnalités de contrôle entre web et mobile - sans impact documenté sur le rendu visuel de l'annonce elle-même.
- **Vidéo publicitaire** : aucune mention officielle d'un format vidéo pour les annonces ChatGPT à date ; à considérer comme **non existant** en l'état (05/09/2026).

## Sources

- [Tests publicitaires dans ChatGPT (Testing ads in ChatGPT)](https://openai.com/index/testing-ads-in-chatgpt/) - publié le 9 février 2026, mis à jour 26 mars / 7 mai / 11 août 2026, consulté 2026-09-05
- [Our approach to advertising and expanding access to ChatGPT](https://openai.com/index/our-approach-to-advertising-and-expanding-access/) - consulté 2026-09-05 (contenu confirmé par recoupement, page source bloquée en fetch direct HTTP 403 mais accessible via navigateur)
- [New ways to buy ChatGPT ads](https://openai.com/index/new-ways-to-buy-chatgpt-ads/) - publié le 5 mai 2026, consulté 2026-09-05
- [A milestone in expanding access to AI (expanding-access-to-ai-with-chatgpt-ads)](https://openai.com/index/expanding-access-to-ai-with-chatgpt-ads/) - publié le 31 août 2026, consulté 2026-09-05
- [Ads in ChatGPT (FAQ officielle)](https://help.openai.com/en/articles/20001047-ads-in-chatgpt) - consulté 2026-09-05 (mise à jour « il y a 4 jours » au moment de la consultation)
- [Create Ads for ChatGPT Ads (bonnes pratiques annonceurs)](https://help.openai.com/en/articles/20001212-create-ads-for-chatgpt-ads) - consulté 2026-09-05 (mise à jour « il y a 23 jours »)
- [Advertise in ChatGPT / OpenAI Ads (ads.openai.com)](https://ads.openai.com) - consulté 2026-09-05
- Presse tech sérieuse citée pour les points non couverts en détail par la doc officielle (formats en test, oCPC, carrousel produits) : [Search Engine Land - ChatGPT Ads rolls out oCPC campaigns, AAM and product carousels](https://searchengineland.com/chatgpt-ads-rolls-out-ocpc-campaigns-aam-and-product-carousels-484494), [SE Roundtable - OpenAI ChatGPT Ads Updates](https://www.seroundtable.com/openai-chatgpt-ads-updates-41828.html) - 7 août 2026
- Guides tiers utilisés uniquement pour recouper les chiffres de specs créatives non confirmés officiellement (à vérifier avant usage en production) : abmatic.ai, indexlab.ai, trylapis.com, chatgptadlibrary.com - 2026, non officiels.

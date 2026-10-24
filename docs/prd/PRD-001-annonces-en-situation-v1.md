---
id: PRD-001
titre: Annonces en situation V1 - import Excel, mockups fidèles, review et export
statut: en cours    # draft | validé | en cours | livré | abandonné
valide_le: 2026-10-06
date: 2026-09-06     # création, ne change jamais
maj: 2026-10-06      # mise à jour, à rafraîchir à chaque édition du PRD
repo: mb-media-ads
---

# PRD-001 - Annonces en situation V1 : import Excel, mockups fidèles, review et export

## Contexte

Le service marketing du Collège Universel produit régulièrement des campagnes sur les réseaux sociaux (Meta, YouTube, TikTok, LinkedIn), en SEM et en bannières display. Aujourd'hui, le chargé de campagne renseigne un fichier Excel (un fichier par campagne, une feuille par plateforme, une annonce par ligne : texte principal, titre, description, CTA, lien tracké, nom de la créa), puis assemble à la main un PowerPoint « annonces en situation » (mockups Facebook/Instagram avec en-tête « Commandité », cartes carrousel, barre J'aime / Commenter / Partager) qu'il envoie à la directrice marketing pour validation. Elle consulte souvent depuis son téléphone, via Teams.

MB Média Ads possède déjà un module « Social Ads » (plans, annonces, mockups Facebook / Instagram / LinkedIn / TikTok, lien public de validation avec commentaires et décisions Approuver / Réviser, assistant de rédaction IA, stockage des médias). Les tables `sa_*`, la RLS owner-only et le bucket `social-ads` sont en production. Un inventaire exhaustif des formats publicitaires (bureau et mobile, specs officielles, composants d'UI à reproduire) a été établi et sert de référentiel : `docs/ads-formats-inventory.md`.

Ce PRD couvre la V1 : le workflow complet pour les réseaux sociaux. Le SEM, le display / bannières et ChatGPT Ads font l'objet de PRD ultérieurs (V2, V3).

## Problème

- Chaque campagne exige de ressaisir dans l'outil, annonce par annonce, des textes qui existent déjà dans l'Excel, puis de refaire un PowerPoint : double travail, erreurs de copie, délai.
- Le PowerPoint n'est pas fidèle aux vrais rendus des plateformes, ne se consulte pas bien sur téléphone, ne permet ni commentaire ni modification en place : les allers-retours de validation passent par Teams et se perdent.
- Le nom de la page / du compte et le logo doivent être ressaisis pour chaque annonce alors qu'il s'agit toujours de la même marque.
- Une fois validé, il faut recopier les textes finaux à la main dans les gestionnaires de publicité.

## Solution

Un seul geste par campagne : déposer l'Excel. L'outil génère automatiquement un plan avec toutes ses annonces (une feuille = une plateforme), applique l'identité de marque configurée une fois pour toutes (nom de compte par plateforme, logo), détecte les visuels nécessaires et propose de les déposer (auto-association par nom de fichier ; pour une vidéo, une capture d'écran suffit), puis produit une page de review responsive, scrollable, groupée par plateforme, avec des mockups fidèles aux vrais placements (bureau et mobile). La directrice y commente, modifie les textes en place et valide chaque annonce sans compte. Le chargé de campagne reprend la main et exporte un fichier texte, un bloc par annonce, prêt à copier-coller dans les gestionnaires de publicité. Un fichier Excel = une campagne = un plan = un lien.

## Zones touchées

- `lib/social-ads/` (import Excel, manifeste des visuels, référentiel des specs, export, accès données, types)
- `app/social/` (espace connecté : import, paramétrage marque, éditeur, mockups)
- `app/preview/` (page publique de review)
- `app/api/social/` (routes serveur : import, export)
- `supabase/migrations/`
- fichiers de configuration racine (Tailwind, Vitest, dépendances)
- `docs/`

## Features à développer

### F1 - Paramétrage de la marque (Priorité : P1)

- **User story** : En tant que chargé de campagne, je veux renseigner une seule fois le logo de l'entreprise et le nom de compte de chaque plateforme, afin que toutes les annonces les affichent automatiquement sans saisie par annonce.
- **Pourquoi cette priorité** : c'est la condition de l'automatisation complète ; l'Excel ne contient pas l'identité de marque.
- **Exigences** :
  - **FR-001** : Le système DOIT offrir un onglet « Paramétrage » dans l'espace Social Ads, réservé aux utilisateurs connectés.
  - **FR-002** : Le système DOIT permettre d'enregistrer un logo (image) et, pour chaque plateforme supportée (Facebook, Instagram, LinkedIn, TikTok, YouTube), un nom affiché et un identifiant de compte (@handle ou nom de chaîne).
  - **FR-003** : Le système DOIT conserver ces réglages par utilisateur, protégés par la RLS owner-only, et les stocker dans le bucket `social-ads` pour le logo.
  - **FR-004** : QUAND une annonce est créée (import ou éditeur) sans nom de marque, handle ou logo, le système DOIT pré-remplir ces champs depuis le paramétrage selon la plateforme de l'annonce.
  - **FR-005** : Le système DOIT laisser modifier ces champs par annonce (surcharge ponctuelle) sans altérer le paramétrage global.
- **Critères d'acceptation** :
  - [ ] Étant donné un utilisateur connecté sans paramétrage, quand il ouvre l'onglet Paramétrage, alors il voit un formulaire vide (logo + un bloc par plateforme) et peut l'enregistrer.
  - [ ] Étant donné un paramétrage enregistré, quand une annonce Instagram est créée sans marque, alors elle affiche le nom, le @handle et le logo Instagram du paramétrage.
  - [ ] Étant donné un paramétrage enregistré, quand l'utilisateur modifie le nom de marque d'une seule annonce, alors les autres annonces et le paramétrage restent inchangés.
  - [ ] Étant donné deux utilisateurs distincts, quand l'un consulte le paramétrage, alors il ne voit jamais celui de l'autre.
- **Hors scope** : plusieurs marques par utilisateur ; récupération automatique du logo / nom depuis les plateformes (OAuth ou scraping).

### F2 - Référentiel des plateformes, placements et formats (Priorité : P1)

- **User story** : En tant que chargé de campagne, je veux que l'outil connaisse les vrais placements et contraintes de chaque plateforme (dont YouTube), afin que les mockups et les contrôles de longueur reflètent la réalité.
- **Pourquoi cette priorité** : socle des mockups et de l'import ; YouTube manque aujourd'hui et le modèle actuel mélange placement et type de média.
- **Exigences** :
  - **FR-006** : Le système DOIT modéliser une annonce par le triplet plateforme × placement × type de média (image, vidéo, carrousel) plus un ratio, chaque dimension étant un ensemble fermé de valeurs (aucun état illégal représentable).
  - **FR-007** : Le système DOIT supporter les plateformes Facebook, Instagram, LinkedIn, TikTok et YouTube.
  - **FR-008** : Le système DOIT supporter au minimum les placements suivants : Facebook Feed, Stories, Reels ; Instagram Feed, Stories, Reels ; YouTube In-stream, In-feed, Shorts ; TikTok In-feed ; LinkedIn Feed.
  - **FR-009** : Le système DOIT exposer, pour chaque combinaison supportée, les specs issues de l'inventaire : ratios admis, résolution recommandée, seuil d'affichage du texte (« Voir plus »), plafonds durs (texte principal, titre, description), nombre de cartes carrousel, safe zones, disponibilité bureau / mobile.
  - **FR-010** : QUAND une combinaison plateforme × placement × type de média n'est pas supportée, le système DOIT la refuser avec un message explicite plutôt que de l'accepter silencieusement.
  - **FR-011** : Le système DOIT migrer les annonces existantes vers le nouveau modèle sans perte (les anciennes valeurs de format sont converties en placement + type de média).
- **Critères d'acceptation** :
  - [ ] Étant donné la combinaison Instagram × Reels × vidéo, quand on demande ses specs, alors le système renvoie ratio 9:16, texte 44 caractères, safe zones haut 14 % / bas 35 % / côtés 6 %, mobile uniquement.
  - [ ] Étant donné la combinaison YouTube × Shorts × vidéo, quand on demande ses specs, alors le système renvoie ratio 9:16 et description 90 caractères.
  - [ ] Étant donné la combinaison Facebook × Stories × carrousel, quand on tente de créer une annonce, alors le système refuse avec un message indiquant que ce placement n'admet pas ce type de média.
  - [ ] Étant donné les annonces présentes en base avant migration, quand la migration est appliquée, alors chacune possède un placement et un type de média cohérents avec son ancien format et aucune n'est perdue.
- **Hors scope** : placements de longue traîne (Marketplace, colonne droite, In-Stream Facebook, Explore, Audience Network, TopView, LinkedIn Message / Document / Event, Masthead, Outstream), SEM, display, ChatGPT.

### F3 - Import Excel d'une campagne (Priorité : P1)

- **User story** : En tant que chargé de campagne, je veux déposer mon fichier Excel de campagne, afin que le plan et toutes ses annonces soient créés automatiquement, sans ressaisie.
- **Pourquoi cette priorité** : c'est le geste central du workflow et la principale source de gain de temps.
- **Exigences** :
  - **FR-012** : Le système DOIT accepter un fichier `.xlsx` par glisser-déposer ou sélection dans l'espace Social Ads.
  - **FR-013** : Le système DOIT traiter chaque feuille du classeur comme une plateforme, identifiée par le nom de la feuille (normalisé : casse, accents, espaces ; ex. « Facebook », « Instagram », « YouTube », « TikTok », « LinkedIn »).
  - **FR-014** : Le système DOIT repérer la ligne d'en-têtes de chaque feuille (celle contenant « Plateforme » et « Texte principal ») en ignorant les lignes de titre et de méta au-dessus, et ignorer les colonnes de comptage « Car. ».
  - **FR-015** : Le système DOIT mapper les colonnes du gabarit standard vers les champs d'annonce : `#` (ordre), `Format` (type de média + ratio + placement), `Texte principal`, `Titre`, `Description`, `CTA`, `Lien de destination (tracké)` (URL de destination), `Fichier` (référence de la créa), `Type` (objectif) et `Angle / Déclinaison` (méta d'import), `Photo n` / `Fiche n` (cartes de carrousel).
  - **FR-016** : Le système DOIT parser la colonne `Format` en type de média et ratio (ex. « Video 4/5 » donne vidéo + 4:5 ; « Image » donne image + ratio par défaut du placement) ; en l'absence d'indication de placement, le placement DOIT être Feed.
  - **FR-017** : Le système DOIT créer un plan par fichier, nommé d'après la ligne de titre de la première feuille (repli : nom du fichier), et y rattacher toutes les annonces de toutes les feuilles avec leur plateforme, dans l'ordre du fichier.
  - **FR-018** : QUAND une feuille porte un nom qui ne correspond à aucune plateforme supportée, le système DOIT signaler la feuille et poursuivre l'import des autres feuilles.
  - **FR-019** : QUAND une colonne attendue manque ou qu'une ligne est invalide (texte principal vide, format inconnu), le système DOIT produire un rapport d'import lisible (feuille, ligne, problème) et n'importer que les lignes valides.
  - **FR-020** : Le système DOIT appliquer le paramétrage de marque (F1) à chaque annonce importée selon sa plateforme.
  - **FR-021** : Le système DOIT conserver l'URL de destination, l'objectif, l'angle et la référence de créa sur chaque annonce importée.
- **Critères d'acceptation** :
  - [ ] Étant donné le fichier réel `Facebook_AEC_Automne2026_CollegeUniversel.xlsx` (18 annonces réparties dans 2 feuilles villes), quand il est déposé, alors un plan est créé avec 18 annonces et deux notices de compatibilité, chacune portant texte principal, titre, description, CTA « En savoir plus », URL trackée, référence de créa et ordre, et l'import se termine en moins de 30 secondes.
  - [ ] Étant donné une ligne dont `Format` vaut « Video 4/5 », quand elle est importée, alors l'annonce est de type vidéo, ratio 4:5, placement Feed.
  - [ ] Étant donné un classeur dont une feuille s'appelle « Brouillon », quand il est importé, alors les autres feuilles sont importées et le rapport signale la feuille ignorée.
  - [ ] Étant donné une feuille sans colonne « Texte principal », quand elle est importée, alors aucune annonce de cette feuille n'est créée et le rapport nomme la colonne manquante.
  - [ ] Étant donné un paramétrage de marque renseigné, quand l'import se termine, alors toutes les annonces affichent le nom, le handle et le logo de leur plateforme sans saisie.
- **Hors scope** : import d'images embarquées dans l'Excel ; mapping de colonnes personnalisable par l'utilisateur ; import CSV.
- **Convention validée pour l'implémentation** : colonne `Format` avec « Story image 9/16 », « Story vidéo 9/16 » et « Reel ». Les annonces sans placement explicite utilisent le fil de leur plateforme. Les feuilles historiques par ville restent lisibles lorsque la colonne « Plateforme » identifie sans ambiguïté le réseau ; le rapport signale cette compatibilité.

### F4 - Étape visuels : manifeste et auto-association (Priorité : P1)

- **User story** : En tant que chargé de campagne, je veux que l'outil me dise exactement quels visuels déposer après l'import et les associe automatiquement aux bonnes annonces, afin de ne rien oublier et de ne rien affecter à la main.
- **Pourquoi cette priorité** : sans visuels, les mockups n'ont pas de valeur ; l'association manuelle serait la principale friction restante.
- **Exigences** :
  - **FR-022** : QUAND un import se termine, le système DOIT calculer le manifeste des visuels requis du plan : un emplacement pour une annonce image ou vidéo, N emplacements pour un carrousel (cartes renseignées), dédoublonnés par référence de créa quand plusieurs annonces partagent la même créa.
  - **FR-023** : Le système DOIT présenter ce manifeste comme une liste d'emplacements étiquetés (référence de créa, plateforme, placement, ratio attendu) avec le nombre restant à fournir.
  - **FR-024** : Le système DOIT accepter le dépôt de plusieurs fichiers image (JPG, PNG, WebP, GIF) et associer automatiquement chaque fichier à l'emplacement dont la référence de créa correspond au nom du fichier (comparaison insensible à la casse, aux accents et à l'extension).
  - **FR-025** : QUAND un fichier déposé ne correspond à aucune référence, le système DOIT le proposer pour une association manuelle vers un emplacement restant.
  - **FR-026** : Le système DOIT accepter une image fixe (capture d'écran) pour une annonce vidéo et l'afficher dans le mockup avec un indicateur de lecture (icône play, durée factice absente), sans lecture vidéo.
  - **FR-027** : Le système DOIT stocker les visuels dans le bucket `social-ads` et les rattacher aux annonces (et cartes) concernées.
  - **FR-028** : Le système DOIT permettre de revenir à cette étape à tout moment pour compléter ou remplacer des visuels.
- **Critères d'acceptation** :
  - [ ] Étant donné un plan importé où 3 annonces référencent la créa « CU_AEC-AUT26_MarketingNum_MTL » et 3 autres « CU_AEC-AUT26_Cybersecurite_MTL », quand le manifeste est affiché, alors il compte exactement 2 visuels à fournir.
  - [ ] Étant donné ce manifeste, quand l'utilisateur dépose « CU_AEC-AUT26_Cybersecurite_MTL.png », alors le fichier est associé aux 3 annonces concernées et le compteur passe à 1 restant.
  - [ ] Étant donné un fichier « visuel-final.jpg » sans correspondance, quand il est déposé, alors il apparaît en attente d'association manuelle et peut être glissé sur un emplacement.
  - [ ] Étant donné une annonce vidéo dotée d'une capture d'écran, quand son mockup s'affiche, alors l'image apparaît avec une icône play et aucun lecteur vidéo n'est chargé.
  - [ ] Étant donné un carrousel à 4 cartes, quand 4 fichiers nommés d'après ses cartes sont déposés, alors chaque carte reçoit son image dans l'ordre.
- **Hors scope** : recadrage automatique aux ratios ; lecture vidéo ; récupération de visuels depuis les comptes ; fichiers de plus de 50 Mo (limite du forfait Supabase actuel).

### F5 - Mockups fidèles, bureau et mobile (Priorité : P1)

- **User story** : En tant que directrice marketing, je veux voir chaque annonce exactement comme elle apparaîtra sur la plateforme, en version bureau et mobile, afin de juger sur pièce sans imaginer le rendu.
- **Pourquoi cette priorité** : c'est la valeur ajoutée face au PowerPoint actuel ; la fidélité est le critère n° 1 de l'utilisateur.
- **Exigences** :
  - **FR-029** : Le système DOIT rendre un mockup dédié pour chaque placement supporté (F2), reproduisant les composants d'UI listés dans l'inventaire des formats : en-tête (avatar, nom, mention « Sponsorisé » / « Commandité » / « Promu » / « Annonce » selon la plateforme), texte tronqué au seuil réel avec « Voir plus », média au bon ratio, carte lien (domaine, titre, description, bouton CTA), barre d'engagement propre à la plateforme, éléments spécifiques (barre de progression et safe zones des Stories, colonne d'icônes des Reels / Shorts / TikTok, compte à rebours « Passer l'annonce » de YouTube In-stream, vignette et mention « Annonce » de YouTube In-feed).
  - **FR-030** : Le système DOIT proposer, pour chaque annonce, la vue bureau et la vue mobile quand le placement existe sur les deux, et uniquement la vue mobile quand il est mobile-only (Stories, Reels, Shorts, TikTok), présentée dans un cadre de téléphone.
  - **FR-031** : Le système DOIT afficher le carrousel avec ses cartes (image, titre, description, CTA) navigables, et la vidéo comme une image avec indicateur de lecture.
  - **FR-032** : Le système DOIT tronquer les textes selon les seuils du référentiel et signaler visuellement tout dépassement de plafond dur.
  - **FR-033** : Le système DOIT utiliser le nom, le handle et le logo de l'annonce (issus du paramétrage) dans chaque mockup.
  - **FR-034** : Les mockups DOIVENT rester lisibles et fidèles sur un écran de téléphone (largeur 360 px) comme sur un écran de bureau.
- **Critères d'acceptation** :
  - [ ] Étant donné une annonce Facebook Feed image avec texte de 180 caractères, quand son mockup bureau s'affiche, alors le texte est coupé au seuil du référentiel avec « ... Voir plus », la carte lien montre domaine, titre, description et bouton CTA, et la barre J'aime / Commenter / Partager est présente.
  - [ ] Étant donné une annonce Instagram Stories, quand son mockup s'affiche, alors seule la vue mobile est proposée, en 9:16, avec barre de progression, nom du compte, mention « Sponsorisé » et CTA en bas.
  - [ ] Étant donné une annonce YouTube In-stream, quand son mockup s'affiche, alors la vue bureau montre le lecteur, la mention « Annonce », le bouton « Passer l'annonce » et le bandeau annonceur, et la vue mobile montre le CTA en overlay.
  - [ ] Étant donné une annonce TikTok, quand son mockup s'affiche, alors il présente le cadre téléphone, l'avatar, le @handle, la mention « Commandité », la colonne d'actions à droite et le CTA en bas.
  - [ ] Étant donné une annonce LinkedIn Single Image, quand son mockup s'affiche, alors l'en-tête porte le logo, le nom de Page et « Promu », et la barre J'aime / Commenter / Republier / Envoyer est présente.
  - [ ] Étant donné un titre de 45 caractères sur un placement au plafond de 40, quand le mockup s'affiche, alors le dépassement est signalé.
  - [ ] Étant donné l'utilisateur comparant côte à côte un mockup et une vraie annonce de la même plateforme, quand il les juge, alors il valide la fidélité pour chacun des placements V1 (revue visuelle manuelle).
- **Hors scope** : lecture vidéo ; animation des Stories ; mode sombre des plateformes ; placements hors F2.

### F6 - Page de review responsive, groupée par plateforme (Priorité : P1)

- **User story** : En tant que directrice marketing, je veux ouvrir un seul lien, sur mon téléphone ou mon ordinateur, et parcourir toutes les annonces de la campagne regroupées par plateforme, afin de valider vite et sans friction.
- **Pourquoi cette priorité** : c'est le livrable envoyé à la décideuse ; il remplace le PowerPoint.
- **Exigences** :
  - **FR-035** : Le système DOIT afficher, via le lien public existant, les annonces du plan groupées par plateforme, dans une page unique scrollable de haut en bas, avec un en-tête de section par plateforme et une navigation rapide entre sections.
  - **FR-036** : La page DOIT être responsive : lisible et opérable sur téléphone (largeur 360 px) et sur bureau, sans défilement horizontal de la page.
  - **FR-037** : Pour chaque annonce, la page DOIT proposer le mockup (F5), le basculement bureau / mobile quand il existe, les commentaires et la décision Approuver / Demander une révision (existants).
  - **FR-038** : La page DOIT afficher l'avancement de la validation (annonces approuvées / à réviser / sans décision) au niveau du plan et de chaque section.
  - **FR-039** : Le système DOIT rester accessible sans compte pour le destinataire du lien, toutes les écritures passant par du code serveur qui valide le token.
- **Critères d'acceptation** :
  - [ ] Étant donné un plan avec des annonces Facebook, Instagram, YouTube et TikTok, quand le lien est ouvert, alors les quatre sections apparaissent dans l'ordre du fichier, chacune avec ses annonces, et la navigation permet d'atteindre chaque section.
  - [ ] Étant donné le lien ouvert sur un téléphone en largeur 360 px, quand la directrice parcourt la page, alors aucun contenu ne déborde horizontalement et chaque mockup, commentaire et bouton reste utilisable.
  - [ ] Étant donné une annonce approuvée et une annonce à réviser dans une section, quand la page se charge, alors la section affiche « 1 approuvée · 1 à réviser » et l'en-tête du plan le total.
  - [ ] Étant donné un visiteur sans compte, quand il commente ou décide, alors l'écriture est acceptée via le token et refusée si le token est invalide ou expiré.
- **Hors scope** : notifications e-mail ; plusieurs relecteurs nommés avec droits différents ; historique des versions.

### F7 - Édition des textes en place, des deux côtés (Priorité : P2)

- **User story** : En tant que directrice marketing (via le lien) ou chargé de campagne (connecté), je veux corriger le texte d'une annonce directement dans la page de review, afin d'éviter les allers-retours par Teams.
- **Pourquoi cette priorité** : demandé explicitement, mais l'éditeur connecté couvre déjà la correction ; l'édition via le lien public est un confort majeur, non bloquant pour le premier parcours de bout en bout.
- **Exigences** :
  - **FR-040** : Chaque annonce de la page de review DOIT proposer un bouton « Éditer l'annonce » ouvrant l'édition en place du texte principal, du titre, de la description, du CTA et de l'URL de destination.
  - **FR-041** : Le système DOIT enregistrer les modifications faites via le lien public par du code serveur qui valide le token et n'autorise que ces champs.
  - **FR-042** : Le système DOIT rafraîchir immédiatement le mockup avec les textes modifiés, en appliquant les seuils et plafonds du référentiel.
  - **FR-043** : QUAND deux personnes modifient la même annonce, le système DOIT conserver la dernière écriture et afficher la date de dernière modification (aucun verrou).
  - **FR-044** : L'espace connecté DOIT offrir la même édition en place, avec les mêmes contrôles.
- **Critères d'acceptation** :
  - [ ] Étant donné la page de review ouverte via le lien, quand la directrice édite le titre d'une annonce et enregistre, alors le mockup se met à jour et le titre modifié est visible dans l'espace connecté.
  - [ ] Étant donné une tentative d'écriture avec un token invalide, quand elle est envoyée, alors elle est refusée et rien n'est modifié.
  - [ ] Étant donné un titre édité dépassant le plafond du placement, quand il est saisi, alors le dépassement est signalé avant enregistrement.
  - [ ] Étant donné deux modifications successives de la même annonce, quand la seconde est enregistrée, alors elle est conservée et la date de dernière modification est affichée.
- **Hors scope** : édition des visuels via le lien public ; résolution de conflits ; historique des modifications.

### F8 - Export texte des annonces (Priorité : P1)

- **User story** : En tant que chargé de campagne, je veux télécharger un fichier texte contenant toutes les annonces finales, afin de les copier-coller dans les gestionnaires de publicité.
- **Pourquoi cette priorité** : c'est la sortie du workflow ; sans elle, la ressaisie manuelle subsiste.
- **Exigences** :
  - **FR-045** : L'espace connecté DOIT proposer, sur un plan, un bouton d'export produisant un fichier `.txt` téléchargeable.
  - **FR-046** : Le fichier DOIT être groupé par plateforme, avec un en-tête de plan (nom, date) et, par annonce, un bloc étiqueté contenant : numéro et ordre, placement et type de média, texte principal, titre, description, CTA, URL de destination, référence de créa et, pour un carrousel, chaque carte (titre, description).
  - **FR-047** : Le fichier DOIT refléter les textes après édition (F7) et indiquer la décision de validation de chaque annonce.
  - **FR-048** : Le fichier DOIT être en UTF-8, sans tiret cadratin, avec des séparateurs lisibles entre annonces.
- **Critères d'acceptation** :
  - [ ] Étant donné un plan de 12 annonces sur 2 plateformes, quand l'export est lancé, alors le fichier contient 2 sections et 12 blocs dans l'ordre du plan.
  - [ ] Étant donné une annonce dont le titre a été modifié via le lien public, quand l'export est lancé, alors le bloc contient le titre modifié.
  - [ ] Étant donné une annonce carrousel à 4 cartes, quand l'export est lancé, alors son bloc liste les 4 cartes.
  - [ ] Étant donné le fichier exporté, quand il est ouvert dans un éditeur de texte, alors les accents sont corrects et chaque champ est précédé de son étiquette.
- **Hors scope** : export CSV / Excel ; envoi automatique vers les régies.

## Hors scope global

- V2 : SEM (annonces responsives Google Search bureau / mobile et assets), display / bannières (page de tous les formats IAB, gabarits de mise en situation sur sites médias du Québec).
- V3 : ChatGPT Ads et placements de longue traîne (Marketplace, colonne droite, In-Stream Facebook, Explore, Audience Network, TopView, LinkedIn Message / Document / Event, Masthead, Outstream, Shopping).
- Messenger Inbox (placement retiré par Meta le 11 novembre 2025).
- Connexion aux comptes des plateformes (OAuth), récupération automatique de logos, publication directe vers les régies.
- Lecture vidéo dans les mockups, recadrage automatique, plusieurs marques, notifications, multi-relecteurs avancé, historique des versions.

## Critères de succès mesurables

- Une campagne réelle (l'Excel de référence, 18 annonces) passe de l'Excel à la page de review prête à envoyer en moins de 15 minutes, dont zéro saisie de texte d'annonce.
- 100 % des textes d'annonce, URL et références de créa de l'Excel se retrouvent sur les annonces créées (vérifié par test automatisé sur le fichier de référence).
- La page de review obtient une validation visuelle de fidélité par l'utilisateur pour chacun des placements V1, bureau et mobile.
- La page de review s'utilise sur un téléphone (360 px) sans défilement horizontal ni contrôle inaccessible.
- La directrice peut commenter, éditer et décider sans compte ; l'export contient 100 % des annonces avec leurs textes finaux.
- Les 4 modules purs (import, manifeste des visuels, référentiel des specs, export) sont couverts par des tests automatisés qui passent en intégration continue locale.

## Hypothèses

- Le gabarit Excel est fixe et standard (colonnes, lignes de titre et méta, en-têtes, une feuille par plateforme) ; les prochains fichiers le respectent.
- Une seule marque (Collège Universel) pour un usage interne ; le paramétrage est fait une fois.
- L'Excel ne contient pas d'images ; les visuels sont fournis à part, nommés d'après la référence de créa.
- Le projet Supabase de production actuel (`xxfqvbvyasnnvmycpogx`) est conservé ; forfait Free : plafond d'upload de 50 Mo par fichier, suffisant pour des images et captures d'écran.
- L'inventaire `docs/ads-formats-inventory.md` est la source des specs et des composants d'UI ; ses valeurs marquées « non trouvé » sont calées sur des captures réelles lors de la construction des mockups.
- Tailwind CSS est adopté pour la nouvelle interface et coexiste avec le CSS existant.
- Faible concurrence d'édition : dernière écriture gagnante sans verrou est acceptable.

## Décisions d'implémentation

- **Modèle d'annonce** : remplacement du champ « format » composite par trois dimensions fermées : placement, type de média, ratio ; extension des plateformes à YouTube. Migration additive avec conversion des valeurs existantes ; l'ancien champ est conservé le temps de la transition puis retiré dans un chantier ultérieur.
- **Nouvelles données d'annonce** : URL de destination, référence de créa (clé d'auto-association), méta d'import (objectif, angle) en JSON ; cartes de carrousel dans le tableau de médias existant (type, URL, titre, description, référence).
- **Paramétrage de marque** : une table par utilisateur (logo dans le bucket `social-ads`, comptes par plateforme en JSON : nom affiché, handle), RLS owner-only, appliquée à la création d'annonce et surchargeable par annonce.
- **Import Excel** : module pur qui transforme un classeur en structure typée (plan, annonces par plateforme, rapport d'erreurs) sans effet de bord ; la persistance se fait dans une seconde étape. Lecture du classeur par une bibliothèque de parsing xlsx côté serveur ; le fichier n'est pas conservé après import.
- **Manifeste des visuels** : module pur qui dérive des annonces les emplacements requis (dédoublonnés par référence de créa, N par carrousel) et calcule les associations à partir d'une liste de noms de fichiers ; l'upload passe par le mécanisme d'URL signée déjà en place, puis un rattachement serveur.
- **Référentiel des specs** : module de données typé (plateforme × placement × type de média) alimenté par l'inventaire, avec une fonction d'accès unique et une fonction de validation de combinaison ; l'éditeur, l'import et les mockups en dépendent tous.
- **Mockups** : un composant par placement, paramétré par la vue (bureau / mobile) et l'annonce ; cadre de téléphone commun pour les placements verticaux ; construits avec Tailwind ; les textes passent par une fonction de troncature commune basée sur le référentiel.
- **Page de review** : réutilise le lien public et la validation de token existants ; ajoute les sections par plateforme, la navigation, la bascule bureau / mobile, l'édition en place ; toutes les écritures publiques restent des actions serveur token-validées limitées aux champs autorisés.
- **Export** : module pur qui transforme un plan et ses annonces en texte ; une route serveur authentifiée renvoie le fichier en téléchargement.
- **Socle** : ajout de Tailwind CSS et de Vitest au projet ; aucune modification des tables et flux existants hors module Social Ads.
- **Migrations** : additives, appliquées sur le projet de production avec vérifications (comme pour les migrations Social Ads précédentes).

## Décisions de test

- Un bon test décrit un comportement observable : « ce classeur donne ces annonces et ce rapport », « ces annonces donnent ce manifeste et ces associations », « cette combinaison donne ces specs ou ce refus », « ce plan donne ce fichier texte ». Aucun test sur des détails internes.
- **Modules testés (Vitest)** : import Excel (fixture = copie anonymisée du fichier réel de référence + classeurs dégradés : feuille inconnue, colonne manquante, ligne vide, format inconnu), manifeste des visuels et auto-association (dédoublonnage, carrousel, casse / accents / extension, fichier orphelin), référentiel des specs (valeurs clés par combinaison, refus des combinaisons non supportées, conversion des anciens formats), export texte (structure, ordre, cartes, textes édités, UTF-8).
- **Non couverts par des tests automatisés** : mockups et page de review, validés par revue visuelle E2E (bureau et 360 px, comparaison côte à côte avec de vraies annonces), paramétrage et écritures token-validées, vérifiés E2E sur le parcours complet.
- **Prior art** : aucun runner de test dans le dépôt ; Vitest est introduit par ce PRD. Les vérifications des migrations suivent le protocole déjà utilisé pour les migrations Social Ads (requêtes de contrôle sur tables, colonnes, bucket, RLS).

## Risques

- **Fidélité des mockups** : les interfaces des plateformes évoluent ; les mockups peuvent dériver. Atténuation : composants isolés par placement, référentiel centralisé, revue visuelle à chaque campagne majeure.
- **Dérive du gabarit Excel** : une colonne renommée casse l'import. Atténuation : détection d'en-têtes tolérante (casse, accents), rapport d'import explicite, gabarit de référence conservé dans le dépôt.
- **Placement Stories / Reels dans l'Excel** : l'échantillon ne couvre pas tous les placements. Atténuation : convention documentée ; refus des valeurs explicites ambiguës ou incompatibles.
- **Specs manquantes** (YouTube mobile, TikTok safe zones officielles) : valeurs calées sur captures réelles, marquées à re-vérifier.
- **Concurrence d'édition** : dernière écriture gagnante ; risque d'écrasement rare, accepté en usage interne.
- **Plafond d'upload 50 Mo** (forfait Free) : sans impact pour des images ; bloquant si de vraies vidéos devaient être déposées (hors scope).
- **Charge de la V1** : le mockup YouTube fidèle et la refonte du modèle d'annonce sont les parties les plus lourdes ; à traiter en premier dans le plan d'implémentation.

## Notes complémentaires

- Référentiel des formats : `docs/ads-formats-inventory.md` (spec, sources datées, composants d'UI, arbitrages validés le 2026-09-06).
- Prochains PRD prévus : V2 « SEM et display / bannières », V3 « ChatGPT Ads et placements de longue traîne ».
- Enchaînement prévu : plan d'implémentation cadré (modules, ordre, fichiers) puis exécution ; les migrations sont appliquées en production au fil des features avec vérifications.

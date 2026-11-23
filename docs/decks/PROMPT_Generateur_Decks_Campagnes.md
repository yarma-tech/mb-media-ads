# Mission

Construis une application web interne, déployée sur Vercel, qui génère automatiquement des **decks de validation de campagnes publicitaires** à partir d'images déposées par glisser-déposer.

Contexte : je suis coordonnateur marketing. Pour chaque campagne (Collège Universel, Collège du Mont-Sainte-Anne / CMSA), je reçois des visuels de la graphiste dans plusieurs formats. Aujourd'hui je monte à la main un deck qui montre chaque visuel « en situation » (maquette réaliste d'une annonce Facebook, Instagram, bannière web), je l'envoie à ma directrice, elle valide ou commente. L'application doit faire tout ça en quelques secondes.

Le rendu doit reproduire fidèlement le deck de référence décrit plus bas (structure, maquettes, sobriété). C'est le critère de réussite principal.

---

# Parcours utilisateur

1. **Je crée une campagne** : marque (CU ou CMSA), nom (ex. « Admissions 2027-2028 »), sous-titre de couverture (ex. « Annonces Meta et bannières display »).
2. **Je crée des thématiques** dans la campagne (ex. Générique, Hockey, AZIMUT). L'ordre est modifiable par glisser-déposer.
3. **Je dépose les images d'une thématique** dans sa zone de dépôt (plusieurs fichiers à la fois, JPG, PNG, GIF animés). L'application lit les dimensions de chaque fichier et le classe automatiquement dans le bon format (règles plus bas). Les fichiers non reconnus vont dans un bac « Non classé » où je peux les assigner à la main ou les supprimer.
4. **Le deck se génère tout seul** et se met à jour à chaque dépôt.
5. **Je saisis ou j'importe les textes** des annonces (optionnel, voir « Deux versions »).
6. **Je génère un lien de partage** pour ma directrice, en version « Visuels » ou « Textes ».
7. **Ma directrice ouvre le lien** (sans compte), parcourt le deck, et pour chaque annonce clique **Approuver** ou **Demander une modification** avec un commentaire.
8. **Je vois les statuts et commentaires** dans mon tableau de bord, je remplace les visuels ou corrige les textes, et le même lien reflète la nouvelle version.

---

# Reconnaissance des formats

Lecture des dimensions côté client (naturalWidth / naturalHeight) avant l'envoi. Classement par **ratio**, avec une tolérance de ±1 %, pas par taille exacte (une graphiste peut livrer du 1080x1080 ou du 1200x1200).

| Ratio / taille | Format | Usage dans le deck |
|---|---|---|
| 1:1 | Meta fil 1:1 | Facebook fil + Instagram fil |
| 4:5 | Meta fil 4:5 | Facebook fil + Instagram fil |
| 9:16 | Meta Reels et Stories | Facebook Reels + Instagram Reels |
| 970x250, 728x90, 300x600, 300x250, 320x100 (taille exacte) | Bannière display | Slide « Bannières GIF » |
| Autre | Non classé | Bac à trier manuellement |

Prévoir une table de formats dans un fichier de configuration pour pouvoir ajouter des tailles plus tard (160x600, 320x50, 300x50, 970x90, 1.91:1, etc.).

Un GIF animé doit rester animé partout (dépôt, deck, export). Ne jamais le convertir ni le recompresser.

---

# Structure du deck (à reproduire exactement)

Canvas fixe **1920 x 1080**, mis à l'échelle pour remplir la fenêtre (letterbox si besoin). Navigation : flèches du clavier, points de navigation, plein écran. Impression / PDF : Ctrl+P, une slide par page, format 16:9 (13,33 x 7,5 po), arrière-plans imprimés.

**Ordre des slides :**

1. **Couverture** : fond de la couleur d'accent de la marque (CMSA : jaune `#FFC501`), logo de la marque centré (environ 300 px de large), titre de la campagne centré (Rubik 700, 112 px, couleur sombre de la marque), sous-titre centré dessous (Rubik 400, 44 px). Rien d'autre.
2. **Intercalaire « Facebook »** : fond sombre de la marque (CMSA : `#202741`), mot « Facebook » centré, Rubik 700, 160 px, couleur d'accent.
3. Une slide **Facebook par thématique**, dans l'ordre des thématiques.
4. **Intercalaire « Instagram »**, puis une slide Instagram par thématique.
5. **Intercalaire « Bannières GIF »**, puis une slide de bannières par thématique.

Un canal ou une thématique sans visuels ne génère pas de slide. Une thématique dont il manque un format affiche un **placeholder** à la place (bloc gris clair `#E4E2DA` aux bonnes proportions, libellé discret « Visuel 1:1 » en `#8C8A7E`, 28 px).

**Règles de sobriété (non négociables) :**
- Aucun surtitre, aucune légende, aucune indication inutile, aucun numéro de slide, aucun pied de page.
- Titre des slides de contenu : en haut à gauche, Rubik 600, 52 px, format `Canal  Thématique` avec le canal en gris `#7A7F94` et la thématique en couleur sombre (ex. « **Facebook**  Hockey »).
- Fond des slides de contenu : `#F2F1EC`.
- Formes arrondies, ombres douces. **Pas** de barre d'accent décorative à gauche, **pas** de blocs de couleur décoratifs, **pas** de look « template IA ».
- Jamais de tiret cadratin (—) dans les textes générés par l'application.

---

# Slides de contenu Meta

Chaque slide montre les 3 formats d'une thématique **côte à côte**, centrés, alignés en haut, espacés de 64 px, dans cet ordre : 1:1, 4:5, 9:16. Les maquettes imitent l'interface réelle sans logos de plateformes.

Padding de slide : 64 px en haut, 128 px sur les côtés, 56 px en bas. Espace titre / maquettes : 40 px. Police des maquettes : Arial / pile système (comme les vraies apps).

**Profil affiché dans les maquettes** : nom de la page (ex. « Collège du Mont-Sainte-Anne ») et avatar rond issus de la configuration de la marque. Mention « Sponsorisé » sous le nom.

### Facebook fil (1:1 = 460 px de large, 4:5 = 400 px de large)
Carte blanche, rayon 24 px, ombre `0 16px 48px rgba(32,39,65,0.14)`, overflow caché :
- En-tête : avatar 48 px rond, nom (20 px, gras, `#050505`), « Sponsorisé » (17 px, `#65676B`). Padding 18/20/12 px.
- Texte principal (22 px, interligne 1.35, `#050505`), padding 0 20 14 px.
- Visuel pleine largeur (1:1 ou 4:5).
- Barre de lien sur fond `#F0F2F5`, padding 14/20 px : à gauche le domaine en majuscules (15 px, gris), le titre (21 px, gras), la description (17 px, gris) ; à droite le bouton CTA (19 px, 600, fond `#E4E6EB`, rayon 8 px).

### Facebook Reels (9:16 = 468 x 832 px)
Rectangle rayon 28 px, visuel en plein cadre, dégradé noir léger en haut (140 px) et plus marqué en bas (380 px, jusqu'à 82 % d'opacité). En haut à gauche : avatar + nom + « Sponsorisé » en blanc. En bas : texte principal en blanc (23 px), puis bouton CTA pleine largeur, fond blanc, rayon 12 px, texte centré.

### Instagram fil (1:1 = 460 px, 4:5 = 420 px)
Carte blanche rayon 24 px : en-tête (avatar 44 px, nom 19 px gras `#262626`, « Sponsorisé » 16 px), visuel pleine largeur, barre CTA (« S'inscrire » à gauche, chevron « › » à droite, filet bas `#EFEFEF`), puis légende 22 px : **nom de la page en gras** suivi du texte principal.

### Instagram Reels (9:16 = 468 x 832 px)
Comme Facebook Reels, mais avatar cerclé de blanc et bouton CTA semi-transparent (`rgba(255,255,255,0.92)`) avec texte à gauche et chevron « › » à droite.

---

# Slide Bannières GIF

Une slide par thématique, bannières **à taille réelle** (1 px = 1 px du canvas), sans arrondi (ce sont des bannières), ombre douce `0 12px 36px rgba(32,39,65,0.16)`. Disposition :
- Colonne de gauche (espacement 48 px) : 970x250, puis 728x90, puis une ligne avec 300x250 et 320x100.
- Colonne de droite : 300x600.
- Les deux colonnes centrées, espacées de 64 px.

Si d'autres tailles sont ajoutées plus tard, prévoir un algorithme d'agencement simple (tri par largeur décroissante, remplissage en colonnes) qui ne dépasse jamais 1664 x 860 px.

---

# Deux versions du deck

Le même deck existe en deux versions, chacune avec son propre lien de partage :

**Version « Visuels »** : pour valider les créas avant que les textes existent. Les zones de texte des maquettes (texte principal, titre, description, légende Instagram, texte des Reels) sont remplacées par des **lignes squelettes** : barres arrondies gris clair (`#E4E6EB` sur fond blanc, blanc à 35 % sur les Reels), de largeurs variées (100 %, 92 %, 60 %), à la hauteur d'une ligne de texte. Le bouton CTA reste affiché.

**Version « Textes »** : maquettes complètes avec les textes saisis. Si un texte manque pour une annonce, afficher les lignes squelettes à sa place.

---

# Saisie des textes

Pour chaque combinaison canal x thématique x format, un formulaire avec :
- Facebook fil : texte principal, titre, description.
- Facebook Reels : texte principal.
- Instagram fil et Reels : texte principal.
- CTA : valeur par défaut au niveau de la campagne (« S'inscrire »), modifiable par annonce.

**Compteurs de caractères en direct** avec les limites recommandées : texte principal 125, titre 40, description 30. Dépassement = compteur en orange et avertissement « Meta tronquera après 125 caractères », sans bloquer l'enregistrement. Remplacer automatiquement tout tiret cadratin par un trait d'union, avec un avertissement.

**Aperçu en direct** : la maquette se met à jour pendant la frappe.

**Import / export texte** dans ce format exact (c'est celui que j'envoie au campaign manager) :

```
[FB | Générique | Fil 1:1]
Texte principal :
Nous offrons à votre fils un espace d'apprentissage sain. En classe, une pédagogie active et bienveillante l'aide à réussir.
Titre :
Un secondaire encadré pour votre fils
Description :
Admissions 2027-2028

[IG | Hockey | Reels et Stories 9:16]
Texte principal :
Bien plus que le hockey. Inscrivez votre fils pour 2027-2028.
```

Canal : `FB` ou `IG`. Format : `Fil 1:1`, `Fil 4:5`, `Reels et Stories 9:16`. En-tête du fichier exporté : annonceur, bouton, lien de destination. Le parseur doit tolérer les espaces superflus et les lignes vides.

---

# Validation par la directrice

- **Lien de partage** non devinable (jeton aléatoire, 24 caractères au moins), sans compte. À la première visite, demander son nom une seule fois (mémorisé dans le navigateur).
- Mode **présentation** (le deck tel quel) et mode **révision** : au survol ou au toucher d'une maquette, deux boutons discrets apparaissent : **Approuver** et **Commenter**. Un commentaire passe l'annonce en « À modifier ».
- Chaque annonce a un statut : En attente / Approuvée / À modifier. Pastille discrète sur la maquette en mode révision seulement, jamais en mode présentation ni à l'impression.
- Bouton « Tout approuver » pour une slide entière.
- Le lien fonctionne sur téléphone : en dessous de 900 px de large, afficher les slides empilées verticalement, mises à l'échelle à la largeur de l'écran.
- Quand je remplace un visuel ou modifie un texte, l'annonce repasse en « En attente » et l'historique des commentaires est conservé.

---

# Tableau de bord (admin)

- Liste des campagnes avec progression (ex. « 14 / 18 annonces approuvées »).
- Vue campagne : thématiques, zones de dépôt, bac « Non classé », formulaires de textes, aperçu du deck, liens de partage des deux versions (copier en un clic), fil des commentaires par annonce.
- Remplacer un visuel : glisser une nouvelle image sur une maquette existante.
- Dupliquer une campagne (structure + thématiques, sans les visuels).

---

# Marques

Fichier de configuration (ou table) par marque : nom, nom de page affiché dans les maquettes, avatar, logo pour couverture (fond transparent), domaine affiché (ex. `collegecmsa.ca`), couleur sombre, couleur d'accent, couleur de texte sur accent.

À créer au départ :
- **CMSA** : sombre `#202741`, accent `#FFC501`, page « Collège du Mont-Sainte-Anne », domaine `collegecmsa.ca`.
- **Collège Universel** : sombre `#116F3A`, vert `#128945`, lime `#96BA24`, vert clair `#DDEBC8`. Accent de couverture : `#96BA24` avec texte `#116F3A`. Page « Collège Universel », domaine `collegeuniversel.ca`.

Je fournirai les logos et avatars. Prévoir des fichiers de remplacement en attendant.

---

# Stack technique

- **Next.js** (App Router, TypeScript), déployé sur **Vercel**.
- **Vercel Blob** pour les images (envoi direct depuis le navigateur, fichiers jusqu'à 20 Mo, GIF conservés tels quels).
- **Base de données Postgres** via l'intégration Neon de la marketplace Vercel, ORM Drizzle.
- **Accès admin** protégé par mot de passe (variable d'environnement `ADMIN_PASSWORD`, cookie de session signé, middleware). Les routes `/r/[token]` (révision) sont publiques.
- Polices : Rubik (Google Fonts, via `next/font`) pour les titres et couvertures, pile système Arial pour les maquettes.
- Rendu des slides en **HTML/CSS** (pas de canvas), pour que le texte reste net à toutes les tailles et que l'impression PDF soit propre. Toutes les dimensions en px sur le canvas 1920 x 1080, mises à l'échelle avec `transform: scale()`.
- Impression : `@page { size: 13.333in 7.5in; margin: 0 }`, une slide par page, attendre le chargement des polices (`document.fonts.ready`) avant d'imprimer.
- Pas de dépendance à une API d'IA dans cette version.

**Modèle de données indicatif** : `brands`, `campaigns` (marque, titre, sous-titre, CTA par défaut, lien de destination), `themes` (campagne, nom, ordre), `assets` (thématique, url, largeur, hauteur, format, type MIME), `ads` (campagne, thématique, canal, format, texte principal, titre, description, CTA, statut), `share_links` (campagne, version, jeton), `comments` (annonce, auteur, texte, date).

---

# Critères d'acceptation

1. Je dépose 8 fichiers d'une thématique (1080x1080 JPG, 1080x1350 JPG, 1080x1920 JPG, et 5 GIF 300x250, 300x600, 320x100, 728x90, 970x250) : ils sont tous classés sans intervention, et le deck contient une slide Facebook, une slide Instagram et une slide Bannières pour cette thématique.
2. Avec 3 thématiques, le deck compte 13 slides : couverture, 3 intercalaires, 9 slides de contenu.
3. Les GIF restent animés dans le deck et dans le lien de révision.
4. La version « Visuels » n'affiche aucun texte d'annonce, seulement des lignes squelettes.
5. L'import du fichier texte au format ci-dessus remplit tous les champs correspondants ; l'export produit un fichier identique.
6. Ma directrice peut approuver ou commenter chaque annonce depuis son téléphone, sans compte, et je vois le résultat dans le tableau de bord.
7. Ctrl+P produit un PDF 16:9 propre, une slide par page, sans boutons ni pastilles de révision.
8. Aucun tiret cadratin dans l'interface ni dans les exports.

---

# Méthode de travail

- Commence par le rendu du deck (couverture, intercalaires, slides Meta, slide bannières) avec des données factices et des images de test, et fais-le valider visuellement avant de construire le reste.
- Ensuite : dépôt et classement des images, puis textes, puis liens de révision et commentaires, puis tableau de bord.
- Écris des tests pour la classification des formats et pour l'import / export texte.
- Fournis un README avec les étapes de déploiement Vercel (variables d'environnement, création du stockage Blob et de la base Neon).
- Si une décision n'est pas couverte ici, choisis l'option la plus simple et note-la dans le README plutôt que de me bloquer.

# Gabarit import annonces

Un fichier `.xlsx` crée un plan. La sélection montre un aperçu et un rapport avant confirmation. Seules les lignes valides sont créées dans une transaction.

Feuilles: Facebook, Instagram, LinkedIn, TikTok, YouTube, casse et accents normalisés. Une feuille historique de ville est acceptée si toutes les lignes désignent la même plateforme supportée dans Plateforme; une notice l'explique. Une feuille plateforme prime sur sa colonne Plateforme et tout conflit de ligne est refusé.

Les titres et métadonnées peuvent précéder la ligne d'en-têtes. Colonnes obligatoires: Plateforme, Format, Texte principal. Colonnes supplémentaires: #, Titre, Description, CTA, Lien de destination (tracké), Fichier, Type, Angle / Déclinaison. Car. est ignorée.

| Format | Placement / média / ratio |
|---|---|
| Image | Feed image, ratio par défaut |
| Video 4/5 | Feed vidéo 4:5 |
| Story image 9/16 | Stories image 9:16 |
| Story vidéo 9/16 | Stories vidéo 9:16 |
| Reel | Reels vidéo 9:16 |
| In-stream vidéo 16/9 | YouTube In-stream vidéo 16:9 |
| In-feed vidéo 16/9 | YouTube In-feed vidéo 16:9 |
| Shorts vidéo 9/16 | YouTube Shorts vidéo 9:16 |
| Carrousel | Feed carrousel, 2 à 10 cartes |

Story seul est refusé car ambigu. Feed implicite devient In-feed pour TikTok/YouTube, puis la combinaison est validée. Les cartes viennent de Photo n (référence visuel), Fiche n (titre puis description sur lignes suivantes); Titre n et Description n sont prioritaires.

Le manifeste partage les fichiers par référence + ratio, y compris capture vidéo et image. Un nom multi-ratio ou une collision normalisée n'est pas associé automatiquement. Images sans correspondance: sélection manuelle. Fichiers JPG/JPEG, PNG, WebP, GIF, 50 Mo maximum; captures fixes pour vidéos.

Classeur limité à 10 Mo et 500 annonces. Le fichier réel historique vérifié contient 18 annonces, réparties dans deux feuilles villes, avec deux notices de compatibilité.

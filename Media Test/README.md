# Media Test

Jeu synthétique couvrant les formats réellement proposés par les deux espaces de l’application.

## Commencer

- **01-Studio** : les 18 formats avec média du Studio connecté, classés par canal. C’est le dossier à utiliser pour la nouvelle plateforme.
- **02-Social-Ads** : les 37 variantes du module Social Ads, dont LinkedIn, les ratios supplémentaires et les carrousels.
- **Catalogue.csv** : liste des fichiers avec canal, usage et dimensions.
- **Apercu-couleurs.png** : légende des couleurs, pas un fichier à déposer comme annonce.

## Images, vidéos, carrousels

92 PNG de test, plus 28 MP4 de 2 secondes, fixes, sans son. Tous les visuels affichent le canal, le format et leurs dimensions. Une couleur unique par canal.

Chaque format vidéo possède **un PNG de référence ET un vrai MP4**. Pour YouTube, TikTok, Reels et les autres formats vidéo, déposer le MP4 : une image PNG est détectée comme une image et ne valide pas un format vidéo.

Chaque carrousel Social Ads comprend 10 cartes numérotées. Utiliser les cartes 01 et 02 pour le minimum, puis en ajouter jusqu’à 10. Les cartes d’un même carrousel gardent le même ratio.

Les PNG Display ont les dimensions exactes demandées : 300×250, 300×600, 728×90, 970×250 et 320×100. Tous restent sous 150 Ko. Les fichiers de ce pack sont très inférieurs au plafond de recette de 50 Mo.

Le ratio 1,91:1 utilise 1200×628 pixels, compatible avec la tolérance du catalogue Social Ads. Les autres ratios utilisent 1080×1080, 1080×1350, 1080×1920 ou 1920×1080 pixels.

## Google SEM

Ce canal produit une annonce texte, sans média. Copier les titres et descriptions de `01-Studio/Google SEM/Textes-test-Google-SEM.txt`. Le PNG vert est uniquement une référence visuelle ; il ne remplace pas les champs de l’annonce.

## Couleurs

- Facebook : `#2456C7`
- Instagram : `#9228A5`
- TikTok : `#007C80`
- YouTube : `#C62828`
- Display : `#A65000`
- LinkedIn : `#31556B`
- Google SEM : `#247443`

## Sources

- `lib/campaign-studio/workspace/catalog.ts` pour le Studio.
- `lib/social-ads/specs.ts` et `allowedRatios` pour les variantes Social Ads.

Aucun fichier client ni texte réel de campagne utilisé. Ces fichiers servent aux tests, pas à la diffusion.

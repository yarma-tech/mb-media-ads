# Démonstration Léyon

Créée le 29 octobre 2026 pour présentation interne. Source de marque : https://leyon.pro/.

- 18 annonces, thème unique Notoriété, 3 par canal : Facebook, Instagram, TikTok, YouTube, Display, Google SEM.
- Personnages fictifs générés par IA. Logotype seul en BINSEKA Medium 500, conforme aux deux références fournies par le propriétaire. Aucun symbole accolé. Police Inter pour les textes publicitaires.
- 6 animations de 240 images à 30 fps (8 secondes vidéo), exports H.264. Les conteneurs peuvent inclure un léger padding audio technique.
- Visuels et sources de rendu locaux : `output/leyon-notoriete/`. Images originales conservées; médias importés dans le stockage privé Studio.
- Copy et scénarios : `CAMPAGNE.md`; données structurées : `campagne.json`; dimensions et durées : `media-verification.json`.
- Campagne créée via les commandes Studio, médias contrôlés par le vérificateur serveur, 18 annonces envoyées en validation. Aucune diffusion publicitaire réelle.

Le lien public se crée depuis l'icône de partage d'une campagne avec un compte Validateur. Il donne accès aux annonces en lecture seule. La révocation coupe les nouvelles requêtes, y compris médias. Une page ouverte revérifie l'accès toutes les 15 secondes et au retour au premier plan. Un fichier déjà téléchargé ne peut pas être rappelé.

Le token public n'est pas conservé en clair : copier le lien à sa création. Après rechargement, créer un nouveau lien remplace l'ancien. Aucun envoi par email n'est inclus dans cette première livraison.

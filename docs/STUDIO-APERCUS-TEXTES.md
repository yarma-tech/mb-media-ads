# Aperçus des textes publicitaires

Le Studio conserve toujours le texte intégral dans le tableau et les champs d’édition. La coupure concerne uniquement le rendu de l’annonce, commun au tableau, à la validation et à la fenêtre de correction.

La longueur visible est calculée avec la police et la largeur réelles de l’aperçu. Les retours à la ligne sont pris en compte; les caractères accentués et les emojis composés ne sont pas découpés. Le lien « Voir plus » occupe une place dans la dernière ligne. « Voir moins » replie le texte, sans sauvegarde ni changement de statut.

| Placement du catalogue | Rendu replié |
| --- | --- |
| Facebook fil, image ou vidéo | 3 lignes sur bureau, 1 sur mobile; « Voir plus » |
| Instagram fil | 2 lignes; « Voir plus » |
| Meta Story / Reel | 2 lignes dans la zone de texte; « Voir plus »; lecture défilante à l’expansion |
| TikTok vertical | 100 caractères maximum dans l’extrait, au plus 4 lignes; « Voir plus » pour consulter la copie complète |
| YouTube in-stream | Extrait de 90 caractères au plus, 2 lignes; titre de 40 caractères au plus |
| YouTube Short | Extrait de 90 caractères au plus; 1 ligne mobile, 2 sur bureau; titre de 40 caractères au plus |
| Google Search | Exemple de 3 titres de 30 caractères et 2 descriptions de 90 caractères, ellipses selon l’espace; autres variantes conservées dans l’éditeur |
| Display | Fichier livré affiché tel quel, aucun texte supplémentaire inventé |

## Portée et sources

Ces aperçus simulent un placement déterminé. Ce ne sont pas des rendus délivrés par les régies : langue, largeur, réglages d’accessibilité, variantes de campagne et évolutions des plateformes peuvent changer le résultat final. Les seuils de saisie et recommandations des régies ne doivent pas être confondus avec un nombre universel de caractères visibles.

- Facebook mobile : capture fournie par l’utilisateur le 29 octobre 2026 (texte sur une ligne, puis « See more »). Les règles Meta de bureau, Instagram et Story/Reel ci-dessus sont des conventions d’aperçu; les pages officielles Ads Guide n’étaient pas lisibles sans connexion pendant la vérification. Aucun plafond de caractères Meta n’est présenté comme certifié.
- Google Search : https://support.google.com/google-ads/answer/7684791?hl=en (30/90, variantes sélectionnées, troncature possible selon la place).
- YouTube Shorts : https://support.google.com/google-ads/answer/16041697?hl=en (description 90 caractères, 1 ligne mobile / 2 bureau, titre recommandé 40).
- YouTube in-stream, modèle Demand Gen : https://support.google.com/google-ads/answer/17141078?hl=en (titre 40, description 90; d’autres types de campagnes possèdent d’autres limites).
- TikTok : https://ads.tiktok.com/resources/help/article/tiktok-auction-in-feed-ads?lang=en (4 lignes pour Spark, rendu dépendant de l’appareil) et https://ads.tiktok.com/business/library/Ads_Manager_Playbook_SMB_EN.pdf (texte Non-Spark de 100 caractères latins). Le catalogue actuel ne distingue pas Spark / Non-Spark; la lecture intégrale dans le Studio sert à examiner la copie et ne garantit pas son affichage public.

Le comportement est couvert par `tests/studio/preview.spec.ts` : coupure, expansion/repli, redimensionnement, retours à la ligne, Unicode, conservation des champs et absence de commande serveur lors de la lecture.

# Aperçus des textes publicitaires

Le Studio conserve toujours le texte intégral dans le tableau et les champs d’édition. La coupure concerne uniquement le rendu de l’annonce, commun au tableau, à la validation et à la fenêtre de correction.

La longueur visible est calculée avec la police et la largeur réelles de l’aperçu. Les retours à la ligne sont pris en compte; les caractères accentués et les emojis composés ne sont pas découpés. Le lien « Voir plus » occupe une place dans la dernière ligne. « Voir moins » replie le texte, sans sauvegarde ni changement de statut.

## Comportement actuellement implémenté

Ce tableau décrit le code, pas des limites certifiées par les régies. Voir la vérification officielle ci-dessous avant de modifier ses seuils.

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

- Meta : la capture utilisateur ne constitue pas une spécification. Les guides officiels ont désormais été lus dans Chrome le 29 octobre 2026. La règle actuelle « une ligne sur mobile » reste une convention non certifiée; elle ne doit pas être présentée comme un comportement universel de Facebook.
- Google Search : https://support.google.com/google-ads/answer/7684791?hl=en (30/90, variantes sélectionnées, troncature possible selon la place).
- YouTube Shorts : https://support.google.com/google-ads/answer/16041697?hl=en (description 90 caractères, 1 ligne mobile / 2 bureau, titre recommandé 40).
- YouTube in-stream, modèle Demand Gen : https://support.google.com/google-ads/answer/17141078?hl=en (titre 40, description 90; d’autres types de campagnes possèdent d’autres limites).
- TikTok : https://ads.tiktok.com/resources/help/article/tiktok-auction-in-feed-ads?lang=en (4 lignes pour Spark, rendu dépendant de l’appareil) et https://ads.tiktok.com/business/library/Ads_Manager_Playbook_SMB_EN.pdf (texte Non-Spark de 100 caractères latins). Le catalogue actuel ne distingue pas Spark / Non-Spark; la lecture intégrale dans le Studio sert à examiner la copie et ne garantit pas son affichage public.

Le comportement est couvert par `tests/studio/preview.spec.ts` : coupure, expansion/repli, redimensionnement, retours à la ligne, Unicode, conservation des champs et absence de commande serveur lors de la lecture.

## Vérification officielle du 29 octobre 2026

Sources Meta lues directement dans le Guide et le centre d’aide officiels via Chrome. Leur récupération par l’outil de recherche redirigeait vers une connexion; cette difficulté ne concerne plus la vérification ci-dessous. Objectif sélectionné dans le Guide : Notoriété.

### Meta : recommandations, pas maximum visible garanti

[Pratiques exemplaires pour le texte dans les publicités](https://www.facebook.com/business/help/223409425500940?id=271710926837064) : la recommandation générale est de 125 caractères pour le texte principal, 40 pour le titre et 25 pour la description. Le texte peut être tronqué selon le placement et l’appareil. La recommandation rédactionnelle d’une à trois lignes n’est pas un contrat de rendu.

| Placement vérifié dans le guide Image | Texte principal recommandé | Titre recommandé | Source primaire |
| --- | --- | --- | --- |
| Facebook Feed | 50 à 150 caractères | 27 | [Guide](https://www.facebook.com/business/ads-guide/update/image/facebook-feed) |
| Instagram Feed | 125 caractères | 40 | [Guide](https://www.facebook.com/business/ads-guide/update/image/instagram-feed) |
| Facebook Stories | 125 caractères | 40 | [Guide](https://www.facebook.com/business/ads-guide/update/image/facebook-story) |
| Instagram Stories | 125 caractères | Non indiqué | [Guide](https://www.facebook.com/business/ads-guide/update/image/instagram-story) |
| Facebook Reels | 40 caractères | 55 | [Guide](https://www.facebook.com/business/ads-guide/update/image/facebook-facebook-reels) |
| Instagram Reels | 44 caractères | Non indiqué | [Guide](https://www.facebook.com/business/ads-guide/update/image/instagram-reels) |

La page Vidéo par défaut, Facebook Feed, indique également 50 à 150 caractères et un titre de 27 caractères : https://www.facebook.com/business/ads-guide/update/video. Les autres combinaisons vidéo ne sont pas extrapolées depuis les pages Image.

Aucune de ces sources ne fournit un nombre universel exact de caractères avant « Voir plus ». Ne pas transformer les recommandations en contraintes bloquantes de saisie, ni promettre une reproduction exacte à partir de ces seuls nombres.

### YouTube Shorts : limites de saisie et lignes visibles séparées

[Spécifications officielles](https://support.google.com/google-ads/answer/16041697?hl=en) : description saisie limitée à 90 caractères; affichage tronqué au-delà d’une ligne mobile ou de deux lignes bureau/TV. Le nombre visible varie avec la langue et les réglages de l’appareil. Le titre de 40 caractères est recommandé pour la carte CTA mobile, pas annoncé comme un maximum universel de tous les formats YouTube.

### Google Search : 30/90 sont des limites de champs

[Annonces responsives officielles](https://support.google.com/google-ads/answer/7684791?hl=en) : titre de 30 caractères, description de 90, chemin de 15; caractères à double largeur comptés double. Google peut raccourcir le texte selon l’espace, même si les champs respectent ces limites. Trois titres et deux descriptions ne sont pas garantis à chaque diffusion. Aucun nombre unique de caractères effectivement affichés.

### TikTok : ne pas mélanger Spark et Non-Spark

[Spécifications officielles, mise à jour juin 2026](https://ads.tiktok.com/resources/help/article/tiktok-auction-in-feed-ads?lang=en) : jusqu’à quatre lignes de légende pour Spark Ads (Pull), emojis compris. La section Non-Spark ne précise pas de maximum de caractères de légende. Le document avertit aussi de différences entre aperçu et rendu réel selon l’appareil.

L’ancien PDF officiel cité plus haut ne suffit pas à certifier un plafond actuel universel de 100 caractères. Le catalogue ne distingue pas Spark et Non-Spark; le mélange actuel « 100 caractères + quatre lignes » n’est donc pas validé par cette source.

### Conséquences pour les aperçus

- Conserver les textes intégraux dans les données et les champs d’édition.
- Séparer recommandations rédactionnelles, limites de saisie, et conventions de rendu.
- Ne plus justifier la ligne Facebook mobile par la capture utilisateur.
- Ne pas qualifier le plafond TikTok de 100 caractères de règle universelle vérifiée.
- Pour une fidélité exacte Meta, confronter le rendu à un aperçu officiel pour le placement et l’appareil concernés; les recommandations de longueur ne suffisent pas.

Cette vérification documentaire ne modifie pas le code ni le déploiement existant. Les écarts du comportement actuellement implémenté sont explicités ci-dessus.

## Compteurs du tableau

Le tableau affiche un décompte circulaire discret dans les cellules possédant un repère documenté. Il suit la saisie locale immédiatement, passe progressivement du vert à l’orange, atteint l’orange à zéro puis continue en négatif. Aucun `maxLength`, aucune suppression de texte et aucun nouveau blocage de sauvegarde n’est ajouté. Le compteur ne devient pas une étape de tabulation.

Le survol et la description accessible distinguent recommandation rédactionnelle et limite du champ. Une recommandation n’annonce pas le point exact de « Voir plus ». Facebook Feed utilise la borne haute de 150 caractères. Les titres suivent leur propre recommandation, sans reprendre celle du texte principal. Les champs internes (thématique, nom), URL, CTA libre, Display et TikTok n’ont pas de compteur faute de seuil pertinent vérifié.

Les pages vidéo suivantes ont également été lues directement dans le guide Meta, objectif Notoriété, le 29 octobre 2026 :

- [Facebook Reels vidéo](https://www.facebook.com/business/ads-guide/update/video/facebook-facebook-reels) : texte principal recommandé 40 caractères, titre 55.
- [Instagram Reels vidéo](https://www.facebook.com/business/ads-guide/update/video/instagram-reels) : texte principal recommandé 44 caractères; pas de titre chiffré.
- [Instagram Stories vidéo](https://www.facebook.com/business/ads-guide/update/video/instagram-story) : texte principal recommandé 125 caractères; pas de titre chiffré.

YouTube Shorts distingue la description de 90 caractères (limite de saisie) du titre de 40 (recommandation). Pour In-stream, 90/40 reste explicitement un repère du modèle Demand Gen utilisé par l’aperçu, pas un maximum universel YouTube.

Google Search : le compteur prend le texte le plus long dans les cellules contenant plusieurs titres ou descriptions, avec son numéro dans l’explication; il ne somme pas les variantes. Les chemins disposent chacun d’un budget de 15. Les limites métier déjà présentes lors de l’envoi restent inchangées.

Le comptage Meta et YouTube utilise les graphèmes (accent combiné et emoji composé comptés comme un caractère visible). Google utilise les points de code, en cohérence avec son validateur existant. Limitation connue : le double comptage des caractères chinois, japonais et coréens documenté par Google n’est pas encore implémenté dans ce validateur; les compteurs Google ne constituent donc pas une certification pour ces langues.

Les compteurs n’ajustent pas les règles de troncature de la prévisualisation. Les conventions non certifiées décrites plus haut restent à distinguer des recommandations affichées dans le tableau.

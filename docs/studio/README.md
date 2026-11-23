# Studio campagnes

Documentation du projet Studio campagnes (routes `/studio/*` et `/partage/*`). Retour à l'index : [README](../../README.md).

## Template à présenter

Entrée : `/studio/validation`. L’ancien lien `/decks/apercu` y redirige.

| Page                   | Fonctionnement                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/studio/validation`   | Visuels déployés par canal, approbation directe par visuel, filtre campagne et demande de modification.  |
| `/studio/on-air`       | Campagnes approuvées passées On air, mockups Facebook, Instagram, YouTube et Display, filtre par canal, retour en validation. |
| `/studio/statistiques` | Impressions, clics, CTR, conversions, dépenses, évolution, répartition par canal, tableau et export CSV filtré.               |

Interface allégée après retour utilisateur : navigation repliée par défaut et dépliable, visuels directement déployés en colonnes par canal, validation en un clic, commentaires et informations de campagne repliés. Les zones sont distinguées par leurs fonds et espacements, sans séparateurs fins. La page On air privilégie les mockups ; les chiffres restent dans Statistiques. Trois indicateurs et une courbe sont visibles d’emblée ; le tableau, les coûts et la répartition par canal s’ouvrent via « Détail par campagne et par canal ». Référence consultée : Plausible dans [l’analyse publique de Mobbin](https://mobbin.com/blog/what-good-dashboard-design-looks-like).

Sept campagnes fictives, deux marques, trois campagnes initialement On air. Pour démontrer le parcours : ouvrir **Admissions 2027-2028**, approuver le visuel Facebook restant, puis **Passer On air**. La campagne apparaît dans **Campagnes on air** avec ses trois placements. Une campagne doit avoir tous ses visuels approuvés avant de passer On air.

Recherche et filtre marque communs aux trois pages. Statistiques filtrables sur 7/30 jours et par canal, avec une date de référence fixe au 22 octobre 2026. CTR et CPC calculés sur les totaux. Une nouvelle campagne On air démarre sans résultats.

Les décisions et commentaires restent dans ce navigateur (`localStorage`, clé `mb-media:campaign-studio:v1`). **Réinitialiser la démo** remet les exemples initiaux. Aucune API publicitaire, aucune diffusion réelle, aucune sauvegarde serveur ou collaboration multi-utilisateur. Le lecteur YouTube est une simulation animée de 30 secondes ; il ne lit pas une vidéo réelle.

Modules : `lib/campaign-studio/` pour données, transitions et stockage ; `app/(studio)/studio/` pour les routes et composants. Le style est isolé de l’application existante. Les routes publiques exposent uniquement ces fixtures locales.

## Déploiement Vercel de l'aperçu

1. Importer le dépôt dans un projet Vercel ou utiliser le projet Vercel déjà associé au dépôt.
2. Sélectionner Next.js, répertoire racine du dépôt, installation `npm ci`, build `npm run build`.
3. Conserver les variables existantes nécessaires aux autres modules. Aucun secret Blob/Neon n'est requis par l'aperçu statique.
4. Déployer d'abord un environnement Preview et ouvrir `/studio/validation`.

Aucun déploiement n'a été effectué pour cette étape. Le dépôt contient également des changements antérieurs : vérifier le contenu publié avant tout déploiement.

## Recette du studio

Parcours Chromium vérifié : commentaire obligatoire, approbation avant On air, conservation après rechargement, retour en validation, recherche, marque, canal, période, lecture/pause YouTube et CSV conforme aux filtres. Les trois pages ont été contrôlées en 1440 px, 390 px et 320 px, sans débordement horizontal global ni image manquante. Menu mobile : focus à l’ouverture, Tab contenu dans le menu, Échap et retour au bouton. Le tableau statistique défile horizontalement sur mobile.

Limites : template local, médias illustratifs, statistiques fictives, aucune publication ni connexion publicitaire. Safari et téléphone physique non testés. Les captures de recette et le CSV se trouvent dans `.playwright-mcp/`.

Vérification du 22 octobre 2026 : 52 tests passent, 1 test de fichier privé absent est ignoré ; lint, TypeScript et build passent. Les trois routes compilées répondent HTTP 200. Pour présenter sans interface de développement : `npm run build`, puis `npm run start -- --hostname 127.0.0.1 --port 3001` et ouvrir `http://127.0.0.1:3001/studio/validation`.

Point préexistant à traiter avant publication publique : l’audit npm signale des vulnérabilités dans Next.js 16.4.0, dont GHSA-2464-fhr4-w9xw et GHSA-673q-mjm6-r5xr. Le premier build s’arrête sur le rappel de sécurité ; la reprise du build termine avec succès. Les dépendances n’ont pas été mises à jour dans cette adaptation du template.


Validation visuelle : fond blanc, créations seules et actions directes. Deux modes : grille par canal et carrousel (droite pour approuver, gauche pour ouvrir les détails, bouton pour passer). Au clic, une fenêtre modale affiche le mockup et permet de modifier texte publicitaire et CTA ; sauvegarde locale, retour à valider après modification. Les textes intégrés aux fichiers image/GIF restent éditables dans les sources graphiques.


Affichage final : Validation et On air montrent les annonces complètes (création, texte et CTA) en permanence, sans rollover sur ordinateur ou mobile. Les médias sont répartis en lignes successives par canal. Le retour d’une campagne On air en validation conserve tous ses placements.

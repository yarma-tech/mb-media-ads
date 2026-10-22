# MB Média Ads

Application Next.js App Router / TypeScript existante. Le prompt `prompt/PROMPT_Generateur_Decks_Campagnes.md` a produit un premier deck. À la demande suivante, la présentation principale devient un site SaaS de démonstration, style Linear.

## Studio campagnes : template à présenter

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

Modules : `lib/campaign-studio/` pour données, transitions et stockage ; `app/studio/` pour les routes et composants. Le style est isolé de l’application existante. Les routes publiques exposent uniquement ces fixtures locales.

## Deck conservé

Présentation secondaire avec données factices.

Ouvrir `/decks/presentation`. Cette route publique contient uniquement des données de démonstration locales. Elle ne lit aucune campagne ni donnée client.

- Marques CMSA et Collège Universel, palettes configurées.
- Trois thématiques : Générique, Hockey, AZIMUT. Exemple complet : 13 slides.
- Couverture, intercalaires, maquettes Facebook et Instagram (1:1, 4:5, 9:16), cinq tailles de bannières.
- Versions Visuels et Textes, squelettes par champ absent, placeholders par format manquant.
- Sélecteur d'exemples : campagne complète, formats/textes manquants, campagne vide.
- Canvas HTML/CSS 1920 × 1080, police Rubik via `next/font`, navigation clavier et points, plein écran.
- Sous 900 px : slides empilées, ajustées à la largeur, navigation synchronisée au défilement.
- Impression de toutes les slides, une par page, 13,333 × 7,5 pouces. Bouton Imprimer ou Ctrl+P / Cmd+P. Arrière-plans activés par CSS ; désactiver les en-têtes/pieds de page dans le dialogue du navigateur si nécessaire.

Les logos, avatars et créations de `public/deck-demo/` sont **provisoires et illustratifs**. Ils ne représentent pas une campagne officielle. Chaque GIF contient deux images animées et est servi directement par `<img>`, sans transformation. Un PDF fige nécessairement l'animation ; le navigateur conserve le GIF original.

## Démarrer

```sh
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Ouvrir <http://127.0.0.1:3000/studio/validation>.

L'aperçu ne nécessite aucune nouvelle variable d'environnement. L'application existante peut utiliser ses variables Supabase et Stripe habituelles. L'accès aux autres routes conserve sa protection actuelle.

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Rubik est téléchargée depuis Google Fonts au build, puis servie localement par Next.js. Le build nécessite donc un accès réseau à Google Fonts. Le test d'import d'un classeur réel existant est ignoré si le fichier personnel correspondant est absent de `~/Downloads` ; les tests avec fixtures restent exécutés.

## Organisation du module

| Chemin                             | Rôle                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `lib/campaign-decks/types.ts`      | Types fermés : marques, versions, canaux, formats, statuts                  |
| `lib/campaign-decks/config.ts`     | Marques et table des formats, classement exact display puis ratio Meta ±1 % |
| `lib/campaign-decks/slides.ts`     | Ordre des slides et exclusion des canaux/thématiques vides                  |
| `lib/campaign-decks/fixtures.ts`   | Campagnes de démonstration                                                  |
| `app/decks/apercu/_components/`    | Lecteur, slides et maquettes                                                |
| `app/decks/apercu/deck.module.css` | Dimensions fixes, adaptation écran et impression                            |
| `public/deck-demo/`                | Créations de test et fichiers de remplacement des logos                     |

Le rendu est isolé des maquettes Social Ads déjà présentes, dont les dimensions et usages diffèrent. Les textes longs sont tronqués visuellement dans les maquettes, sans modifier leur valeur source, pour conserver la hauteur du canvas et les CTA. Les tirets cadratins sont remplacés à l'affichage. Le champ de saisie avec avertissement sera ajouté à l'étape Textes.

## Déploiement Vercel de l'aperçu

1. Importer le dépôt dans un projet Vercel ou utiliser le projet Vercel déjà associé au dépôt.
2. Sélectionner Next.js, répertoire racine du dépôt, installation `npm ci`, build `npm run build`.
3. Conserver les variables existantes nécessaires aux autres modules. Aucun secret Blob/Neon n'est requis par l'aperçu statique.
4. Déployer d'abord un environnement Preview et ouvrir `/studio/validation`.

Aucun déploiement n'a été effectué pour cette étape. Le dépôt contient également des changements antérieurs : vérifier le contenu publié avant tout déploiement.

## Suite produit hors template

Le studio couvre la démonstration demandée. Ces éléments du produit connecté **restent à développer** :

1. Dépôt multi-fichiers jusqu'à 20 Mo, Vercel Blob direct navigateur, remplacement, bac Non classé et tri des thématiques.
2. Saisie avec compteurs et avertissements, aperçu pendant la frappe, import/export texte au format exact du prompt, tests du parseur et du round-trip.
3. Persistance Neon Postgres / Drizzle, accès admin par mot de passe et cookie signé, liens `/r/[token]`, validations et commentaires persistants.
4. Tableaux de bord alimentés par de vraies campagnes et données de régies, duplication des campagnes.
5. Ajout de tailles display : agencement automatique borné à 1664 × 860 px. L'étape actuelle reproduit la disposition fixe des cinq tailles de référence.

### Préparation Blob et Neon pour ces étapes

Dans le projet Vercel, créer un stockage **Blob** et lui associer les environnements souhaités. Vercel fournit `BLOB_READ_WRITE_TOKEN`, à utiliser uniquement côté serveur pour autoriser l'envoi direct. Les octets des GIF ne doivent subir aucune conversion.

Ajouter **Neon Postgres** depuis la marketplace Vercel, connecter la base au projet et récupérer sa chaîne de connexion dans `DATABASE_URL`. Les migrations Drizzle et leur commande d'exécution seront livrées avec le modèle de données ; elles n'existent pas encore pour ce module.

| Variable prévue         | Usage futur                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `BLOB_READ_WRITE_TOKEN` | Autorisation serveur des téléversements directs                |
| `DATABASE_URL`          | Connexion Postgres Neon, côté serveur                          |
| `ADMIN_PASSWORD`        | Mot de passe d'accès admin                                     |
| `SESSION_SECRET`        | Signature des cookies de session, secret aléatoire indépendant |

Ces variables ne sont pas encore consommées par le nouveau module. La protection admin Supabase de l'application existante reste distincte de l'authentification demandée pour les decks.

## Recette du rendu

Contrôles effectués sur navigateur Chromium : deux marques, deux versions, exemple incomplet, campagne vide, clavier, plein écran, mobile 390 px et 320 px, chargement des médias et animation GIF réelle. PDF de contrôle : 13 pages de 960 × 540 points, sans commandes de navigation, soit exactement 16:9. Capture PDF et captures du navigateur dans `.playwright-mcp/` pour la recette locale.

Limite connue : cette étape ne remplace pas une recette de liens de révision sur un téléphone réel ni une vérification Safari. Elle ne permet pas encore de partager ou modifier des campagnes persistantes.

## Recette du studio

Parcours Chromium vérifié : commentaire obligatoire, approbation avant On air, conservation après rechargement, retour en validation, recherche, marque, canal, période, lecture/pause YouTube et CSV conforme aux filtres. Les trois pages ont été contrôlées en 1440 px, 390 px et 320 px, sans débordement horizontal global ni image manquante. Menu mobile : focus à l’ouverture, Tab contenu dans le menu, Échap et retour au bouton. Le tableau statistique défile horizontalement sur mobile.

Limites : template local, médias illustratifs, statistiques fictives, aucune publication ni connexion publicitaire. Safari et téléphone physique non testés. Les captures de recette et le CSV se trouvent dans `.playwright-mcp/`.

Vérification du 22 octobre 2026 : 52 tests passent, 1 test de fichier privé absent est ignoré ; lint, TypeScript et build passent. Les trois routes compilées répondent HTTP 200. Pour présenter sans interface de développement : `npm run build`, puis `npm run start -- --hostname 127.0.0.1 --port 3001` et ouvrir `http://127.0.0.1:3001/studio/validation`.

Point préexistant à traiter avant publication publique : l’audit npm signale des vulnérabilités dans Next.js 16.4.0, dont GHSA-2464-fhr4-w9xw et GHSA-673q-mjm6-r5xr. Le premier build s’arrête sur le rappel de sécurité ; la reprise du build termine avec succès. Les dépendances n’ont pas été mises à jour dans cette adaptation du template.


Validation visuelle : fond blanc, créations seules et actions directes. Deux modes : grille par canal et carrousel (droite pour approuver, gauche pour ouvrir les détails, bouton pour passer). Au clic, une fenêtre modale affiche le mockup et permet de modifier texte publicitaire et CTA ; sauvegarde locale, retour à valider après modification. Les textes intégrés aux fichiers image/GIF restent éditables dans les sources graphiques.


Affichage final : Validation et On air montrent les annonces complètes (création, texte et CTA) en permanence, sans rollover sur ordinateur ou mobile. Les médias sont répartis en lignes successives par canal. Le retour d’une campagne On air en validation conserve tous ses placements.

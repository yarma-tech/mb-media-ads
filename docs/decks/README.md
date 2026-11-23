# Decks

Application Next.js App Router / TypeScript existante. Le prompt `docs/decks/PROMPT_Generateur_Decks_Campagnes.md` a produit un premier deck. À la demande suivante, la présentation principale devient un site SaaS de démonstration, style Linear.

Retour à l'index : [README](../../README.md).

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

## Organisation du module

| Chemin                             | Rôle                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `lib/campaign-decks/types.ts`      | Types fermés : marques, versions, canaux, formats, statuts                  |
| `lib/campaign-decks/config.ts`     | Marques et table des formats, classement exact display puis ratio Meta ±1 % |
| `lib/campaign-decks/slides.ts`     | Ordre des slides et exclusion des canaux/thématiques vides                  |
| `lib/campaign-decks/fixtures.ts`   | Campagnes de démonstration                                                  |
| `app/(decks)/decks/apercu/_components/`    | Lecteur, slides et maquettes                                                |
| `app/(decks)/decks/apercu/deck.module.css` | Dimensions fixes, adaptation écran et impression                            |
| `public/deck-demo/`                | Créations de test et fichiers de remplacement des logos                     |

Le rendu est isolé des maquettes Social Ads déjà présentes, dont les dimensions et usages diffèrent. Les textes longs sont tronqués visuellement dans les maquettes, sans modifier leur valeur source, pour conserver la hauteur du canvas et les CTA. Les tirets cadratins sont remplacés à l'affichage. Le champ de saisie avec avertissement sera ajouté à l'étape Textes.

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

# Decks de campagnes - plan du rendu

**Objectif :** livrer le rendu de référence avec données factices, pour validation visuelle avant la construction du reste, comme demandé dans le prompt.

**Source :** `prompt/PROMPT_Generateur_Decks_Campagnes.md`.

**Architecture :** route Next.js `/decks/apercu`, composants de présentation isolés, modèles TypeScript et configuration de marques indépendants du module Social Ads existant. Aucun accès aux campagnes réelles. Les GIF passent directement dans des éléments `img`.

**Contraintes :** canvas 1920 x 1080, Rubik, trois formats Meta par slide, dimensions et couleurs du prompt, aucun élément décoratif ajouté au deck, aucun tiret cadratin. Publication, stockage, saisie et révision attendent la validation visuelle.

## 1. Modèle et règles

- [x] Créer `lib/campaign-decks/types.ts`, `config.ts`, `slides.ts`, `fixtures.ts`.
- [x] Tester dans `lib/campaign-decks/decks.test.ts` : 13 slides pour trois thématiques complètes, ordre stable, canaux vides omis, formats absents conservés comme emplacements, dimensions exactes display prioritaires, ratios ±1 %, dimensions invalides.
- [x] Ajouter les tests au périmètre Vitest existant.
- [x] Exécuter les tests rouges, implémenter `classifyFormat(width, height)` et `buildSlides(campaign)`, vérifier le vert.

## 2. Présentation

- [x] Créer `app/decks/apercu/page.tsx`, `layout.tsx`, `_components/DeckPreview.tsx`, `_components/DeckSlide.tsx`, `_components/AdMockup.tsx`, `deck.module.css`.
- [x] Ajouter `public/deck-demo/` : logos provisoires, images de test, cinq GIF réellement animés. Réutiliser les mêmes fichiers sans conversion dans le rendu.
- [x] Dessiner couverture, intercalaires, Facebook, Instagram et bannières à leurs dimensions exactes. Gérer les champs manquants individuellement par squelettes.
- [x] Fournir sélection CMSA/CU, Visuels/Textes, exemple complet/incomplet, flèches, points, plein écran, impression et slides empilées sous 900 px.
- [x] Ajouter uniquement la route de démonstration publique exacte à `proxy.ts`.

## 3. Recette et livraison

- [x] Vérifier dans le navigateur : deux marques, deux versions, clavier, placeholders, GIF, absence de débordement sur ordinateur et téléphone.
- [x] Vérifier un PDF réel : 13 pages 16:9, toutes les slides, sans chrome d'application.
- [x] Exécuter tests, lint, TypeScript et build.
- [x] Documenter démarrage, limites, assets provisoires et suite Vercel/Blob/Neon dans `README.md`.
- [x] Ouvrir l'aperçu et demander la validation visuelle exigée par le prompt.

## Points de vigilance

- Le dépôt contient du travail non commité : conserver ces modifications, ne pas faire de commit global.
- Les maquettes existantes ne suivent pas les dimensions du deck : composants dédiés pour éviter les régressions.
- Les textes longs doivent rester dans les cartes sans couper le CTA.
- Les dimensions standard des bannières restent à 1:1. Les ajouts doivent être répartis sur plusieurs slides si nécessaire, jamais réduits silencieusement.
- Un PDF est statique : les GIF restent animés dans le navigateur, une image fixe apparaît à l'impression.
- Fable et Sonnet non disponibles dans ce harnais : exécution locale avec le modèle courant, annoncé dans le chat.

## Résultat de la recette

- 28 tests du nouveau module passent ; suite complète : 41 réussis, 1 ignoré car classeur personnel absent.
- Lint et TypeScript passent. Build de production vérifié avec accès Google Fonts.
- PDF réel : 13 pages, 960 × 540 points, une slide par page, aucune commande.
- GIF : différence de pixels entre captures successives vérifiée dans le navigateur.
- Revue indépendante : noms accessibles et navigation mobile désynchronisée corrigés, reproduction avant/après confirmée en E2E.
- Ajustements visuels : troncature des textes séparée du padding ; toolbar mobile empêchée de se comprimer.
- Livrable local ouvert. Validation visuelle utilisateur encore attendue ; aucune phase fonctionnelle suivante engagée, aucun déploiement.

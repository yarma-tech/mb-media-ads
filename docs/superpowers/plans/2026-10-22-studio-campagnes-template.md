# Studio campagnes : plan d'implémentation du template

Demande source : transformer le deck en site SaaS épuré, style Linear, pour présentation à la directrice. Trois pages : validation, campagnes on air avec mockups contextuels dont YouTube, statistiques récapitulatives. Cette demande remplace la présentation principale sous forme de deck.

## Périmètre

Template fonctionnel avec données fictives et sauvegarde locale des décisions. Aucun compte publicitaire connecté, aucune diffusion réelle. Le deck précédent reste accessible comme présentation secondaire.

## Modules et fichiers

1. `lib/campaign-studio/{types,fixtures,model}.ts` : modèle fermé de statuts, campagnes de démonstration, transitions, filtres et statistiques cohérentes. `model.test.ts` : blocage On air avant validation, transitions, conservation des commentaires, métriques et périmètre des filtres.
2. `app/studio/layout.tsx`, `page.tsx`, `validation/page.tsx`, `on-air/page.tsx`, `statistiques/page.tsx` : trois vraies routes et shell persistant Next.js.
3. `app/studio/_components/StudioProvider.tsx` : état partagé, sauvegarde locale versionnée, filtre marque et recherche.
4. `StudioShell.tsx`, `Icon.tsx`, `StatusBadge.tsx`, `CampaignMockup.tsx` : sidebar, navigation, composants sobres, mockups Facebook/Instagram/display réutilisés et maquette YouTube.
5. `ValidationPage.tsx` : liste des campagnes, inspection de chaque visuel, approbation/commentaire, mise On air après approbation complète.
6. `OnAirPage.tsx` : campagnes en diffusion, sélection du placement, retour en validation possible.
7. `StatsPage.tsx` : filtre période/canal, indicateurs et courbe SVG issus des mêmes données, tableau des campagnes, export CSV fonctionnel.
8. `app/studio/studio.module.css` : thème produit clair, neutres froids, accent indigo réservé aux actions, responsive. Ne pas modifier le thème de l'application existante.
9. `app/decks/apercu/page.tsx` redirige vers le studio ; `app/decks/presentation/page.tsx` conserve le deck. Whitelist exacte des routes de démonstration dans `proxy.ts`, configuration Vitest étendue, README actualisé.

## Vérification

- Tests de transitions et d'agrégation avant implémentation.
- E2E : approuver le dernier visuel, basculer On air, retrouver la campagne et ses mockups, recharger, revenir en validation, conserver le commentaire.
- Filtres recherche/marque/période/canal et export CSV réellement opérationnels.
- Revue visuelle des trois pages à 1440 px et 390 px ; clavier, labels accessibles, absence de débordement et console propre.
- Suite de tests, lint, TypeScript, build.

## Choix

- Le statut d'une campagne est dérivé de ses visuels : À valider, À modifier, Approuvée, On air. Tous les visuels doivent être approuvés avant la mise On air ; un visuel On air ne peut pas être modifié sans revenir en validation.
- Les chiffres de démonstration sont explicitement identifiés. Une campagne mise On air pendant la démo démarre à zéro, sans faux historique.
- Pas de publication ni de connexion aux API de régies dans ce template.
- Fable/Sonnet indisponibles dans ce harnais, comme à l'étape précédente. Modèle courant utilisé.

## Simplification après retour utilisateur

Référence publique : dashboard Plausible montré par Mobbin. Objectif : moins d’informations simultanées, détails accessibles au clic. Fichiers concernés : `StudioShell.tsx`, `ValidationPage.tsx`, `OnAirPage.tsx`, `StatsPage.tsx`, `studio.module.css`. Transitions et stockage conservés. Suppression des répétitions, informations secondaires dans des éléments `details`, trois KPI principaux et une courbe, métriques retirées des cartes On air. Nettoyage des règles CSS orphelines. Vérifier parcours, accordéons, mobile, filtres et export avant actualisation de l’aperçu compilé.

## Vue vignettes et révision multicanal

Retour utilisateur : commencer par les vignettes, ouvrir le détail au clic, comparer les canaux ensemble, replier la navigation et supprimer les séparateurs fins. `ValidationPage.tsx` : vue fermée galerie/détail, cartes de campagne, révision indépendante de chaque visuel, retour clavier à la vignette. `StudioShell.tsx` : navigation compacte par défaut, dépliage, filtre marque accessible et tiroir mobile conservé. `studio.module.css` : grille adaptative, cadres par fonds et espacement, séparation visuelle sans bordures structurelles. Modèle de validation et données inchangés. Vérifier les décisions par canal, publication, clavier, filtres et trois pages aux largeurs mobile/bureau.

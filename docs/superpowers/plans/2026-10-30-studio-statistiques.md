# Intégration Statistiques

Objectif : porter fidèlement la maquette approuvée `output/maquettes-statistiques/index.html`, sans connexion aux régies ni mutation des campagnes réelles.

Plan exécuté directement, sans sous-agents. Les modèles Fable/Sonnet demandés dans les instructions utilisateur ne sont pas disponibles dans ce harnais.

- [x] Ajouter un test navigateur du parcours connecté : KPI, période, recherche, détail, classement et absence de cumul dans Toutes les campagnes.
- [x] Centraliser le jeu synthétique et les calculs dans `lib/campaign-studio/statistics-demo.ts`. Ratio prospects/impressions, coût nul représenté par une absence de donnée si aucun prospect. Admission distincte de conversion CRM.
- [x] Remplacer `app/studio/_components/StatsPage.tsx` par le dashboard commun, ajouter son module CSS isolé. Conserver le shell et la navigation existants.
- [x] Raccorder `workspace/WorkspaceApp.tsx` au même composant à la place du message d’attente. Ne pas réutiliser les campagnes réelles pour leur attribuer des chiffres fictifs.
- [x] Vérifier calculs, interactions, fidélité desktop, absence de débordement mobile, lint, tests et build. Aucun déploiement inclus dans cette demande.

Décisions : dates figées au 30 octobre 2026 pour reproduire la maquette ; 3 campagnes fictives explicitement étiquetées ; classement limité à 5, tri admissions puis prospects ; vue toutes campagnes sans KPI global ; mêmes filtres de période dans tableau et classement. Pas de modification du benchmark.

Validation : 138 tests unitaires réussis, 1 ignoré ; parcours Statistiques connecté vérifié sur Chromium et WebKit avec API de recette ; build et lint réussis. Captures desktop/mobile comparées à la maquette. Aucune mutation de données réelles.

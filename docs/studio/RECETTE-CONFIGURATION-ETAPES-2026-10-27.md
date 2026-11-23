# Configuration en trois étapes

## Parcours livré

1. Marque et informations de campagne : nom, marque, URL commune, dates. Seul le nom reste obligatoire pour créer le brouillon.
2. Choix d'un ou plusieurs canaux.
3. Dépôt des médias et création des annonces en lot, puis saisie dans le tableau.

Le formulaire sauvegarde avant de continuer. Les étapes précédentes restent accessibles. Changer de campagne ne transmet plus l'étape de la campagne précédente.

## Implémentation

- `CampaignInfoForm.tsx` centralise les métadonnées auparavant dans le détail du tableau. Création de marque conservée, formulaires séparés.
- `Configuration.tsx` gère les étapes via un état fermé. Médias et tableau appartiennent à la troisième étape.
- `CreateCampaign.tsx` ouvre le formulaire prérempli. Les liens de changement de campagne effacent les paramètres d'étape et de sélection multicanal.
- Aucun changement de schéma, droits, authentification ou réinitialisation de données.

## Vérifications

- 88 tests unitaires réussis, 1 ignoré ; lint, types et compilation réussis.
- 47 scénarios UI locaux réussis, dont sauvegarde, erreur sans perte de saisie et changement de campagne.
- Contrôles ciblés d'accessibilité à 1440, 390 et 320 pixels. Mobile simulé, pas de test sur téléphone physique.
- Recette locale connectée : métadonnées sauvegardées, Facebook et Instagram, deux images importées, quatre annonces créées en lot, persistance après rechargement. Seuls les fichiers et la campagne de cette recette ont été supprimés.
- Preuves : `/tmp/studio-steps-20261027/final-e2e.log` et `final-connected-result.json`.

## Publication

Vercel confirme le statut `Ready` du déploiement `dpl_3vfxbRQ14fwMNZCcMqeVTxJXnUMU`, associé à https://mb-media-studio-dev.vercel.app.

Les tests fonctionnels connectés ont été exécutés localement. Aucune recette UI distante ni modification de données distantes pour cette livraison.

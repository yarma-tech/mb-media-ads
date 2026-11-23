# Recette locale V1

## Vérifications automatisées

`npm run test`, `npx tsc --noEmit`, `npm run lint`, `npm run build`.

La suite utilise des classeurs synthétiques en mémoire; le contrôle du fichier réel de Downloads est ignoré s'il n'existe pas. Aucun texte privé n'est copié dans le dépôt.

## Parcours et contrôles à exécuter avec Supabase local

1. Deux comptes A/B: A enregistre marque + logo, B ne peut ni lire ni modifier les réglages, plans, annonces ou objets de A.
2. Importer le classeur, examiner rapport + preview, confirmer. Vérifier rollback complet si une annonce RPC est invalide; payload vide ou sans ads refusé.
3. Déposer les images attendues. Vérifier compteur, rafraîchissement, cartes, nom multi-ratio, collision et association manuelle. Vérifier logo particulier par annonce.
4. Ouvrir lien dans navigateur anonyme à 360 px. Navigation plateforme, bureau/mobile, carrousel, zones sûres et play fixe. Aucun élément video.
5. Commenter, éditer, approuver, demander révision. Vérifier dates réelles, priorité révision, invalidation après édition, export reflétant modifications.
6. Refuser token invalide/expiré/inactif, annonce hors plan, patch injectant id/plan_id/plateforme/medias, chemin upload d'un autre propriétaire, URL non-http(s).
7. Erreur réseau pendant édition/commentaire: saisie conservée, erreur visible, contrôles réactivés.

Comparer les onze placements aux captures réelles avant d'annoncer fidélité pixel. Les icônes, ratios, troncature et interfaces restent sujets à revue visuelle indépendante.

Ne pas appliquer de migration production ni déployer Vercel pour cette recette.

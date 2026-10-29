# Partage public du Studio

Le Validateur humain crée et révoque les liens depuis la carte campagne. Les préparateurs et les agents ne disposent pas de ces commandes.

Un seul lien actif par campagne. Le jeton aléatoire de 256 bits est retourné une fois, puis seul son SHA-256 est conservé dans `studio_share_links`. Après navigation hors de la vue ou rechargement, le Validateur peut révoquer le lien existant ou créer un nouveau lien qui remplace le précédent. La suppression de campagne supprime aussi son partage par clé étrangère.

La page `/partage/[token]` est en lecture seule. Elle présente les versions courantes des annonces, par canal. Les commentaires, historiques, auteurs, verrous et chemins Storage ne font pas partie du DTO public. Les annonces en brouillon sont également incluses : cette vue sert à présenter toute la campagne, pas uniquement sa diffusion.

## Médias et révocation

Chaque requête `/api/studio/public/[token]` et `/api/studio/public/[token]/media/[mediaId]` vérifie le partage actif. Le serveur transmet le contenu média avec prise en charge Range/HEAD ; aucune URL Storage signée n'est transmise au navigateur. Les réponses ne sont pas mises en cache. Seuls les médias prêts associés à une annonce courante sont accessibles. Les contenus HTML et SVG ne sont pas servis par cette route.

La page ouverte revérifie l'accès toutes les 15 secondes et au retour au premier plan. Une révocation masque alors les annonces et démonte les lecteurs vidéo. Les requêtes suivantes sont refusées immédiatement. Comme pour tout lien public, les octets déjà téléchargés ne peuvent pas être rappelés.

## Mise en service

Appliquer uniquement la migration additive `supabase/migrations/20261029180000_campaign_share_links.sql` à la base Studio connectée avant déploiement. Ne pas rejouer les migrations V1. La table a RLS activé, aucun accès anon/authenticated, et des accès service_role seulement.

Contrôle après déploiement :

1. Connecté en Validateur, créer un lien et le copier.
2. Ouvrir ce lien sans session : texte, images et vidéo disponibles, aucune commande de modification.
3. Vérifier une vidéo avec une requête `Range: bytes=0-1023` : statut 206 et aucune redirection Storage.
4. Révoquer depuis le Studio, puis vérifier API publique et média : 404, no-store, aucun contenu privé.
5. Créer un nouveau lien : il fonctionne ; l'ancien reste refusé.

Tests locaux : `npm test`, `npx tsc --noEmit`, build production et `tests/studio/sharing.spec.ts`. Les E2E utilisent des fixtures, ils ne modifient aucune campagne connectée.

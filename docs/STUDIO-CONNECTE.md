# Studio connecté - recette locale

Le prototype public V1 reste disponible quand `STUDIO_CONNECTED` est absent. Le mode connecté utilise des comptes Supabase et un stockage privé. Aucune migration n’a été appliquée à la production.

## Démarrer

Prérequis : Docker Desktop, Supabase CLI, Node.js et dépendances npm installées.

```sh
supabase start --workdir dev/studio -x realtime,imgproxy,edge-runtime,logflare,vector,supavisor
set -a
source .env.studio.local
set +a
npm run dev -- --port 3002
```

- Application : http://127.0.0.1:3002/studio
- Supabase Studio : http://127.0.0.1:55423
- E-mails d’invitation locaux : http://127.0.0.1:55424
- API Supabase : http://127.0.0.1:55421
- Base locale : port 55422

`.env.studio.local` contient les clés du projet Docker local. `.env.studio-users.local` contient les deux comptes de recette et leurs mots de passe aléatoires. Ces fichiers sont ignorés par Git. Ne pas employer les clés de production pour cette recette.

`scripts/studio-dev-accounts.mjs` amorce les comptes Préparateur et Validateur. Il refuse les URL Supabase non locales. Le premier visiteur n’obtient aucun droit automatiquement.

## Parcours

1. Créer une campagne avec son nom ; compléter sa marque, son URL et ses dates.
2. Choisir un canal puis les formats, ou déposer directement les médias du canal.
3. Compléter les annonces dans le tableau ; aperçu de la ligne active. La sauvegarde est automatique. Le batch remplit les champs vides sauf remplacement explicite.
4. Envoyer une annonce ou une sélection. Seules les annonces complètes passent en validation ; les champs manquants sont indiqués.
5. Le Validateur approuve, demande une modification avec commentaire, ou corrige et valide dans la fenêtre de détail. Le tableau partage exactement les mêmes données.
6. Une annonce approuvée doit être déverrouillée avant modification dans le tableau. Une modification effective retire l’approbation.
7. Le passage On air est un suivi interne, sans publication vers les régies. Une annonce On air est figée. Créer une nouvelle version pour la modifier ; son passage On air arrête la version précédente.
8. La campagne se termine à 23 h 59, heure de Montréal. Une tâche Postgres passe chaque minute ; lectures et commandes vérifient aussi l’échéance. Le Validateur peut rouvrir avec une nouvelle date, sans remettre les annonces en ligne automatiquement.

Les membres voient toutes les campagnes. Seul le Validateur gère les invitations et les jetons agents. Un membre révoqué perd son accès serveur. Les statistiques régies ne sont pas connectées dans cette version ; aucun chiffre fictif n’est présenté comme réel.

## Médias et concurrence

Les fichiers finaux partent directement du navigateur vers Supabase Storage via TUS, par blocs de 6 Mo. Pause et reprise disponibles. Limite stricte : 200 000 000 octets. Le serveur vérifie le fichier stocké avec ffprobe, sans charger la vidéo complète en mémoire. Images/vidéos incompatibles restent marquées non conformes ; aucun recadrage ni génération automatique.

Le catalogue courant est dans `lib/campaign-studio/workspace/catalog.ts`. Les formats Display exigent les dimensions exactes et 150 Ko maximum. Les annonces Search exigent au moins trois titres et deux descriptions. Les aperçus illustrent l’annonce ; Google peut réellement combiner les éléments autrement.

Chaque annonce possède un verrou temporaire et chaque campagne une révision. Une écriture périmée est refusée. Les champs modifiés seuls sont envoyés ; une saisie non sauvegardée est conservée localement dans le tableau. Le bail est renouvelé tant que l’éditeur reste ouvert. Après suspension du navigateur mobile, il est repris automatiquement avant la sauvegarde si aucune autre personne ne l’a acquis. Un conflit réel conserve la saisie et demande une reprise explicite. La validation conserve les corrections dans sa fenêtre jusqu’à sa fermeture.

L’association automatique ne se fait qu’avec une seule ligne et un seul média compatibles, sans éditeur ouvert sur la ligne. Sinon, choisir le média dans le tableau.

## API et MCP

Toutes les routes exigent `Authorization: Bearer <session Supabase ou jeton agent>`. Les clés service restent exclusivement côté serveur.

- `GET /api/studio` : acteur, campagnes, marques, catalogue, verrous et aperçus temporaires.
- `POST /api/studio/commands` : commandes typées par `lib/campaign-studio/workspace/commands.ts`.
- `POST /api/studio/mcp` : JSON-RPC 2.0, protocole MCP `2025-03-26`, transport HTTP sans session. Méthodes : `initialize`, `notifications/initialized`, `ping`, `tools/list`, `tools/call`.
- Outils MCP : `studio_read` et `studio_prepare`, avec schéma JSON des commandes. Un agent ne peut ni approuver, ni dévalider, ni passer On air, ni gérer les accès. Les mêmes contrôles s’appliquent à l’API directe.

Exemple de commande après lecture de la campagne :

```json
{"type":"submit","campaignId":"<uuid>","revision":4,"adIds":["<uuid>"]}
```

Pour éditer : acquérir `lock` avec un token UUID, utiliser ce `lockToken` dans `edit`, puis `release`. Les mutations de campagne incluent sa dernière `revision`. Un HTTP 409 exige une relecture avant nouvel essai ; ne pas rejouer aveuglément une création après une réponse réseau incertaine. Les réponses de batch distinguent annonces soumises et ignorées.

Les invitations locales arrivent dans la boîte de test. Un environnement distant de recette est également déployé, décrit ci-dessous. Aucun fournisseur SMTP dédié n’a été configuré ; les restrictions du service e-mail Supabase par défaut restent applicables.

## Vérifier

Avec le serveur compilé sur 3002 et les variables locales chargées :

```sh
npm run lint
npm test
npx playwright test --config playwright.studio.config.ts
```

La configuration Playwright locale utilise Google Chrome installé dans `/Applications`. Les tests créent des campagnes de recette dans la base locale. Ne pas lancer cette suite contre une base de production.

Les migrations additives sont isolées dans `dev/studio/supabase/migrations`. La V1 et les anciens modules Social Ads conservent leurs modèles existants.

## Préparation de la recette distante

Tous les travaux Social Ads sont intégrés au même code : import de classeurs, choix de formats, aperçu des placements, textes, bibliothèque, partage et export. Le Studio et Social Ads partagent désormais la session Supabase par cookies. Le lien « Social Ads » dans la navigation ouvre l’autre espace sans seconde connexion.

Les migrations historiques ont été vérifiées sur la base locale isolée. Pour un projet de développement distant neuf, appliquer toutes les migrations historiques et Studio dans leur ordre chronologique, y compris le correctif de privilèges API. Ne jamais réappliquer les migrations initiales sur la base de production existante.

La publication distante exige les variables du projet Supabase distant, `STUDIO_CONNECTED=true` et un `STUDIO_URL` correspondant au domaine publié. Les identifiants et clés de la base locale ne sont pas utilisables depuis Vercel.

Le plafond de fichier global du projet doit autoriser 200 Mo. Le plan gratuit Supabase limite les fichiers à 50 Mo ; 200 Mo nécessite un projet sur une organisation Pro ou supérieure : https://supabase.com/docs/guides/storage/uploads/file-limits.

### Environnement distant de recette

- Application : https://mb-media-studio-dev.vercel.app/studio
- Projet Supabase isolé : `eybpsijzytdqiqifmohj`, région Canada Central.
- Limite gratuite temporaire acceptée : 50 Mo par fichier, contrôlée avant transfert, par l’API et par le bucket. `NEXT_PUBLIC_STUDIO_UPLOAD_LIMIT_MB=50` configure cette recette ; le défaut local reste 200 Mo.
- Migrations historiques et Studio appliquées ; tâche Postgres active chaque minute.
- Deux comptes de test identiques aux comptes locaux, sans secret commité.
- Les tests API/UI peuvent cibler cet environnement via `STUDIO_TEST_BASE_URL` et ses clés publiques de test. Ne jamais cibler la base historique de production.

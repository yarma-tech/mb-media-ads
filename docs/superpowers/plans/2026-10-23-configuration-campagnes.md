# Configuration des campagnes - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le studio V1 en outil interne partagé de préparation et validation des annonces, selon PRD-002.

**Architecture:** Les transitions, la complétude, le catalogue et les permissions vivent dans des modules métier communs. L’interface, l’API et le MCP passent par les mêmes commandes serveur. Les données et verrous sont persistés en base ; les médias sont transférés directement vers un stockage objet privé.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase Auth/Postgres/Storage existant, Vitest, Playwright ; adaptation MCP HTTP authentifiée.

**Spec:** docs/prd/PRD-002-configuration-campagnes.md

## Global Constraints

- Préserver le design V1 livré ; pas de retour à l’atelier éditorial.
- Création d’une campagne avec son nom uniquement.
- Vidéos finales de 200 Mo maximum, sans traitement créatif automatique.
- Deux rôles humains : Préparateur et Validateur. Visibilité de toutes les campagnes.
- Agents limités à la préparation et à la soumission, jamais à l’approbation ou au passage On air.
- Fin automatique à 23 h 59, America/Toronto ; aucun appel de publication aux régies.
- Aucune migration ou ressource métier des anciens modules Social Ads ne doit être remplacée.
- Pas de secret commité, pas d’import Excel, pas de génération IA.
- Les états métier sont des enums fermés, les autorisations sont vérifiées côté serveur.

## Review Focus

- Une écriture périmée après expiration d’un verrou ne doit pas écraser une correction.
- Un agent ne doit pas obtenir les droits humains en forgeant son rôle ou l’origine d’une commande.
- Une campagne finissant au changement d’heure doit être arrêtée selon l’heure de Montréal.
- Un fichier corrompu, nommé trompeusement ou incompatible doit rester non conforme.
- Une modification de marque ou de texte partagé ne doit pas altérer une version On air figée.

## Task 1: Domaine partagé, catalogue et transitions

**Files:** créer `lib/campaign-studio/workflow.ts`, `catalog.ts`, `workflow.test.ts`, `catalog.test.ts` ; modifier `types.ts`, `model.ts` et les fixtures avec adaptation de compatibilité V1.

**Interfaces:** acteur vérifié (humain/agent, rôle), commande typée, annonce versionnée, résultat typé et révision attendue. La complétude est calculée, jamais un booléen indépendant d’un statut. Les campagnes ont un cycle propre à la préparation, activité et fin ; une campagne mixte peut contenir des annonces On air et des brouillons.

- [ ] Écrire et observer échouer les tests des transitions, du batch partiel, des corrections auto-approuvées, des refus, de l’immuabilité On air et des droits agents.
- [ ] Implémenter le domaine : brouillon, à valider, approuvée, modification demandée, On air, arrêtée ; version explicite et journal avec valeurs avant/après.
- [ ] Vérifier les contraintes courantes des canaux dans leur documentation officielle ; catalogue fermé par canal avec limites textuelles et médias.
- [ ] Tester la compatibilité par dimensions/type, la sélection de placements multiples et l’ambiguïté du matching.
- [ ] Vérifier la fin à 23 h 59 de Montréal en hiver, été et changement d’heure ; réouverture par Validateur sans remise On air implicite.

## Task 2: Persistance et droits serveur

**Files:** créer une nouvelle migration `supabase/migrations/20261023120000_campaign_studio.sql`, `lib/campaign-studio/server.ts`, `server.test.ts` et contrats de validation d’entrée.

**Interfaces:** repository transactionnel, commandes avec révision attendue, verrou par annonce et bail expirant, journal immuable. Supabase Auth est réutilisé, rôle studio stocké séparément des permissions historiques.

- [ ] Créer tables séparées : membres, marques minimales, campagnes, annonces/version, médias, événements, verrous et identités agents.
- [ ] Interdire les écritures directes permettant de contourner les commandes ; lecture réservée aux membres, pas aux visiteurs du prototype public.
- [ ] Tester en transaction : acquisitions concurrentes, expiration/renouvellement, refus des écritures périmées et remplacement atomique de la version On air.
- [ ] Créer les commandes d’invitation du Validateur ; aucun rôle administrateur supplémentaire.
- [ ] Prévoir une amorce explicite du premier Validateur, sans élévation automatique du premier visiteur.
- [ ] Installer la persistance uniquement après identification et vérification du projet cible ; conserver le prototype V1 public séparé du mode connecté.

## Task 3: API puis MCP

**Files:** créer `app/api/studio/**`, `lib/campaign-studio/api.ts`, `app/api/studio/mcp/route.ts`, tests de contrats et documentation API.

**Interfaces:** CRUD contrôlé campagnes/marques, lecture catalogue, commandes d’annonce, verrous, signatures médias, soumission batch et historique. Les identités viennent de la session ou d’un jeton agent serveur, jamais du corps de la requête.

- [ ] Tester 401/403, rôle forgé, appels directs d’un agent à approbation/On air et erreurs de révision.
- [ ] Exposer les commandes métier via endpoints documentés, erreurs stables et requêtes idempotentes pour création/soumission.
- [ ] Ajouter MCP reposant sur ces services : initialize, tools/list et tools/call selon la version de protocole retenue et documentée ; authentification obligatoire.
- [ ] Couvrir les erreurs par élément d’un batch, les annonces ignorées et leurs champs manquants.
- [ ] Ajouter la tâche de fin automatique authentifiée et idempotente, exécutée au moins chaque minute ; vérifier aussi l’échéance dans les commandes pour éviter des transitions périmées.

## Task 4: Médias

**Files:** créer `lib/campaign-studio/media.ts`, composants bibliothèque/dépôt dans `app/studio/_components/configuration/`, endpoint de signature et vérification de fin de transfert.

**Interfaces:** upload direct privé et signé, état de transfert fermé, métadonnées vérifiées, URL de prévisualisation temporaire et référence média stable.

- [ ] Déposer par canal ou sur une ligne ; lire dimensions et durée, proposer les placements compatibles et conserver les fichiers non conformes avec explication.
- [ ] Refuser les vidéos au-delà de 200 Mo avant transfert et côté stockage ; ne jamais envoyer leur corps à un Route Handler Next.js.
- [ ] Reprendre les transferts interrompus ; ne lier un média qu’après vérification de son existence et de son intégrité/métadonnées côté serveur.
- [ ] Dédupliquer par référence ou empreinte ; ne pas associer automatiquement si plusieurs lignes/médias sont compatibles.
- [ ] Tester l’absence de média, les fichiers corrompus, les noms identiques et les liens temporaires expirés.

## Task 5: Configuration et Home

**Files:** créer `app/studio/configuration/**`, `ConfigurationPage.tsx`, composants tableau/champs/batch/aperçu ; modifier `StudioProvider.tsx`, `StudioShell.tsx` ; créer Home et gestion minimale des marques/utilisateurs.

**Interfaces:** état serveur commun, mutations avec verrou et révision, autosauvegarde sérialisée et reprise d’erreur sans perte du texte saisi.

- [ ] Créer une campagne avec son seul nom ; compléter marque, URL et dates ensuite.
- [ ] Afficher tableau par canal, formats choisis visuellement, lignes multiples, duplication et aperçu de la ligne active.
- [ ] Assurer les deux parcours médias/textes, choix des placements compatibles et association sans ambiguïté.
- [ ] Ajouter sélection des lignes et batch avec champs vides par défaut ; remplacement explicite avec nombre de lignes.
- [ ] Autosauvegarder, afficher Enregistrement/Enregistré/Erreur, conserver les saisies en erreur et prévenir à la sortie avec écritures non sauvegardées.
- [ ] Déverrouiller explicitement une annonce approuvée ; annuler son approbation uniquement après modification effective enregistrée.
- [ ] Soumettre individuellement ou par sélection, ignorer les brouillons et afficher les raisons.
- [ ] Home du Validateur : compteur et lien vers les annonces en attente. Home du Préparateur : ses brouillons et demandes de modification.
- [ ] Vérifier clavier, mobile, focus et contraste selon la V1.

## Task 6: Validation, SEM, On air et Terminées

**Files:** modifier `ValidationPage.tsx`, `CreativeEditor.tsx`, `CampaignMockup.tsx`, `OnAirPage.tsx`, `StatsPage.tsx`, `StatusBadge.tsx` ; créer aperçu SEM et page Terminées/historique.

- [ ] Afficher uniquement les annonces soumises dans À valider et retirer celles demandant une modification.
- [ ] Synchroniser tableau/pop-up ; Enregistrer et valider réservé au Validateur humain dans la pop-up, jamais dans le tableau.
- [ ] Ajouter les canaux TikTok et SEM ; aperçu Search responsive avec navigation entre combinaisons et approbation de l’ensemble.
- [ ] Rendre On air immuable ; nouvelle version en brouillon, remplacement atomique de l’ancienne lors de la remise On air.
- [ ] Exposer versions et journal ; Terminées distingue remplacement, arrêt manuel et campagne terminée.
- [ ] Préserver les données métriques historiques indépendamment du statut actuel de la campagne ; ne pas inventer des statistiques réelles pour les nouvelles annonces.
- [ ] Vérifier le parcours E2E complet des deux profils et d’un agent, du brouillon à la V2 On air puis à la fin/réouverture.

## Task 7: Livraison vérifiée

- [ ] Exécuter tests métier, tests d’intégration de base, lint, TypeScript, build et E2E sur bureau/mobile.
- [ ] Vérifier les contrastes des nouveaux états, les médias sans image cassée et les erreurs de connexion.
- [ ] Revoir permissions, secrets, migration additive et compatibilité de la V1 publique.
- [ ] Fournir l’aperçu local et la recette ; ne pas déclarer les comptes partagés, transferts ou cron opérationnels avant tests contre le backend cible.
- [ ] Ne pousser ni déployer cette nouvelle version sans instruction de publication correspondante.

## État au démarrage

- PRD-002 rédigé avec toutes les décisions actées pendant le grill-me.
- Dépôt actuel sur branche `codex/annonces-en-situation-v1`, avec autres travaux Social Ads non commités à préserver.
- Le fichier `.env.local` ne contient actuellement qu’une identité Vercel ; aucune configuration Supabase locale n’a été trouvée. Les anciennes pages sont un prototype navigateur.
- Vérification du backend cible et des accès nécessaire avant intégration/migration ; aucun droit multi-utilisateur ne doit être simulé.

## Livraison locale vérifiée - 23 octobre 2026

Le backend retenu est Supabase Docker séparé (`mb-media-studio-dev`, ports 55421 à 55424). Aucun accès ni schéma de production modifié. Les comptes, données, stockage et tâche automatique sont réels dans cet environnement local. La mise à disposition distante reste une opération distincte.

### Modules effectivement utilisés

- Domaine et service : `lib/campaign-studio/workspace/{types,commands,catalog,workflow,server,verify-media}.ts`.
- Écrans connectés : `app/studio/_components/workspace/` et routes configuration, accès, terminées.
- API : `app/api/studio/`, commandes, MCP et expiration.
- Persistance additive : cinq migrations dans `dev/studio/supabase/migrations/`, campagnes conservées en documents JSONB avec CAS transactionnel ; anciennes tables intactes.
- Amorçage : `scripts/studio-dev-accounts.mjs` ; documentation d’exploitation : `docs/STUDIO-CONNECTE.md`.

### Preuves

- [x] TypeScript et lint sans erreur.
- [x] Vitest : 65 tests passés, 1 ignoré préexistant.
- [x] Builds V1 et connecté avec Next.js 16.4.3.
- [x] 8 tests navigateur/API : droits humains et agents, verrou concurrent, écriture périmée, batch partiel, correction, V2, fin/réouverture, dépôt image et vidéo, inactivité et reprise, MCP initialize/tools/list, V1 publique préservée, contrastes et débordement sur six pages desktop/mobile.
- [x] Relecture indépendante : deux défauts reproduits puis corrigés. Un média peut être vérifié sans modifier une ligne verrouillée ; une pause dans le modal de validation permet de reprendre sans perte de saisie.
- [x] Audit npm des dépendances de production : aucune vulnérabilité après mise à jour Next.js.
- [x] Tâche `studio-expire-campaigns` active chaque minute dans Postgres local.
- [x] Captures bureau/mobile examinées.

### Limites explicites de cette livraison

- Pas de projet Supabase cloud ni de SMTP distant configuré ; invitations visibles dans la boîte locale.
- Pas de statistiques régies, de publication réelle, d’Excel ni de génération IA.
- Les créations n’ont pas de clé d’idempotence applicative. Les mises à jour sont protégées par révision et verrous ; une création après réponse réseau incertaine exige relecture, pas rejeu aveugle.
- Vidéo réelle courte transférée et vérifiée ; limite 200 Mo testée au contrat API et imposée au stockage. Aucun essai de débit WAN à 200 Mo.
- Les transferts disposent de pause/reprise TUS ; une coupure réseau prolongée et un redémarrage complet du navigateur ne font pas partie de la recette automatisée.
- Aucune publication de cette V2 effectuée.

Les cases du plan initial non cochées sont conservées pour distinguer les ambitions de recette initiales des preuves réellement obtenues ci-dessus.

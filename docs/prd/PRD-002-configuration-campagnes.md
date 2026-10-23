# PRD-002 - Configuration des campagnes et validation des annonces

Statut : cadrage en cours, décisions actées pendant le grill-me du 23 octobre 2026.
Ce document décrit la cible décidée, pas des fonctions déjà implémentées. Aucune publication d’issue ni mise en production demandée à ce stade.

## Problem Statement

Préparer les annonces d’une campagne depuis des textes et des livrables médias, puis les faire approuver, exige un espace partagé. Le studio actuel est une démonstration avec données locales : il ne couvre pas encore la préparation structurée, les comptes et droits, les médias déposés, les versions et l’accès agent. La validation Google Ads SEM doit être ajoutée.

## Solution

Un espace de configuration par campagne, organisé en tableaux par canal. Chaque ligne est une annonce, chaque colonne un champ. La ligne active pilote un aperçu à côté du tableau. Deux entrées possibles : médias d’abord ou textes d’abord. Les annonces complètes sont soumises individuellement ou par sélection au Validateur humain. Configuration et validation éditent la même annonce. L’API et sa couche MCP permettent aux agents de préparer et soumettre, sans approuver ni marquer On air.

## Features à développer

1. Home adaptée aux deux profils, avec compteur des annonces à valider sur la Home du Validateur.
2. Création et configuration des campagnes par les deux rôles.
3. Sélection visuelle des canaux et formats courants.
4. Bibliothèque de médias par campagne, dépôt par canal et dépôt sur une ligne.
5. Reconnaissance des médias, conformité et association aux annonces.
6. Tableau de saisie par canal, aperçu synchronisé, édition individuelle et batch.
7. Soumission individuelle et groupée des annonces prêtes.
8. Annonces Google Ads SEM et reproduction fidèle de leur présentation dans Google Search.
9. Données partagées entre tableau et pop-up de validation.
10. Droits Préparateur / Validateur et gestion des invitations par le Validateur.
11. Protection des annonces approuvées, versions des annonces On air et journal des changements.
12. Espace Terminées pour versions arrêtées et campagnes terminées.
13. API métier puis enveloppe MCP, avec mêmes règles métier et restrictions sur les agents.

## User Stories

1. En tant que Préparateur ou Validateur, je peux créer une campagne et accéder à toutes les campagnes.
2. En tant que Validateur, je gère les invitations et les accès des utilisateurs.
3. En tant que Validateur, je vois sur ma Home le compteur des annonces à valider.
4. En tant qu’utilisateur, je sélectionne un canal puis ses formats via des vignettes.
5. En tant qu’utilisateur, je confirme mes formats avant de remplir les annonces.
6. En tant qu’utilisateur, je peux préparer plusieurs annonces du même format, en ajouter ou en dupliquer.
7. En tant qu’utilisateur, je dépose les médias d’une campagne dans le canal sélectionné pour proposer des annonces compatibles.
8. En tant qu’utilisateur, je peux commencer par les textes et associer les médias plus tard.
9. En tant qu’utilisateur, je peux déposer un média directement sur une ligne ou le choisir dans la bibliothèque de campagne.
10. En tant qu’utilisateur, je réutilise un média dans plusieurs annonces sans multiplier les dépôts.
11. En tant qu’utilisateur, je choisis les placements compatibles avant la création des lignes quand un média convient à plusieurs placements.
12. En tant qu’utilisateur, je suis informé lorsqu’un média ne correspond à aucun format accepté pour le canal.
13. En tant qu’utilisateur, je complète un tableau par canal, avec une annonce par ligne et les champs en colonnes.
14. En tant qu’utilisateur, je visualise l’annonce active pendant la saisie, avec un aperçu adapté à son format.
15. En tant qu’utilisateur, je peux appliquer un champ à toutes les annonces compatibles ou à une sélection.
16. En tant qu’utilisateur, le batch remplit par défaut uniquement les champs vides ; je choisis explicitement le remplacement des valeurs existantes.
17. En tant qu’utilisateur, je définis une URL commune à la campagne et peux la remplacer sur chaque annonce.
18. En tant qu’utilisateur, j’envoie une annonce prête en validation depuis sa ligne.
19. En tant qu’utilisateur, j’envoie les lignes sélectionnées en une fois ; seules les annonces prêtes partent, les autres restent à compléter.
20. En tant que Validateur, j’approuve une annonce complète, y compris pour Google SEM.
21. En tant que Validateur, je parcours plusieurs combinaisons de titres et descriptions SEM dans l’aperçu ; mon approbation porte sur tous les textes de l’annonce.
22. En tant que Validateur, je corrige dans la pop-up avec « Enregistrer et valider », ce qui applique les changements et approuve directement.
23. En tant qu’utilisateur, je retrouve immédiatement dans le tableau les changements enregistrés depuis la pop-up.
24. En tant qu’utilisateur, je dois déverrouiller volontairement une annonce approuvée avant de la modifier dans le tableau, après avertissement.
25. En tant que Validateur, je demande une modification avec commentaire : le statut change dans le tableau et l’annonce quitte À valider.
26. En tant que Préparateur, je corrige puis soumets à nouveau l’annonce demandant une modification.
27. En tant qu’utilisateur, je consulte une annonce On air figée et peux créer une V2 pour la faire évoluer.
28. En tant qu’utilisateur, je consulte les versions explicites et un journal des changements avec auteur, date et champs modifiés.
29. En tant que Validateur, je marque manuellement une version On air et la précédente passe en Arrêtée.
30. En tant qu’utilisateur, je consulte les versions arrêtées et les campagnes terminées dans Terminées, avec leur motif.
31. En tant qu’agent, je prépare, modifie et soumets via l’API ou le MCP, avec des droits de préparation uniquement.

## Implementation Decisions

### Décisions produit actées

- Configuration uniquement par campagne, sans bibliothèque commune entre campagnes.
- Création simple : seul le nom de campagne est obligatoire pour créer un brouillon. Marque et dates se complètent ensuite ; aucune étape de formulaire supplémentaire imposée à la création. La règle d’une marque unique s’applique une fois celle-ci associée. La fin automatique nécessite une date de fin renseignée.
- Une campagne appartient à une seule marque. Outil interne avec peu de marques : fiche minimale limitée au nom, au logo et au lien du site web. Les deux rôles peuvent créer une marque ; aucune gestion détaillée des identités sociales dans ce périmètre. Les droits de modification restent à préciser.
- Assemblage de livrables fournis, pas de génération IA de contenus.
- Pas d’import Excel en V1. Cette décision remplace les propositions initiales d’Excel strict et d’import partiel.
- Deux rôles seulement : Préparateur et Validateur. Les deux créent des campagnes et voient toutes les campagnes.
- Le Validateur gère les invitations et accès. Pas de troisième rôle administrateur.
- Home différente selon le profil ; compteur des annonces en attente sur la Home du Validateur. La Home du Préparateur présente ses annonces à compléter et les modifications demandées, avec accès direct aux campagnes.
- Canaux évoqués : Facebook, Instagram, TikTok, YouTube, Display et Google Ads SEM. Catalogue exact des formats courants à définir.
- Les formats sont choisis visuellement. Après confirmation, remplissage des lignes une à une par défaut, avec actions batch facultatives.
- Tableau par canal, pas par famille de formats. La ligne et son format déterminent l’aperçu et les champs applicables.
- Plusieurs annonces par format, ajout et duplication.
- Champs batch applicables à toutes les annonces compatibles ou à une sélection. Champs vides uniquement par défaut ; remplacement explicite avec nombre d’annonces concernées affiché.
- URL commune préremplie, ajustable par annonce.
- Google SEM : uniquement l’annonce textuelle, ses textes, URL et aperçu fidèle à Google Search ; navigation entre différentes combinaisons. Validation de l’annonce entière.

### Médias

- Images et vidéos finales prêtes à utiliser ; pas de montage, recadrage automatique ou fabrication des créations.
- Vidéos : maximum 200 Mo par fichier.
- Envoi direct vers un stockage de fichiers pour éviter de faire transiter les vidéos par le serveur applicatif. Fournisseur et protocole de reprise restent à choisir.
- Dépôt dans la bibliothèque de campagne après sélection du canal, ou dépôt sur une ligne. La même bibliothèque sert aux deux parcours.
- Médias d’abord : lire type, dimensions et métadonnées pour proposer les placements compatibles, puis créer les lignes retenues.
- Textes d’abord : préparer le tableau, puis associer les médias disponibles selon leur compatibilité.
- Association automatique uniquement sans ambiguïté. En cas de plusieurs candidats, l’utilisateur choisit parmi les médias compatibles.
- Si plusieurs placements conviennent, les proposer à cocher avant création des lignes.
- Média incompatible : état de non-conformité au canal et explication, sans transformation automatique.

### Statuts et validation

- Brouillon pour annonce incomplète ; prête à soumettre lorsque les exigences sont satisfaites. La façon de représenter la complétude dans le modèle reste à fixer.
- Soumission individuelle ou par sélection, y compris sélection de toutes les lignes.
- En batch, seules les annonces prêtes sont soumises. Les autres restent à compléter, avec erreurs visibles.
- Configuration et pop-up utilisent une même source de données ; synchronisation immédiate des modifications enregistrées.
- Édition concurrente : verrou temporaire par annonce. Les autres utilisateurs peuvent consulter et voient « En cours de modification par… ». Libération à la sortie ou après inactivité. Les écritures API/MCP doivent respecter la même exclusion ; durée et reprise technique restent à définir.
- Saisie du tableau sauvegardée automatiquement, avec indicateur « Enregistrement… / Enregistré ». Les actions de workflow restent explicites : soumettre, déverrouiller, enregistrer et valider, passer On air. La stratégie de reprise en cas d’erreur reste à préciser.
- Modification depuis la pop-up de validation par le N+1 : « Enregistrer et valider » corrige et approuve directement, sans retour en préparation.
- Modification depuis le tableau : aucune auto-approbation, même si l’auteur est Validateur.
- Annonce approuvée verrouillée dans le tableau. Déverrouillage volontaire et avertissement avant édition. Une modification effective annule l’approbation et renvoie en À valider ; une annonce devenue incomplète reste à compléter avant soumission.
- Modification demandée : commentaire et statut dans la configuration, retrait de À valider, puis nouvelle soumission après correction.
- On air est un suivi manuel, sans publication effective sur les plateformes publicitaires.
- À la date de fin prévue, la campagne passe automatiquement dans Terminées ; ses annonces On air passent en Arrêtée avec le motif « Campagne terminée ». Cette transition concerne le suivi interne et n’effectue aucune action sur les régies. Fin prévue à 23 h 59 le jour choisi, heure de Montréal (America/Toronto, avec prise en compte de l’heure d’été). Le fuseau est affiché près des dates.
- Annonce On air immuable. Pour modifier, création d’une nouvelle version en brouillon.
- Une seule version On air par annonce. Au passage de V2 On air, V1 devient Arrêtée, et reste consultable.
- Historique à deux niveaux : versions explicites V1/V2 et journal des changements, auteur, date, champs modifiés.
- Terminées regroupe versions arrêtées et campagnes terminées, avec distinction du motif : remplacement, arrêt manuel ou campagne terminée.
- Une campagne terminée peut être rouverte uniquement par le Validateur, après définition d’une nouvelle date de fin. Ses annonces restent arrêtées jusqu’à leur remise On air explicite. L’historique est conservé.

### API, MCP et modules envisagés

- API métier en premier, puis enveloppe MCP reposant sur les mêmes opérations et règles.
- Agents limités à la préparation et soumission. Approbation et passage On air réservés à un humain habilité, contrôlés côté serveur.
- Modules envisagés : campagnes et annonces, catalogue de formats/conformité, médias, workflow et droits, versions/historique, aperçu par canal, API/MCP.
- Le studio existant dispose de fixtures, transitions et stockage navigateur. Persistance partagée, comptes, droits, stockage médias et journal côté serveur restent à implémenter.
- Les modules et contrats techniques détaillés n’ont pas encore été arbitrés avec l’utilisateur.

## Testing Decisions

Aucune sélection de modules de test encore validée pendant l’entretien. Proposition à confirmer : tester les comportements externes des transitions et autorisations, de la conformité des médias, du matching ambigu, de l’édition batch et du remplacement de version On air. Couvrir en E2E les deux parcours médias/textes, les deux rôles, la synchronisation tableau/pop-up et la Home par profil. Le dépôt contient déjà des tests de transitions et de restauration du studio qui peuvent servir de point de départ.

## Out of Scope

- Import Excel en V1.
- Création IA des textes, images ou vidéos.
- Montage ou recadrage automatique des médias.
- Publication réelle ou achat média via les régies.
- Gestion des mots-clés, enchères et ciblages Google Ads.
- Approbation ou passage On air par un agent.
- Modification directe d’une version On air.
- Diffusion simultanée de deux versions d’une même annonce.
- Rôle administrateur distinct et restrictions de visibilité par campagne.

## Further Notes

### Points restant à trancher

- Interactions détaillées du compteur du Validateur et des raccourcis de Home.
- Notifications autres que le compteur de Home : pas encore actées.
- Catalogue initial des formats, champs requis et contraintes vérifiées par canal ; règles Google à vérifier dans la documentation officielle au moment de la conception détaillée.
- Droits de modification d’une marque existante. La création de marque par les deux rôles et ses trois champs (nom, logo, site web) sont actés.
- Authentification humaine et agent, stockage, persistance partagée ; durée et reprise des verrous d’édition.
- Gestion des erreurs de sauvegarde automatique et reprise des transferts.
- Informations requises et droits pour prolonger une campagne encore active à préciser.
- Conservation, suppression et export des médias et historiques.
- Périmètre exact des endpoints et outils MCP.

Le design V1 livré reste la base. La piste atelier éditorial a été abandonnée pour cette livraison et n’est pas réintroduite par ce cadrage.

## État de réalisation - 23 octobre 2026

Version connectée disponible en recette locale, isolée de la V1 publique. Les points techniques du cadrage sont désormais précisés dans `docs/STUDIO-CONNECTE.md` : Supabase Auth/Postgres/Storage local séparé, TUS direct, vérification serveur avec ffprobe, verrou temporaire libéré après inactivité, reprise explicite et sauvegarde des champs modifiés. Les marques sont créées par les deux profils ; leur modification ultérieure n’est pas exposée.

Les comptes, tableaux, validations, versions, historique, invitations locales, API et outils MCP partagent la même base et les mêmes autorisations. Les détails de validation et les limites de recette sont consignés dans `docs/superpowers/plans/2026-10-23-configuration-campagnes.md`. L’environnement distant, le SMTP distant et une publication de cette version ne sont pas compris dans cette livraison locale.

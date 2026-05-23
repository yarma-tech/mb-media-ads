# MB Média Ads

Plateforme d'**agence média multi-média** opérée par **MB Média**. Des partenaires **authentifiés** y achètent de l'espace publicitaire / du mécénat sur des **médias** (Karata est l'un d'eux, parmi d'autres). Modèle économique : **commission de 10 à 15 %** (défaut 12,5 %) incluse dans le montant investi (= revenu de MB Média). Après création de compte (email + profil entreprise), le partenaire choisit un **mode de campagne** : **manuel** (il configure un placement → on prédit le **tarif**) ou **auto** (il donne objectif + budget + période → l'optimiseur compose la **campagne idéale**) ; chaque valeur prédite porte un **niveau de confiance**. Deux sorties : **payer en ligne** (Stripe, self-service) **ou** **parler à un expert** (pipeline admin : demande → convention → paiement).

## Language

**MB Média**:
L'agence média qui opère la plateforme. « Nous », c'est MB Média (pas un média en particulier). _Avoid_: Karata (qui n'est qu'un des médias).

**Partenaire**:
L'entité (entreprise, association, particulier) qui achète de l'espace / soutient des programmes via la plateforme. _Avoid_: Client, Annonceur, Entreprise.

**Compte partenaire / Profil**:
Le compte (Supabase Auth) qu'un partenaire crée pour accéder à l'outil — l'auth est **obligatoire dès l'entrée**. Le **profil** porte les infos entreprise (email, nom entreprise, secteur, type de structure), saisies à l'inscription et réutilisées partout (plus de ressaisie dans le formulaire). _Avoid_: utilisateur (ambigu avec l'admin MB Média).

**Commission**:
La part prélevée par MB Média sur le montant investi par le partenaire (10–15 %). Revenu de la plateforme et levier d'« équilibre » nous/partenaire.

**Média**:
Une marque de contenu du catalogue (Karata, et d'autres). Possède ses propres programmes. _Avoid_: chaîne, éditeur.

**Programme**:
Un contenu/émission récurrent d'un média (ex. Karata : INSIDE MAS, LIVE, KARATA TOUR, MOUN A MAS, FWET A MAS, MIZIK A, VIDEO PARTENAIRE). _Avoid_: émission, slot.

**Plateforme de diffusion**:
Le canal où un programme est diffusé (YouTube, Facebook, TikTok, Instagram, Spotify…). Distinct du **Média** (la marque) et du **Programme** (l'émission). _Avoid_: réseau, canal.

**Cible**:
Le segment d'audience visé (Kids, Professionnel, Artisan, Parent, Gamers, Sport Lover). _Avoid_: persona, audience (ambigu).

**Placement**:
Une insertion unitaire = (média, programme, plateforme de diffusion, type de pub, cible, date) à un prix.

**Campagne**:
Un ensemble de placements sur une **période** (date début → date fin), avec un **budget** et des objectifs d'audience/conversion. _Avoid_: deal, commande.

**Campagne recommandée**:
La campagne que la plateforme propose comme « idéale » au regard des contraintes saisies (budget ou objectif, selon le mode).

**Mode de campagne (Step 0)**:
Le choix d'entrée du partenaire. **Manuel** (« Définir ma campagne ») : il configure une combinaison unique (média × programme × plateforme × type de pub × cible) → on prédit le **tarif**. **Auto** (« Campagne auto ») : il donne objectif + budget + période → l'optimiseur compose la **campagne recommandée**. _Avoid_: confondre avec le mode de résolution (budget/goal), interne au mode auto.

**Mode de résolution (auto)**:
Au sein du mode **auto** : **budget-driven** (budget + période → maximise l'audience/conversion) ou **goal-driven** (objectif + période → minimise le budget). En self-service v1, le **budget est requis** ; le goal-driven devient une option avancée. Même moteur prédictif.

**Tarif**:
Sortie du **mode manuel** : le prix d'une configuration unique (prix unitaire × nombre de diffusions, commission incluse) + le résultat attendu pour l'objectif, chacun avec un niveau de confiance. _Avoid_: devis (pas de négociation).

**Niveau de confiance**:
Estimation d'incertitude affichée pour chaque valeur prédite (audience, conversion, prix).

**Type de pub**:
Format du soutien/insertion. 6 valeurs : Don, Mécénat, Citation orale, Placement produit, Logo fin, Logo début/fin. Don ≠ Mécénat.

**Type d'entreprise**:
Nature du partenaire. 4 valeurs : Privé, Public, Association, Particulier.

**Demande**:
Un enregistrement créé à la sortie du parcours, rattaché au **compte partenaire** (`user_id`) et porteur d'un **canal**. Côté **expert** : Soumise → Acceptée / Refusée → Convention envoyée → Payée. Côté **self-service** : la demande naît à l'initiation du paiement et passe directement à **Payée** quand Stripe confirme (webhook). _Avoid_: requête, lead.

**Canal**:
Origine d'une demande. **self_service** : payée en ligne par le partenaire (Stripe Checkout). **expert** : transmise au pipeline admin pour traitement humain. La demande porte aussi le **type de campagne** (manuel / auto).

**Convention**:
L'accord de partenariat envoyé au partenaire après acceptation, avec un lien de paiement.

## Relationships

- **MB Média** opère la plateforme et prélève une **Commission** (10–15 %) sur le montant investi
- Un **Média** possède plusieurs **Programmes** ; un **Programme** est diffusé sur une ou plusieurs **Plateformes de diffusion**
- Un **Partenaire** lance une ou plusieurs **Campagnes**
- Une **Campagne** = des **Placements** sur une **période**, sous contrainte de **budget**, visant des objectifs d'**audience**/**conversion**, pour une ou plusieurs **Cibles**
- Un **Placement** = (média, programme, plateforme, type de pub, cible) à un **prix**
- La plateforme produit une **Campagne recommandée** : allocation de budget qui optimise l'objectif du **mode** choisi

## Example dialogue

> **Partenaire (budget-driven) :** « J'ai 5 000 € sur mars. »
> **Plateforme :** « Campagne idéale : INSIDE MAS sur TikTok (Gamers) + LIVE sur YouTube… audience 340 K (confiance 78 %), conversions 520. Commission MB Média : 600 € (12 %). »
> **Partenaire (goal-driven) :** « Il me faut 300 K vues sur mars. »
> **Plateforme :** « Budget estimé : 4 200 € (confiance 70 %), commission incluse, via cette composition… »

## Flagged ambiguities

- **Acheteur** → RÉSOLU : terme canonique **Partenaire**.
- **Opérateur / business model** → RÉSOLU : **MB Média** (agence), revenu = commission 10–15 % sur le montant investi. Karata = un média parmi d'autres.
- **Type_Entreprise** → RÉSOLU : {Privé, Public, Association, Particulier}.
- **Type_Pub** → RÉSOLU (valeurs) : 6 formats ; Don ≠ Mécénat (nuance à préciser).
- **Contrat I/O** → MIS À JOUR (2026-05-23) : le profil entreprise vient du **compte** (plus saisi dans le formulaire). **Mode manuel** : le partenaire choisit média/programme/plateforme/type de pub/cible + objectif + période → sortie = **tarif** prédit. **Mode auto** : objectif + budget (ou goal) + période → l'**optimiseur** choisit média/programme/plateforme/type de pub/cible/volume → sorties prédites. Toutes les sorties avec **confiance**.
- **Mécanique de commission** → RÉSOLU : prélevée DANS le budget (média net = B×(1−taux)) ; Prix_Euros = coût média net ; **taux fixe configurable** (défaut 12,5 %, plage 10–15 %) ; taux dynamique = v2.
- **Objectif principal & KPI** → RÉSOLU : toggle **Notoriété** / **Lead** / **Vente**. Notoriété = **couverture efficace** (uniques vus ≥3 fois, seuil configurable) ; Lead = inscriptions ; Vente = achats. Oriente l'objectif de l'optimiseur.
- **Métriques de succès** → RÉSOLU : Notoriété=couverture efficace (3+), Lead=inscriptions, Vente=achats. À synthétiser par placement : reach + fréquence (par programme×plateforme), taux_lead + taux_vente (par cible×plateforme×type pub×secteur) ; leads/ventes = audience × taux.
- **Multi-média** → RÉSOLU : synthétiser 2-3 médias (Karata + 2 autres), chacun avec ses programmes et un profil d'audience distinct.
- **Structure du synthétique** → RÉSOLU (principe) : le générateur encode des relations plausibles (cible×plateforme×secteur×type pub → audience/conversion/prix/reach), sinon les recos seraient arbitraires. Détail des règles à fixer à la génération.
- **Stack** → RÉSOLU : Next.js (frontend) + Supabase (Postgres/auth/RLS). Modèles **simples** (régression linéaire/logistique, arbre) entraînés sur Altair AI Studio ; coefficients exportés (PMML) et **scoring réimplémenté en TypeScript** dans Next.js — aucun service externe. Optimiseur en TS (greedy/LP valeur/€, budget au solve-time). Contrainte assumée : pas de modèles complexes (forêts/GBT/NN) tant qu'on reste en scoring TS.
- **Niveau de confiance** → RÉSOLU : dérivé des modèles simples (intervalle de prédiction pour la régression, probabilité pour la classif), calculé en TS et affiché par valeur prédite.
- **Workflow** → MIS À JOUR (2026-05-23, pivot self-service) : **paiement self-service RÉEL** via **Stripe Checkout** hébergé + **webhook** (`/api/stripe/webhook` → état `payée`). Voie **expert** : la demande alimente le pipeline admin (Soumise → … → Payée). Les **emails transactionnels** restent à brancher (P1). _(Remplace l'ancien workflow entièrement simulé.)_
- **Auth** → MIS À JOUR (2026-05-23, pivot self-service) : auth **obligatoire dès l'entrée** pour les partenaires (Supabase Auth via `@supabase/ssr` + `proxy.ts`). Le compte capture email + profil entreprise (table `profiles` + trigger de création) ; `/admin` protégé par `is_admin`. _(Remplace l'ancien modèle « partenaire anonyme ».)_
- **Fuite** : audience/conversion réalisées interdites comme features.
- **Nom plateforme** → RÉSOLU (2026-05-22) : **"MB Média Ads"**. L'ancien "Karata Ads" était un héritage ; Karata n'est qu'un média parmi d'autres, l'opérateur est MB Média.
- **Quality_Score** → ÉCLAIRCI (data) : varie par placement, corrèle avec le **prix** (QS≥7 → ~1127€ vs <7 → ~814€), aucun lien avec objectif atteint ni comportement. = note de premiumness du placement (feature du modèle de prix), PAS le score visiteur du brief.
- **Score partenaire (lead score)** → RÉSOLU : modèle ML prédisant la **propension à convertir** (taux de conversion attendu) du partenaire ; profil + signaux rapidité/engagement = features. ⚠ Comportement 45 % → cold-start profil-only pour les nouveaux partenaires.

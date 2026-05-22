# MB Média Ads

Plateforme d'**agence média multi-média** opérée par **MB Média**. Des partenaires y achètent de l'espace publicitaire / du mécénat sur des **médias** (Karata est l'un d'eux, parmi d'autres). Modèle économique : **commission de 10 à 15 %** sur le montant investi par le partenaire (= revenu de MB Média). Un partenaire fournit identité + profil + période + une contrainte (budget ou objectif, selon le **mode**) ; la plateforme recommande la **campagne idéale** et prédit les sorties libres (audience, conversion, ou budget) avec un **niveau de confiance**. Puis workflow demande → convention → paiement.

## Language

**MB Média**:
L'agence média qui opère la plateforme. « Nous », c'est MB Média (pas un média en particulier). _Avoid_: Karata (qui n'est qu'un des médias).

**Partenaire**:
L'entité (entreprise, association, particulier) qui achète de l'espace / soutient des programmes via la plateforme. _Avoid_: Client, Annonceur, Entreprise.

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

**Mode de résolution**:
**Budget-driven** : on fixe budget + période, on maximise l'audience/conversion. **Goal-driven** : on fixe un objectif d'audience/conversion + période, on minimise le budget. Même moteur prédictif.

**Niveau de confiance**:
Estimation d'incertitude affichée pour chaque valeur prédite (audience, conversion, prix).

**Type de pub**:
Format du soutien/insertion. 6 valeurs : Don, Mécénat, Citation orale, Placement produit, Logo fin, Logo début/fin. Don ≠ Mécénat.

**Type d'entreprise**:
Nature du partenaire. 4 valeurs : Privé, Public, Association, Particulier.

**Demande**:
Une demande de partenariat soumise via le formulaire. Cycle de vie : Soumise → Acceptée / Refusée → Convention envoyée → Payée. _Avoid_: requête, lead.

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
- **Contrat I/O** → RATIFIÉ : identité + profil + période en entrée ; 2 modes (budget/goal) ; optimiseur choisit média/programme/plateforme/type de pub/cible/volume ; sorties prédites + confiance.
- **Mécanique de commission** → RÉSOLU : prélevée DANS le budget (média net = B×(1−taux)) ; Prix_Euros = coût média net ; **taux fixe configurable** (défaut 12,5 %, plage 10–15 %) ; taux dynamique = v2.
- **Objectif principal & KPI** → RÉSOLU : toggle **Notoriété** / **Lead** / **Vente**. Notoriété = **couverture efficace** (uniques vus ≥3 fois, seuil configurable) ; Lead = inscriptions ; Vente = achats. Oriente l'objectif de l'optimiseur.
- **Métriques de succès** → RÉSOLU : Notoriété=couverture efficace (3+), Lead=inscriptions, Vente=achats. À synthétiser par placement : reach + fréquence (par programme×plateforme), taux_lead + taux_vente (par cible×plateforme×type pub×secteur) ; leads/ventes = audience × taux.
- **Multi-média** → RÉSOLU : synthétiser 2-3 médias (Karata + 2 autres), chacun avec ses programmes et un profil d'audience distinct.
- **Structure du synthétique** → RÉSOLU (principe) : le générateur encode des relations plausibles (cible×plateforme×secteur×type pub → audience/conversion/prix/reach), sinon les recos seraient arbitraires. Détail des règles à fixer à la génération.
- **Stack** → RÉSOLU : Next.js (frontend) + Supabase (Postgres/auth/RLS). Modèles **simples** (régression linéaire/logistique, arbre) entraînés sur Altair AI Studio ; coefficients exportés (PMML) et **scoring réimplémenté en TypeScript** dans Next.js — aucun service externe. Optimiseur en TS (greedy/LP valeur/€, budget au solve-time). Contrainte assumée : pas de modèles complexes (forêts/GBT/NN) tant qu'on reste en scoring TS.
- **Niveau de confiance** → RÉSOLU : dérivé des modèles simples (intervalle de prédiction pour la régression, probabilité pour la classif), calculé en TS et affiché par valeur prédite.
- **Workflow** → RÉSOLU (proto) : **simulé** — emails (partenaire + MB Média) et paiement *mockés* à l'écran, rien n'est réellement envoyé/encaissé. On modélise quand même l'entité **Demande** + ses états + une vue admin MB Média (accepter/refuser).
- **Auth** → RÉSOLU : partenaire **anonyme** (formulaire en accès libre, résultat à l'écran) ; seul MB Média s'authentifie (Supabase) pour la vue admin. « Nb de visites précédentes » simulé depuis les données, pas de tracking de session réel.
- **Fuite** : audience/conversion réalisées interdites comme features.
- **Nom plateforme** → RÉSOLU (2026-05-22) : **"MB Média Ads"**. L'ancien "Karata Ads" était un héritage ; Karata n'est qu'un média parmi d'autres, l'opérateur est MB Média.
- **Quality_Score** → ÉCLAIRCI (data) : varie par placement, corrèle avec le **prix** (QS≥7 → ~1127€ vs <7 → ~814€), aucun lien avec objectif atteint ni comportement. = note de premiumness du placement (feature du modèle de prix), PAS le score visiteur du brief.
- **Score partenaire (lead score)** → RÉSOLU : modèle ML prédisant la **propension à convertir** (taux de conversion attendu) du partenaire ; profil + signaux rapidité/engagement = features. ⚠ Comportement 45 % → cold-start profil-only pour les nouveaux partenaires.

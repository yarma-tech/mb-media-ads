# MB Média Ads — PRD

> Plateforme d'**agence média multi-média** opérée par **MB Média**. Vocabulaire du domaine : voir [CONTEXT.md](CONTEXT.md). Système de design : voir [DESIGN.md](DESIGN.md).
> **Statut (2026-05-23) :** pivot self-service implémenté en local sur 4 phases (auth, mode manuel, mode auto, paiement). Voir §12.

---

## 1. Problem Statement

Un **partenaire** (PME, association, public, particulier — souvent non-marketeur) qui veut faire de la publicité multi-média ne sait ni **ce que ça coûte**, ni **ce qu'il obtient** pour son budget. Aujourd'hui chaque demande est traitée **à la main** par MB Média (formulaire → demande → étude → convention → paiement), ce qui est lent pour les petits budgets et ne passe pas à l'échelle. Le partenaire veut **un tarif/une campagne tout de suite et payer en ligne**, tout en gardant la possibilité de **parler à un humain** pour les cas complexes.

## 2. Goals

- **Conversion self-service** : un partenaire passe d'une idée à une **campagne payée** sans intervention humaine.
- **Réponse instantanée et crédible** : tarif (mode manuel) ou campagne optimale (mode auto) affiché en quelques secondes, **chaque valeur avec son niveau de confiance**.
- **Préserver la voie humaine** : « Parler à un expert » alimente le pipeline admin existant pour les comptes complexes/gros budgets.
- **Réduire le traitement manuel** de MB Média sur les achats standards.
- **Constituer une base de partenaires qualifiés** : compte obligatoire (email + profil entreprise) dès l'entrée.

## 3. Non-Goals (v1)

- **Pas de builder multi-lignes** en mode manuel : une configuration → un tarif (panier multi-placements = futur).
- **Pas de trafficking/diffusion réelle** : la plateforme vend et chiffre ; la production de campagne reste opérée hors-ligne par MB Média.
- **Pas de commission dynamique** : taux fixe **12,5 %** (plage 10–15 %) ; tarification dynamique = futur.
- **Pas d'édition de campagne après paiement** côté partenaire.
- **Un seul prestataire de paiement** : Stripe (Checkout hébergé). Autres prestataires = hors scope.
- **Pas de vrai modèle ML** : scoring TypeScript sur coefficients synthétiques (fit réel = futur).
- **Pas de gestion de remboursement/annulation** en self-service (traité par l'expert si besoin).

## 4. Users & Personas

- **Partenaire** — entreprise/association/particulier, souvent novice en achat média. Au bureau, en journée, évalue un investissement de quelques centaines à quelques milliers d'euros. **Doit créer un compte** (email + nom entreprise + secteur + type de structure). Job : comprendre vite ce qu'il paie / ce qu'il obtient et décider en confiance.
- **MB Média (admin)** — le staff qui opère la plateforme : traite les **demandes « expert »** (trier par lead-score, accepter/refuser, convention) et supervise les **commandes self-service** déjà payées. Usage répété, orienté efficacité.

## 5. Product Overview

Parcours (auth obligatoire dès le départ) :

```
Home → Sign in / Sign up (email + profil entreprise)
   → Step 0 : choisir le mode
        ├─ « Définir ma campagne » (manuel) : Média → Programme → Réseau → Type de pub → Cible → Objectif → Dates → nb diffusions
        │      → prédiction du TARIF cible
        └─ « Campagne auto » : Objectif + Budget + Dates
               → prédiction de la CAMPAGNE (placements optimaux)
   → Step 2 : affichage (tarif / campagne + confiance) + « Modifier » (reboucle)
   → Sortie : « Payer » (Stripe Checkout)  OU  « Parler à un expert » (pipeline admin)
```

- **Mode manuel** = retour au formulaire de tarif d'origine : le partenaire compose un placement, on prédit son prix (modèle de prix) + le résultat attendu pour l'objectif choisi.
- **Mode auto** = l'optimiseur compose la campagne idéale sous contrainte budget (par défaut) ou objectif chiffré (option avancée).
- Les deux modes convergent vers le **même affichage** et les **mêmes deux sorties**. Revenu MB Média = **commission incluse dans le montant** (média net = montant × (1 − taux)).

## 6. User Stories

**Partenaire**
- En tant que partenaire, je veux **créer un compte** avec mes infos entreprise pour accéder à l'outil et ne plus avoir à les ressaisir.
- …je veux **définir ma campagne** (média, programme, réseau, format, cible) et voir **le tarif** pour savoir ce que coûte exactement ce placement.
- …je veux **donner mon budget et mon objectif** et recevoir une **campagne composée pour moi** quand je ne sais pas quoi choisir.
- …je veux **modifier mes paramètres** et recalculer sans repartir de zéro.
- …je veux **payer en ligne** pour lancer ma campagne immédiatement.
- …je veux **parler à un expert** plutôt que payer quand mon besoin est complexe ou gros.
- …je veux voir **le détail du prix** (média net + commission) pour comprendre ce que je paie.

**MB Média (admin)**
- En tant qu'admin, je veux que **/admin soit protégé** pour que seuls mes collaborateurs y accèdent.
- …je veux voir les **demandes « expert »** priorisées par lead-score pour traiter d'abord les plus prometteuses.
- …je veux **faire avancer l'état** d'une demande (acceptée → convention → payée) ou la refuser.
- …je veux distinguer les **commandes self-service payées** des demandes à traiter.

## 7. Requirements

### Auth (P0)
- Compte obligatoire pour accéder au flux campagne, au paiement et à `/admin`.
- Sign up capture **email + nom entreprise + secteur + type de structure** ; un profil est créé automatiquement.
- Acceptance :
  - [ ] Visiter `/campagne` ou `/admin` déconnecté redirige vers `/connexion?next=…`
  - [ ] Sign up crée un compte **et** une ligne profil (infos entreprise)
  - [ ] Connexion ouvre une session ; déconnexion la ferme et renvoie à l'accueil
  - [ ] `/admin` n'est accessible qu'aux profils `is_admin`
  - [ ] Les infos entreprise ne sont **plus ressaisies** dans le formulaire (injectées du profil)

### Mode manuel — tarif (P0)
- Sélection en cascade Média → Programme (du média) → Réseau (du programme) → Type de pub → Cible, + Objectif + Dates + nb de diffusions (suggéré = cadence × période, ajustable).
- Renvoie un **tarif** (prix unitaire × diffusions, commission incluse) + résultat attendu (couverture/leads/ventes selon objectif) avec confiance.
- Acceptance :
  - [ ] Les listes Programme/Réseau se filtrent selon les choix amont
  - [ ] Le tarif affiche « Vous payez » (commission incluse) et « Vous obtenez » (objectif) avec fourchette + confiance
  - [ ] « Modifier » revient au formulaire pré-rempli

### Mode auto — campagne (P0)
- Entrées : Objectif + **Budget (requis)** + Dates ; objectif chiffré = option avancée.
- L'optimiseur compose des placements multi-programmes et estime audience/couverture/leads/ventes + coût, avec confiance.
- Acceptance :
  - [ ] Budget + dates + objectif → liste de placements + « Vous obtenez / Vous payez »
  - [ ] Affichage et sorties identiques au mode manuel

### Sorties : Payer / Expert (P0)
- Deux CTA sur le résultat des deux modes : **Payer** (Stripe Checkout) et **Parler à un expert**.
- **Payer** : crée une demande `canal=self_service` liée au partenaire, ouvre une session Stripe (montant = total commission incluse, **recalculé serveur**), redirige, et le **webhook** passe la demande à `payée`.
- **Expert** : crée une demande `canal=expert` (état `soumise`) → pipeline admin.
- Acceptance :
  - [ ] Le montant Stripe est **recalculé côté serveur** (jamais envoyé par le client)
  - [ ] Paiement réussi → état `payée` + `paye_at` + ids Stripe (via webhook signé)
  - [ ] Retour sur une page de confirmation `/campagne/merci`
  - [ ] « Parler à un expert » crée une demande `soumise` visible dans `/admin`
  - [ ] Si Stripe non configuré, « Payer » affiche un message clair et propose l'expert (pas de crash)

### Admin (P0, existant)
- File priorisée par lead-score ; transitions d'état ; séparation à traiter / traitées.
- (P1) Afficher le **canal** (self-service vs expert) et le statut de paiement.

### Nice-to-Have (P1)
- Désactivation de la confirmation email pour un parcours sans friction (réglage Supabase).
- Historique « mes campagnes » côté partenaire (lecture de ses demandes via `user_id` + RLS).
- Reçu / facture après paiement.
- Email transactionnel réel (confirmation paiement, accusé de demande expert).

### Future Considerations (P2)
- Panier multi-placements en mode manuel.
- Commission dynamique par placement/saison.
- Vrai modèle ML (fit sur données réelles), coefficients chargés depuis `model_coefficients`.
- Édition/relance de campagne, remboursement self-service.

## 8. Success Metrics

**Leading (jours → semaines)**
- **Taux d'activation** : % de comptes créés qui lancent ≥1 calcul de campagne. Cible : ≥ 60 %.
- **Conversion self-service** : % de résultats affichés qui aboutissent à un **paiement**. Cible : ≥ 15 % (hypothèse à calibrer).
- **Répartition Payer / Expert** : suivre le split pour comprendre où va la valeur.
- **Time-to-tarif** : temps entre arrivée sur `/campagne` et premier résultat. Cible : < 90 s.
- **Taux d'erreur de paiement** (échecs Stripe / abandons checkout).

**Lagging (semaines → mois)**
- **Réduction du traitement manuel** : part des achats passant en self-service vs expert.
- **Rétention / réachat** : % de partenaires qui relancent une campagne.
- **Revenu de commission** encaissé en self-service.

## 9. Design & Brand (inchangé)

Sobre, crédible, posé — la voix d'un **studio média** sûr de son expertise. Trois mots : **net, fiable, humain**. Émotion visée : confiance et transparence (« je vois ce que je paie et ce que j'obtiens »), jamais la pression commerciale.

**Principes**
- **Montrer le raisonnement, pas seulement le chiffre** : chaque prédiction avec sa confiance et la composition qui la produit (données synthétiques = illustratives, jamais des garanties).
- **Le calme comme signal de sérieux** : densité maîtrisée, couleur rare, typo soignée.
- **Équilibre affiché** : commission MB Média et arbitrage budget/objectif exposés honnêtement ; pas de coût caché.
- **Une seule grammaire visuelle** côté partenaire et admin.

**Anti-références** : pas de SaaS bleu générique, pas de dashboard sombre néon, pas de régie racoleuse, pas de corporate sans âme. (Registre Apple actuel : voir DESIGN.md.)

## 10. Accessibility & Inclusion

WCAG AA **+ daltonisme**. Contrastes ≥ 4.5 (texte) / ≥ 3 (UI), focus visibles, navigation clavier complète, cibles ≥ 44px, `prefers-reduced-motion` respecté. Aucune information par la couleur seule : chaque état porte **icône + libellé** ; confiance = **% chiffré + libellé + barre**. Lisible en deutéranopie / protanopie / tritanopie.

## 11. Open Questions

- **Mode manuel — volume** *(produit)* : le nb de diffusions par défaut = cadence × période ; faut-il borner au-delà de la capacité, ou laisser libre ? *(non bloquant)*
- **Commandes payées vs admin** *(produit)* : une commande self-service payée doit-elle apparaître dans `/admin` pour suivi de production, ou suivre un flux séparé ? *(non bloquant)*
- **Nom du contact** *(produit/data)* : le profil n'a pas de nom de contact distinct (on utilise l'email) — faut-il l'ajouter au sign up ? *(non bloquant)*
- **Confirmation email** *(ops)* : activée sur le projet Supabase → la désactiver pour le proto, ou garder et soigner le mail de confirmation ? *(bloquant pour un parcours fluide)*
- **Remboursement / annulation** *(produit/légal)* : politique pour une commande payée annulée ? *(non bloquant v1)*
- **Refus expert** *(produit)* : un partenaire dont la demande expert est refusée voit quoi ? *(non bloquant)*

## 12. Phasing & Status

Implémenté en local (non poussé sur `main` au 2026-05-23) ; base Supabase distante migrée.

- **Phase 1 — Auth** ✅ : Supabase SSR (`@supabase/ssr`), `proxy.ts` (session + protection des routes), `/connexion` + `/inscription`, table `profiles` + trigger, `/admin` protégé. Vérifié bout en bout.
- **Phase 2 — Mode manuel** ✅ : Step 0, cascade, `predictTarif` (réutilise le scoring par combinaison), affichage réutilisé. Vérifié.
- **Phase 3 — Mode auto** ✅ : formulaire mono-étape, infos entreprise injectées du profil, CTA « Parler à un expert ». Vérifié.
- **Phase 4 — Paiement** ✅ code-complet : CTA partagé Payer/Expert, action `payer` (Stripe Checkout), webhook `/api/stripe/webhook`, page `/campagne/merci`, demandes liées `user_id` + `canal`. **À tester avec les clés Stripe de test** (redirection + webhook → `payée`).

**Dépendances / déploiement** : nécessite `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (mode test) dans `.env.local`. Désactiver la confirmation email Supabase pour un parcours sans friction. Le site live tourne encore sur l'ancien code tant que `main` n'est pas mis à jour.

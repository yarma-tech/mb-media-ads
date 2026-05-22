# MB Média Ads — Handoff d'exécution

> But de ce document : permettre à une **nouvelle session** (ou un dev) de poursuivre le prototype sans réinterviewer. Il résume le contexte, fige les décisions, et détaille les 3 chantiers : (1) dataset enrichi, (2) schéma Supabase, (3) build Next.js.
>
> **État au 2026-05-22 : étapes 1, 2 et 3 faites. Intégration Supabase COMPLÈTE — migrations appliquées sur `xxfqvbvyasnnvmycpogx`, `.env.local` rempli (URL + anon + service_role) ; catalogue servi live + demandes persistées + vue admin sur la base (round-trip insert/select/update vérifié). Seul reste structurel : les modèles Altair (coefficients factices en place). DÉPLOYÉ EN LIGNE sur Vercel : https://mb-media-ads.vercel.app (projet `yarma-tech/mb-media-ads`, vars Supabase configurées en Production, Supabase vérifié en prod via logs API).** Détail dans « Avancement ».

## 0. Comment reprendre

1. Lire **[CONTEXT.md](CONTEXT.md)** — langage du domaine + ambiguïtés tranchées (source de vérité, **pas** le brief initial).
2. Lire **[docs/adr/0001](docs/adr/0001-scoring-ts-modeles-simples.md)** et **[docs/adr/0002](docs/adr/0002-substrat-donnees-synthetique.md)** — les 2 décisions structurantes.
3. Lire **[PRODUCT.md](PRODUCT.md)** + **[DESIGN.md](DESIGN.md)** — contexte design (skill `impeccable`) : registre produit, studio média sobre, thème clair, Hanken Grotesk, WCAG AA + daltonisme.
4. Lancer l'app : `npm install` puis `npm run dev` → http://localhost:3000. **En ligne (prod) : https://mb-media-ads.vercel.app** (projet Vercel `yarma-tech/mb-media-ads`). **CI/CD : `git push origin main` auto-déploie en production** (les autres branches = preview deploys). Redéploiement manuel : `vercel deploy --prod --yes` (scope = équipe yarma-tech, ID via `vercel teams ls`). Les 3 variables Supabase sont configurées sur Vercel en Production (hors repo ; `.env.local` gitignoré). ⚠️ Auth admin à implémenter avant de collecter de vraies demandes. ⚠️ Repo public : ne jamais committer de secret.
5. Dataset source (hors repo) : le CSV V3 d'origine (synthétique, ~5000 lignes, séparateur `;`). Dataset **enrichi** : `data/dataset_enrichi.csv` (11 778 × 37, reproductible via `python3 data/enrich_dataset.py`).
6. Repo : la racine de ce dépôt.

## Avancement (2026-05-22)

| Chantier | État |
|---|---|
| **Étape 1 — Dataset enrichi** | ✅ Fait (`data/dataset_enrichi.csv`) |
| **Étape 2 — Schéma Supabase** | ✅ Appliqué sur `xxfqvbvyasnnvmycpogx` (2 migrations, 5 tables + RLS + seed catalogue). Vérifié : lecture anon du catalogue OK, RLS bloque le select anon des demandes, insert public OK. |
| **Étape 3 — Build Next.js** | ✅ Fait — app fonctionnelle (formulaire → optimiseur → résultat → admin), testée navigateur |
| Modèles ML (Altair) | ⛔ Pas faits — coefficients **factices** en place (`lib/models.ts`), à remplacer |
| Supabase live | ✅ **Complet** — catalogue servi live + **demandes persistées** + vue admin sur la base. `.env.local` = URL + anon + service_role. Round-trip vérifié (formulaire → insert DB → `/admin` lit la base → accept = update DB), puis ligne de test supprimée. |

**Reste à faire (ordre conseillé) :**
1. ✅ FAIT — Connecteur Supabase authentifié (compte secondaire dédié), migrations appliquées sur `xxfqvbvyasnnvmycpogx`, `.env.local` rempli (URL + anon + **service_role**). Intégration complète et vérifiée : catalogue live, demandes persistées, vue admin sur la base.
2. **Entraîner les 5 modèles sur Altair**, exporter les coefficients, **remplacer les factices** (même schéma, voir §5).
3. Polissage : favicon, états vides, pagination admin éventuelle.

## 1. Le produit en bref

Plateforme d'**agence média multi-média** opérée par **MB Média** (Karata = un média parmi d'autres). Un **partenaire** saisit identité + profil + période + objectif principal, puis selon le **mode** :
- **Budget-driven** : il fixe son **budget** → on **maximise** la valeur (selon l'objectif principal).
- **Goal-driven** : il fixe un **objectif chiffré** → on **minimise** le budget pour l'atteindre.

L'optimiseur propose la **campagne idéale** (média × programme × plateforme de diffusion × type de pub × cible × volume) et affiche audience / conversion / couverture, **chacune avec un niveau de confiance**. Puis workflow (simulé) demande → emails → accept/refus → convention → paiement.

**Revenu MB Média** = commission **10-15 %** (défaut 12,5 %), **prélevée dans le budget** : média net = `budget × (1 − taux)`.

## 2. Décisions verrouillées (ne pas relitiger)

| Sujet | Décision |
|---|---|
| Acheteur | **Partenaire** (entreprise/asso/particulier) |
| Opérateur / modèle éco | **MB Média**, commission 10-15 % dans le budget |
| Type d'entreprise | Privé / Public / Association / Particulier (pas de "semi-public") |
| Type de pub | Don, Mécénat, Citation orale, Placement produit, Logo fin, Logo début/fin |
| Forme produit | **Optimiseur inverse**, 2 modes (budget-driven / goal-driven), même moteur |
| Objectif principal (toggle) | **Notoriété** / **Lead** / **Vente** |
| KPI par objectif | Notoriété = **couverture efficace** (uniques vus ≥3 fois) · Lead = inscriptions · Vente = achats |
| Optimisation | Greedy/LP **valeur/€**, **budget appliqué au solve-time** (jamais précalculé), capacité bornée par la période |
| Lead score | Modèle **ML = propension à convertir** ; affiché à l'admin pour prioriser |
| Multi-média | 3 médias : **Karata** (grand public, 7 prog.) · **Lumen** (premium/pro) · **Pulse** (jeune/social) — profils distincts |
| Modèles | **Simples** (régression/arbre), Altair AI Studio, coeffs PMML, **scoring réimplémenté en TS** — aucun service externe (voir ADR-0001) |
| Confiance | Dérivée des modèles simples (intervalle régression / proba logistique), calculée en TS |
| Stack | **Next.js + Supabase** (Postgres/auth/RLS) |
| Workflow | **Simulé** (emails + paiement mockés) ; entité Demande à états + vue admin |
| Auth | Partenaire **anonyme** ; **admin seul** authentifié (Supabase) |
| Données | **Synthétiques** → prédictions **illustratives** (voir ADR-0002) |
| Saisonnalité | **Karata = Carnaval de Guadeloupe (T1, +~40 %)** ; Lumen/Pulse = calendrier commercial classique. Feature `Fenetre_Commerciale` |
| Grain audience | Existante = **campagne** (conservée) + ajout `Audience_Placement_K_Vues` **additive** (somme par campagne = audience campagne) |

## 3. Étape 1 — Dataset enrichi ✅ FAIT

**Artefacts** : `data/enrich_dataset.py` (générateur stdlib, **seedé, reproductible**) → `data/dataset_enrichi.csv`. Relancer : `python3 data/enrich_dataset.py`.

**Réalisé** : **11 778 lignes × 37 colonnes** (19 conservées + 18 ajoutées). Source V3 (5000 lignes) **conservée à l'identique** (seuls les trous comportementaux Karata comblés).
- **Karata** (grand public, 7 prog.) : 7 656 lignes, **105 clients** (60 d'origine + 45 nouveaux aux noms antillais).
- **Lumen** (premium/pro, formats longs, YouTube/Spotify, cible Professionnel ; QS~8, fréq.~1,3, prix le + élevé) : 2 226 lignes — prog. ECO MATIN, GRAND FORMAT, TECH & CO, SANTÉ PLUS.
- **Pulse** (jeune/social, formats courts, TikTok/Instagram, cible Gamers/Kids ; QS~6,8, fréq.~3,7, prix bas) : 1 896 lignes — prog. PULSE DAILY, GAME ON, STREET FOOD, VIBE CHECK.

### Colonnes ajoutées (18)
`Media, Plateforme_Diffusion, Cible, Date_Debut, Date_Fin, Mois, Fenetre_Commerciale, Frequence, Audience_Placement_K_Vues, Reach_K, Couverture_Efficace_K, Taux_Lead, Taux_Vente, Leads_Realises, Ventes_Realises, Objectif_Conversion, Conversion_Realisee, Objectif_Conversion_Atteint`

### Décisions tranchées à l'exécution (figées)
- **Grain audience** : l'audience existante est au **grain campagne** (conservée). Ajout de **`Audience_Placement_K_Vues`** (par placement, **additive** : la somme par campagne = audience campagne) — indispensable au modèle audience unitaire (#2) et à l'optimiseur qui **somme** les placements (étape 3).
- `Reach_K = Audience_Placement / Frequence` ; `Couverture_Efficace_K = Reach si Freq≥3 sinon Reach×(Freq/3)` ; `Leads/Ventes_Realises = Audience_Placement × Taux`.
- **Conversion (grain campagne)** = **leads** (inscriptions) ; les ventes restent disponibles au grain placement.
- **Saisonnalité (métier)** : **Karata = Carnaval de Guadeloupe** → haute saison **T1 janv-mars (~+40 %)** ; **Lumen/Pulse = calendrier commercial classique** (Noël +35 %, rentrée +22 %, fête des mères/St-Valentin, **creux estival −19 %**) + modulation secteur. Encodée via la feature **`Fenetre_Commerciale`** (+ `Mois`). Les prix Karata d'origine portaient déjà le pic carnaval → **conservés** (non re-tarifés).
- **Complétude** : Karata (média mature) = comportement **100 %** rempli ; Lumen/Pulse ~45 % (conserve le **cold-start profil-only** du lead-score, CONTEXT.md).
- **Relations encodées** (signal déterministe + bruit) : affinité cible×plateforme, gradient type_pub, funnel lead→vente, premiumness→prix, propension partenaire. Détail des facteurs dans `data/enrich_dataset.py`.

### Garde-fou — fuite de données
`Audience_Realisee`, `Audience_Placement`, `Reach`, `Couverture_Efficace`, `Leads/Ventes_Realises`, `*_Atteint`, `Conversion_Realisee` sont des **sorties**, **JAMAIS** des features.

### Modèles à entraîner sur Altair (à partir de `data/dataset_enrichi.csv`)
Tous **simples** (régression/arbre). Features : Media, Programme, Plateforme_Diffusion, Type_Pub, Cible, Type_Entreprise, Secteur, Quality_Score :
1. **Prix** unitaire (régression) — **+ `Fenetre_Commerciale`/`Mois`** (saisonnalité).
2. **Audience** unitaire (régression).
3. **Taux_Lead** et **Taux_Vente** (régression).
4. **Fréquence / Reach** (régression) → couverture efficace dérivée.
5. **Lead-score** = propension à convertir du partenaire (features : profil + Nb_Visites/Visites_Avant_Achat/Temps_Plateforme) — **signal au grain partenaire** (faible au grain placement, c'est normal).

→ Exporter les **coefficients** (PMML) pour réimplémentation TS (étape 3).

## 4. Étape 2 — Schéma Supabase ⏳ (migrations écrites, application en attente)

**Fait** : migrations SQL dans `supabase/migrations/` :
- `20260522090001_initial_schema.sql` — 5 tables + RLS (catalogue en lecture publique ; `demandes` insert public, lecture/maj réservées à l'admin authentifié).
- `20260522090002_seed_catalogue.sql` — 3 médias / 15 programmes / plateformes (calqués sur `enrich_dataset.py`).

**Reste** : authentifier le connecteur MCP Supabase (projet `xxfqvbvyasnnvmycpogx`, compte secondaire dédié), **appliquer les migrations**, puis remplir `.env.local` (URL + clé anon). Tant que ce n'est pas fait, `lib/catalog.ts` sert le catalogue local et les demandes vivent en mémoire (`lib/demandes.ts`).

Schéma (rappel) :

> Rappel : **pas de table `predictions`** (on a choisi le scoring TS live, pas le précalcul). Supabase porte le **catalogue**, les **coefficients**, et les **demandes**.

**Catalogue** (lisible en anon) :
- `medias(id, nom, description)`
- `programmes(id, media_id → medias, nom, cadence_diffusions_par_mois)`
- `programme_plateformes(programme_id → programmes, plateforme)` — quelles plateformes par programme
- Référentiels simples (cibles, types_pub, types_entreprise, secteurs) : enums TS suffisent, pas forcément des tables.
- **Saisonnalité** (`Fenetre_Commerciale`) : **dérivée des dates au runtime** (pas de table) — Karata = carnaval T1, autres = calendrier classique.

**Modèles** :
- `model_coefficients(model_name, payload jsonb)` — coeffs exportés des 5 modèles (ou stockés en JSON dans le repo `/models/`).

**Demandes** (insert anon autorisé ; lecture/écriture = admin via RLS) :
- `demandes(id, created_at, nom_entreprise, nom_contact, secteur, type_entreprise, date_debut, date_fin, mode ['budget'|'goal'], objectif_principal ['notoriete'|'lead'|'vente'], budget numeric NULL, objectif_valeur numeric NULL, etat ['soumise'|'acceptee'|'refusee'|'convention_envoyee'|'payee'], lead_score numeric, recommandation jsonb, predictions jsonb)`
  - `recommandation` = placements choisis + volumes + commission.
  - `predictions` = audience / conversion / couverture efficace / coût total / **confiance par métrique**.

**Auth/RLS** : catalogue en lecture publique ; `demandes` → insert public (formulaire), select/update réservés au rôle admin authentifié.

## 5. Étape 3 — Build Next.js ✅ FAIT

App **Next.js 16 (App Router) + TypeScript**, CSS maison (pas de Tailwind), `@supabase/supabase-js`. Lancer : `npm run dev`.

**Modules `lib/`**
- `enums.ts`, `types.ts` — référentiels + types du domaine (taux commission 12,5 %).
- `catalog-seed.ts` / `catalog.ts` — catalogue (3 médias, 15 programmes) ; lit Supabase si configuré, **sinon fallback local**.
- `saison.ts` — `Fenetre_Commerciale` dérivée des dates (Karata = carnaval T1, autres = classique).
- `models.ts` — **coefficients FACTICES** (log-linéaires dérivés du générateur, ordres de grandeur réalistes). ⚠ **À remplacer par l'export Altair** : même schéma `ScoringModel` (regression/logistic, `numeric`/`categorical`/`interactions`) ; idéalement charger des JSON depuis `/models/`.
- `scoring.ts` — réimplémente la régression (valeur + intervalle + **confiance** dérivée de sigma) et la logistique (lead-score). `optimizer.ts` prend `Fenetre_Commerciale`/`Mois` de la période.
- `optimizer.ts` — combos (média×programme×plateforme×type pub×cible) → scoring unitaire → **valeur/€** selon l'objectif (notoriété→couverture efficace, lead→leads, vente→ventes) → mode **budget** (remplir `budget×(1−taux)`) et mode **goal** (atteindre l'objectif au moindre coût) ; capacité = cadence×durée ; **rendement décroissant** par programme pour diversifier ; statuts `ok`/`infaisable`/`sature` ; commission prélevée dans le budget.
- `demandes.ts` — liste/crée/maj des demandes (Supabase si configuré, **sinon en mémoire** + 3 demandes de démo).

**Pages / actions (`app/`)**
- `/` — formulaire public (identité, profil, période, objectif, mode budget|goal) → `actions.ts` (`recommander`) → **résultat inline** (3 métriques + confiance, composition, coût + commission). Bouton **« Envoyer ma demande »** (`envoyerDemande`) → emails **simulés** + lien.
- `/resultat/[id]` — vue persistante d'une demande.
- `/admin` — table triée par **lead-score**, **accepter/refuser**, **envoyer convention** (mock) ; états en badges (icône + libellé, daltonien-safe).

**Design** : `PRODUCT.md` + `DESIGN.md` (skill `impeccable`) — studio média sobre, thème clair, Hanken Grotesk, accent argile, WCAG AA + **daltonisme**.

**Testé navigateur** : golden path budget (composition diversifiée), envoi simulé, remontée + accept en admin, `/resultat/[id]`, budget infaisable, responsive mobile. `tsc` : 0 erreur.

**Reste** : brancher Supabase (cf. §4) ; remplacer les coefficients factices par Altair ; polissage (favicon).

## 6. Pièges à éviter

- **Pas de fuite** : sorties réalisées ≠ features.
- **Budget au solve-time**, jamais en précalcul.
- **Pas de service Python** : scoring TS depuis coefficients ; **modèles simples** uniquement (sinon rouvrir ADR-0001).
- **Commission dans le budget** (pas en sus).
- **Notoriété = couverture efficace (3+)**, pas la fréquence brute (sinon on recommande de matraquer une petite audience).
- **Multi-média** : il faut ≥2 médias aux profils distincts, sinon le différenciateur est creux.
- **Saisonnalité spécifique au média** : Karata = carnaval (T1), Lumen/Pulse = classique — ne pas appliquer une courbe unique ; dériver `Fenetre_Commerciale` de la période.
- **Prédictions illustratives** : ne jamais les présenter comme des garanties (ADR-0002).

## 7. Points ouverts (mineurs, sans impact structurel)

- **Nom** de la plateforme : **« MB Média Ads »** — tranché le 2026-05-22 (l'ancien « Karata Ads » était un héritage ; Karata n'est qu'un média parmi d'autres).
- **Nuance Don vs Mécénat** : RÉSOLU à la génération (distincts ; Mécénat légèrement > Don sur lead/funnel) ; nuance ponctuel/récurrent encore ouverte côté produit.
- **Taux de commission dynamique** (curseur d'équilibre en goal-driven) : reporté en v2 (fixe configurable pour le proto).
- **Coefficients factices** : l'optimiseur peut faire des choix sémantiquement naïfs (ex. type de pub « Don », cible « Kids » car les plus efficaces en coût/résultat). Se corrigera avec les vrais modèles Altair.
- **Favicon** absent (404 cosmétique).

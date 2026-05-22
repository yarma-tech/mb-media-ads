-- Karata Ads — Étape 2 : schéma Supabase (voir HANDOFF.md §4)
--
-- Supabase porte 3 choses : le CATALOGUE (médias/programmes/plateformes, lecture
-- publique), les COEFFICIENTS des modèles (export Altair -> JSON, scoring TS au
-- runtime) et les DEMANDES de partenariat (insert public, lecture/écriture admin).
--
-- Volontairement PAS de table `predictions` : le scoring est calculé en TS au moment
-- de la requête (ADR-0001), jamais précalculé.
--
-- gen_random_uuid() vient de l'extension pgcrypto, activée par défaut sur Supabase.

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------
create table medias (
  id          text primary key,             -- slug stable : 'karata' | 'lumen' | 'pulse'
  nom         text not null,
  description text
);

create table programmes (
  id                          text primary key,   -- slug, ex. 'inside-mas'
  media_id                    text not null references medias(id) on delete cascade,
  nom                         text not null,      -- libellé d'affichage, ex. 'INSIDE MAS'
  -- diffusions/mois : borne la capacité d'une période (cadence x durée) dans l'optimiseur (étape 3).
  cadence_diffusions_par_mois integer not null check (cadence_diffusions_par_mois > 0)
);
create index idx_programmes_media on programmes(media_id);

create table programme_plateformes (
  programme_id text not null references programmes(id) on delete cascade,
  plateforme   text not null check (plateforme in ('YouTube','Facebook','TikTok','Instagram','Spotify')),
  primary key (programme_id, plateforme)
);

-- ---------------------------------------------------------------------------
-- Coefficients des modèles (5 modèles simples entraînés sur Altair, réimplémentés en TS)
-- model_name attendu : 'prix' | 'audience' | 'taux_lead' | 'taux_vente' | 'frequence' | 'lead_score'
-- Reste vide tant que l'export Altair (étape 1, modèles) n'est pas fait.
-- ---------------------------------------------------------------------------
create table model_coefficients (
  model_name text primary key,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Demandes de partenariat (cycle de vie : soumise -> acceptee/refusee -> convention_envoyee -> payee)
-- ---------------------------------------------------------------------------
create table demandes (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  nom_entreprise     text not null,
  nom_contact        text not null,
  secteur            text not null check (secteur in ('Automobile','Food','Tourisme','Luxe','Tech','Santé')),
  type_entreprise    text not null check (type_entreprise in ('Privé','Public','Association','Particulier')),
  date_debut         date not null,
  date_fin           date not null,
  mode               text not null check (mode in ('budget','goal')),
  objectif_principal text not null check (objectif_principal in ('notoriete','lead','vente')),
  budget             numeric check (budget is null or budget > 0),
  objectif_valeur    numeric check (objectif_valeur is null or objectif_valeur > 0),
  etat               text not null default 'soumise'
                       check (etat in ('soumise','acceptee','refusee','convention_envoyee','payee')),
  lead_score         numeric,
  recommandation     jsonb,   -- placements choisis + volumes + commission
  predictions        jsonb,   -- audience / conversion / couverture efficace / coût + confiance par métrique
  -- invariant des 2 modes duaux : budget-driven -> budget fourni ; goal-driven -> objectif fourni
  constraint demandes_mode_contrainte check (
    (mode = 'budget' and budget is not null) or
    (mode = 'goal'   and objectif_valeur is not null)
  ),
  constraint demandes_periode check (date_fin >= date_debut)
);
create index idx_demandes_created_at on demandes(created_at desc);
create index idx_demandes_lead_score on demandes(lead_score desc nulls last);  -- tri de la vue admin
create index idx_demandes_etat       on demandes(etat);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
-- Catalogue + coefficients : lecture publique (données synthétiques, non sensibles).
-- L'écriture passe par les migrations / la clé service_role (jamais le client).
alter table medias                enable row level security;
alter table programmes            enable row level security;
alter table programme_plateformes enable row level security;
alter table model_coefficients    enable row level security;

create policy "lecture publique" on medias
  for select to anon, authenticated using (true);
create policy "lecture publique" on programmes
  for select to anon, authenticated using (true);
create policy "lecture publique" on programme_plateformes
  for select to anon, authenticated using (true);
create policy "lecture publique" on model_coefficients
  for select to anon, authenticated using (true);

-- Demandes : insertion publique (formulaire partenaire anonyme) ;
-- lecture + mise à jour réservées à l'admin authentifié (= MB Média).
alter table demandes enable row level security;

create policy "insertion publique (formulaire)" on demandes
  for insert to anon, authenticated with check (true);
create policy "lecture admin" on demandes
  for select to authenticated using (true);
create policy "mise a jour admin" on demandes
  for update to authenticated using (true) with check (true);

-- MB Média Ads — Module « Social Ads » (aperçu & validation de campagnes).
--
-- Outil autonome, greffé sur l'app existante : un partenaire authentifié compose
-- un PLAN (ensemble d'annonces social), génère un LIEN PUBLIC de partage, et le
-- destinataire (sans compte) VALIDE et COMMENTE chaque annonce.
--
-- Cohabitation : tables préfixées `sa_` pour ne rien croiser avec le schéma média
-- (medias/programmes/demandes…). Réutilise auth.users (Supabase Auth) déjà en place.
--
-- Modèle d'accès :
--   • Owner (partenaire connecté) : RLS stricte, il ne voit/édite que SES plans.
--   • Destinataire du lien (anonyme) : AUCUN accès direct à la base. Toute la page
--     publique passe par le serveur (clé service_role) qui valide le TOKEN. La RLS
--     reste donc « owner-only » ; les écritures publiques (commentaires, décisions)
--     transitent par du code serveur token-validé, jamais par le client anon.

-- ===========================================================================
-- 1. Plans — un plan marketing = un lot d'annonces à faire valider.
-- ===========================================================================
create table sa_plans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  nom          text not null,
  client_nom   text,                         -- nom du destinataire / de la marque cliente
  statut       text not null default 'brouillon'
               check (statut in ('brouillon','en_revue','approuve')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_sa_plans_user on sa_plans(user_id);

-- ===========================================================================
-- 2. Annonces — une créa unitaire dans un plan, pour une plateforme donnée.
-- ===========================================================================
create table sa_ads (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references sa_plans(id) on delete cascade,
  ordre        int  not null default 0,       -- ordre d'affichage dans le plan
  plateforme   text not null default 'facebook'
               check (plateforme in ('facebook','instagram','linkedin','tiktok')),
  format       text not null default 'feed_image'
               check (format in ('feed_image','feed_carrousel','feed_video','story','reel')),
  -- Contenu marketing (chaque champ optionnel selon le format/plateforme)
  marque_nom     text,                         -- nom de page/compte affiché
  marque_handle  text,                         -- @handle (IG/TikTok/LinkedIn)
  marque_logo    text,                         -- URL logo/avatar
  texte_principal text,                        -- corps du post (primary text)
  titre          text,                         -- headline (bas de créa FB/LinkedIn)
  description    text,                         -- sous-titre du lien
  cta            text,                         -- libellé du bouton (En savoir plus…)
  lien_libelle   text,                         -- domaine affiché (ex. karata.fr)
  -- Médias : tableau [{ type:'image'|'video'|'gif', url, largeur?, hauteur? }]
  medias       jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index idx_sa_ads_plan on sa_ads(plan_id, ordre);

-- ===========================================================================
-- 3. Liens de partage — un token public par lien vers un plan.
-- ===========================================================================
create table sa_share_links (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references sa_plans(id) on delete cascade,
  token        text not null unique,           -- identifiant public (URL /preview/{token})
  actif        boolean not null default true,
  expire_le    timestamptz,                     -- null = sans expiration
  created_at   timestamptz not null default now()
);
create index idx_sa_share_links_plan on sa_share_links(plan_id);

-- ===========================================================================
-- 4. Commentaires — laissés par le destinataire (anonyme) via le lien.
-- ===========================================================================
create table sa_comments (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references sa_plans(id) on delete cascade,
  ad_id        uuid references sa_ads(id) on delete cascade,  -- null = commentaire général
  auteur       text not null default 'Invité',
  corps        text not null,
  resolu       boolean not null default false,
  created_at   timestamptz not null default now()
);
create index idx_sa_comments_plan on sa_comments(plan_id, created_at);
create index idx_sa_comments_ad on sa_comments(ad_id);

-- ===========================================================================
-- 5. Décisions de validation — une décision courante par (annonce, relecteur).
-- ===========================================================================
create table sa_approvals (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references sa_plans(id) on delete cascade,
  ad_id        uuid not null references sa_ads(id) on delete cascade,
  relecteur    text not null default 'Invité',
  decision     text not null check (decision in ('approuve','revision')),
  created_at   timestamptz not null default now(),
  unique (ad_id, relecteur)                     -- upsert : dernière décision par relecteur
);
create index idx_sa_approvals_plan on sa_approvals(plan_id);

-- ===========================================================================
-- 6. RLS — owner-only. (Le serveur service_role bypass la RLS pour la page
--    publique token-validée ; ces politiques protègent les accès client.)
-- ===========================================================================
alter table sa_plans       enable row level security;
alter table sa_ads         enable row level security;
alter table sa_share_links enable row level security;
alter table sa_comments    enable row level security;
alter table sa_approvals   enable row level security;

-- Plans : le partenaire gère les siens.
create policy "sa_plans : owner tout" on sa_plans
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Helper : le plan appartient-il à l'utilisateur courant ?
create or replace function public.sa_owns_plan(p uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (select 1 from public.sa_plans where id = p and user_id = auth.uid());
$$;

-- Annonces / liens / commentaires / décisions : accès via la propriété du plan.
create policy "sa_ads : owner tout" on sa_ads
  for all to authenticated
  using (public.sa_owns_plan(plan_id)) with check (public.sa_owns_plan(plan_id));

create policy "sa_share_links : owner tout" on sa_share_links
  for all to authenticated
  using (public.sa_owns_plan(plan_id)) with check (public.sa_owns_plan(plan_id));

-- Commentaires & décisions : l'owner les LIT et peut les gérer (résoudre) ;
-- les écritures publiques passent par le serveur service_role.
create policy "sa_comments : owner tout" on sa_comments
  for all to authenticated
  using (public.sa_owns_plan(plan_id)) with check (public.sa_owns_plan(plan_id));

create policy "sa_approvals : owner lecture" on sa_approvals
  for select to authenticated using (public.sa_owns_plan(plan_id));

-- ===========================================================================
-- 7. updated_at automatique.
-- ===========================================================================
create or replace function public.sa_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sa_plans_touch before update on sa_plans
  for each row execute function public.sa_touch_updated_at();
create trigger sa_ads_touch before update on sa_ads
  for each row execute function public.sa_touch_updated_at();

-- ===========================================================================
-- 8. Stockage des médias — bucket public (les créas doivent s'afficher via le
--    lien de partage, donc lecture publique par URL).
-- ===========================================================================
insert into storage.buckets (id, name, public)
values ('social-ads', 'social-ads', true)
on conflict (id) do nothing;

-- Écriture réservée aux partenaires connectés ; lecture publique (bucket public).
create policy "sa_media : upload authentifie" on storage.objects
  for insert to authenticated with check (bucket_id = 'social-ads');
create policy "sa_media : maj authentifie" on storage.objects
  for update to authenticated using (bucket_id = 'social-ads');
create policy "sa_media : suppression authentifie" on storage.objects
  for delete to authenticated using (bucket_id = 'social-ads');

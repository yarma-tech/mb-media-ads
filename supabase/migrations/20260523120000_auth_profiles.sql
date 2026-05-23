-- Karata Ads — Auth (Phase 1) : profils utilisateurs + liaison des demandes + RLS.
--
-- L'app passe en self-service authentifié : un compte est requis dès le départ.
-- Supabase Auth gère auth.users ; on ajoute une table `profiles` (infos entreprise,
-- collectées à l'inscription) et on rattache les demandes à leur utilisateur.

-- ---------------------------------------------------------------------------
-- Profils (1-1 avec auth.users) — infos entreprise saisies à l'inscription.
-- ---------------------------------------------------------------------------
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  nom_entreprise  text not null,
  secteur         text not null check (secteur in ('Automobile','Food','Tourisme','Luxe','Tech','Santé')),
  type_entreprise text not null check (type_entreprise in ('Privé','Public','Association','Particulier')),
  is_admin        boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profil : lecture de soi" on profiles
  for select to authenticated using (auth.uid() = id);
create policy "profil : mise a jour de soi" on profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Création automatique du profil à l'inscription (lit les infos de user_metadata).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nom_entreprise, secteur, type_entreprise)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nom_entreprise', ''),
    coalesce(new.raw_user_meta_data->>'secteur', 'Tech'),
    coalesce(new.raw_user_meta_data->>'type_entreprise', 'Privé')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper admin (SECURITY DEFINER pour éviter la récursion RLS sur profiles).
create or replace function public.is_admin()
returns boolean
language sql security definer stable set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- Demandes : rattachement à l'utilisateur + mode/canal (préparation self-service).
-- ---------------------------------------------------------------------------
alter table demandes
  add column user_id       uuid references auth.users(id) on delete set null,
  add column type_campagne text not null default 'auto'   check (type_campagne in ('auto','manuel')),
  add column canal         text not null default 'expert' check (canal in ('self_service','expert'));
create index idx_demandes_user_id on demandes(user_id);

-- Durcissement RLS : lecture = ses demandes ou admin ; mise à jour = admin.
-- (Les accès serveur passent par la clé service_role, qui bypass la RLS ; ces
-- politiques protègent les accès client authentifiés.)
drop policy if exists "lecture admin" on demandes;
create policy "demandes : lecture soi ou admin" on demandes
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists "mise a jour admin" on demandes;
create policy "demandes : mise a jour admin" on demandes
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

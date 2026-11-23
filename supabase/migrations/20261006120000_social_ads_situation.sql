-- V1 additive. Ne pas appliquer en production pendant cette livraison.
alter table public.sa_ads drop constraint sa_ads_plateforme_check;
alter table public.sa_ads add constraint sa_ads_plateforme_check check (plateforme in ('facebook','instagram','linkedin','tiktok','youtube'));
alter table public.sa_ads drop constraint sa_ads_ratio_check;
alter table public.sa_ads add constraint sa_ads_ratio_check check (ratio in ('1:1','4:5','1.91:1','9:16','16:9'));
alter table public.sa_ads add column placement text;
alter table public.sa_ads add column type_media text;
alter table public.sa_ads add column variant_status text not null default 'valid' check (variant_status in ('valid','needs_review'));
alter table public.sa_ads add column destination_url text;
alter table public.sa_ads add column creative_ref text;
alter table public.sa_ads add column import_meta jsonb not null default '{}'::jsonb;
alter table public.sa_ads alter column format drop not null;

create function public.sa_valid_variant(p text, l text, m text, r text) returns boolean
language sql immutable set search_path = public as $$
  select coalesce(
    (p in ('facebook','instagram') and l='stories' and m in ('image','video') and r='9:16') or
    (p in ('facebook','instagram') and l='reels' and m='video' and r='9:16') or
    (p='facebook' and l='feed' and ((m in ('image','video') and r in ('1:1','4:5','1.91:1','16:9','9:16')) or (m='carrousel' and r='1:1'))) or
    (p='instagram' and l='feed' and m in ('image','video','carrousel') and r in ('1:1','4:5')) or
    (p='linkedin' and l='feed' and ((m='image' and r in ('1:1','4:5','1.91:1')) or (m='video' and r in ('16:9','1:1','4:5','9:16')) or (m='carrousel' and r='1:1'))) or
    (p='tiktok' and l='in_feed' and m='video' and r='9:16') or
    (p='youtube' and m='video' and ((l='in_stream' and r in ('16:9','9:16','1:1')) or (l='in_feed' and r='16:9') or (l='shorts' and r='9:16'))), false);
$$;

-- Les valeurs sources ambiguës restent intactes, y compris ratio et format.
update public.sa_ads set
  placement = case when plateforme='tiktok' then 'in_feed' when format='story' then 'stories' when format='reel' then 'reels' else 'feed' end,
  type_media = case when format='feed_carrousel' then 'carrousel' when format in ('feed_video','reel') then 'video' when format='story' and jsonb_array_length(medias)>0 and not exists (select 1 from jsonb_array_elements(medias) m where m->>'type'<>'video') then 'video' else 'image' end;
update public.sa_ads set variant_status='needs_review'
where not public.sa_valid_variant(plateforme,placement,type_media,ratio)
   or (format='story' and (jsonb_array_length(medias)=0 or exists(select 1 from jsonb_array_elements(medias) m where m->>'type'='video') and exists(select 1 from jsonb_array_elements(medias) m where m->>'type'<>'video')));
alter table public.sa_ads add constraint sa_ads_variant_check check (variant_status='needs_review' or public.sa_valid_variant(plateforme,placement,type_media,ratio));

create function public.sa_guard_variant() returns trigger language plpgsql set search_path=public as $$
begin
  if new.variant_status='needs_review' and (tg_op='INSERT' or (new.plateforme,new.placement,new.type_media,new.ratio,new.variant_status) is distinct from (old.plateforme,old.placement,old.type_media,old.ratio,old.variant_status)) then
    raise exception 'Les nouvelles variantes doivent être valides';
  end if;
  return new;
end $$;
create trigger sa_ads_guard_variant before insert or update on public.sa_ads for each row execute function public.sa_guard_variant();

create table public.sa_brand_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  logo_url text,
  accounts jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.sa_brand_settings enable row level security;
create policy "sa_brand owner" on public.sa_brand_settings for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create function public.sa_import_campaign(payload jsonb) returns uuid
language plpgsql security invoker set search_path=public as $$
declare pid uuid; a jsonb; uid uuid := auth.uid(); brand public.sa_brand_settings; account jsonb;
begin
  if uid is null then raise exception 'Authentification requise'; end if;
  if jsonb_typeof(payload) is distinct from 'object' or jsonb_typeof(payload->'nom') is distinct from 'string' or length(trim(payload->>'nom'))=0 then raise exception 'Nom de campagne requis'; end if;
  if jsonb_typeof(payload->'ads') is distinct from 'array' then raise exception 'Tableau annonces requis'; end if;
  if jsonb_array_length(payload->'ads') not between 1 and 500 then raise exception 'Import vide ou trop grand'; end if;
  select * into brand from public.sa_brand_settings where user_id=uid;
  insert into public.sa_plans(user_id,nom) values(uid,left(payload->>'nom',200)) returning id into pid;
  for a in select value from jsonb_array_elements(payload->'ads') loop
    if jsonb_typeof(a) is distinct from 'object' then raise exception 'Annonce objet requise'; end if;
    if not public.sa_valid_variant(a->>'plateforme',a->>'placement',a->>'type_media',a->>'ratio') or coalesce(a->>'texte_principal','')='' then raise exception 'Annonce invalide'; end if;
    if jsonb_typeof(a->'medias') is distinct from 'array' then raise exception 'Tableau medias requis'; end if;
    if exists(select 1 from jsonb_array_elements(a->'medias') m where coalesce(m->>'url','')<>'' or m->>'type' is distinct from 'image') then raise exception 'Import: placeholders image uniquement'; end if;
    if a->>'type_media'='carrousel' and jsonb_array_length(a->'medias') not between 2 and 10 then raise exception 'Carrousel 2 à 10 cartes'; end if;
    if coalesce(a->>'destination_url','')<>'' and a->>'destination_url' !~* '^https?://' then raise exception 'URL invalide'; end if;
    account := brand.accounts->(a->>'plateforme');
    insert into public.sa_ads(plan_id,ordre,plateforme,format,placement,type_media,ratio,variant_status,texte_principal,titre,description,cta,destination_url,creative_ref,lien_libelle,medias,import_meta,marque_nom,marque_handle,marque_logo)
    values(pid,(a->>'ordre')::int,a->>'plateforme',case when a->>'plateforme'='youtube' then null else a->>'format' end,a->>'placement',a->>'type_media',a->>'ratio','valid',a->>'texte_principal',a->>'titre',a->>'description',a->>'cta',a->>'destination_url',a->>'creative_ref',a->>'lien_libelle',a->'medias',coalesce(a->'import_meta','{}'),account->>'nom',account->>'handle',brand.logo_url);
  end loop;
  return pid;
end $$;
revoke all on function public.sa_import_campaign(jsonb) from public,anon;
grant execute on function public.sa_import_campaign(jsonb) to authenticated;

-- Contrôle de cohérence même en accès service_role pour la review.
create function public.sa_guard_feedback() returns trigger language plpgsql set search_path=public as $$
begin
  if new.ad_id is not null and not exists(select 1 from public.sa_ads where id=new.ad_id and plan_id=new.plan_id) then raise exception 'Annonce hors plan'; end if;
  return new;
end $$;
create trigger sa_comments_guard before insert or update on public.sa_comments for each row execute function public.sa_guard_feedback();
create trigger sa_approvals_guard before insert or update on public.sa_approvals for each row execute function public.sa_guard_feedback();

create function public.sa_recalculate_plan(pid uuid) returns void language plpgsql security definer set search_path=public as $$
begin
  perform 1 from public.sa_plans where id=pid for update;
  update public.sa_plans set statut=case when exists(select 1 from public.sa_ads where plan_id=pid)
    and not exists(select 1 from public.sa_approvals where plan_id=pid and decision='revision')
    and not exists(select 1 from public.sa_ads a where a.plan_id=pid and not exists(select 1 from public.sa_approvals ap where ap.ad_id=a.id and ap.decision='approuve'))
    then 'approuve' else 'en_revue' end where id=pid and statut<>'brouillon';
end $$;
revoke all on function public.sa_recalculate_plan(uuid) from public,anon,authenticated;
create function public.sa_invalidate_approval() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='UPDATE' and (new.texte_principal,new.titre,new.description,new.cta,new.destination_url,new.medias,new.plateforme,new.placement,new.type_media,new.ratio,new.marque_nom,new.marque_handle,new.marque_logo) is distinct from (old.texte_principal,old.titre,old.description,old.cta,old.destination_url,old.medias,old.plateforme,old.placement,old.type_media,old.ratio,old.marque_nom,old.marque_handle,old.marque_logo) then
    delete from public.sa_approvals where ad_id=new.id;
  end if;
  perform public.sa_recalculate_plan(coalesce(new.plan_id,old.plan_id));
  return coalesce(new,old);
end $$;
create trigger sa_ads_invalidate after insert or update or delete on public.sa_ads for each row execute function public.sa_invalidate_approval();
create function public.sa_approval_status() returns trigger language plpgsql security definer set search_path=public as $$
begin perform public.sa_recalculate_plan(coalesce(new.plan_id,old.plan_id)); return coalesce(new,old); end $$;
create trigger sa_approval_status after insert or update or delete on public.sa_approvals for each row execute function public.sa_approval_status();

-- Le bucket public permet le téléchargement, mais pas list().
create function public.sa_owns_storage_path(path text) returns boolean language sql stable security definer set search_path=public as $$
  select (split_part(path,'/',1)='brands' and split_part(path,'/',2)=auth.uid()::text)
    or (split_part(path,'/',1)='plans' and exists(select 1 from public.sa_plans where id::text=split_part(path,'/',2) and user_id=auth.uid()));
$$;
drop policy "sa_media : upload authentifie" on storage.objects;
drop policy "sa_media : maj authentifie" on storage.objects;
drop policy "sa_media : suppression authentifie" on storage.objects;
create policy "sa_media owner lecture" on storage.objects for select to authenticated using(bucket_id='social-ads' and public.sa_owns_storage_path(name));
create policy "sa_media owner insert" on storage.objects for insert to authenticated with check(bucket_id='social-ads' and public.sa_owns_storage_path(name));
create policy "sa_media owner update" on storage.objects for update to authenticated using(bucket_id='social-ads' and public.sa_owns_storage_path(name)) with check(bucket_id='social-ads' and public.sa_owns_storage_path(name));
create policy "sa_media owner delete" on storage.objects for delete to authenticated using(bucket_id='social-ads' and public.sa_owns_storage_path(name));

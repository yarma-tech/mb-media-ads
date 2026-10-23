create table public.studio_members(id uuid primary key references auth.users(id) on delete cascade,name text not null,role text not null check(role in ('preparer','validator')));
create table public.studio_campaigns(id uuid primary key,revision int not null default 0,document jsonb not null,updated_at timestamptz not null default now());
create table public.studio_brands(id uuid primary key,name text not null check(length(trim(name))>0),logo text not null default '',website text not null default '');
create table public.studio_agents(id uuid primary key default gen_random_uuid(),name text not null,token_hash text unique not null,created_by uuid not null references public.studio_members(id),revoked_at timestamptz);
create table public.studio_locks(ad_id uuid primary key,campaign_id uuid not null references public.studio_campaigns(id) on delete cascade,owner_id text not null,owner_name text not null,token uuid not null,expires_at timestamptz not null);
alter table public.studio_members enable row level security;
alter table public.studio_campaigns enable row level security;
alter table public.studio_brands enable row level security;
alter table public.studio_agents enable row level security;
alter table public.studio_locks enable row level security;
revoke all on public.studio_members,public.studio_campaigns,public.studio_brands,public.studio_agents,public.studio_locks from anon,authenticated;
grant all on public.studio_members,public.studio_campaigns,public.studio_brands,public.studio_agents,public.studio_locks to service_role;
create function public.studio_commit(p_id uuid,p_revision int,p_document jsonb,p_ad uuid default null,p_owner text default null,p_token uuid default null)
returns boolean language plpgsql security invoker set search_path=public as $$
begin
 if p_ad is not null then
  perform 1 from studio_locks where ad_id=p_ad and campaign_id=p_id and owner_id=p_owner and token=p_token and expires_at>now() for update;
  if not found then raise exception 'Edit lock expired or owned by another user'; end if;
 end if;
 update studio_campaigns set document=p_document,revision=(p_document->>'revision')::int,updated_at=now() where id=p_id and revision=p_revision;
 return found;
end $$;
revoke all on function public.studio_commit(uuid,int,jsonb,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.studio_commit(uuid,int,jsonb,uuid,text,uuid) to service_role;
create function public.studio_acquire_lock(p_campaign uuid,p_ad uuid,p_owner text,p_name text,p_token uuid)
returns setof public.studio_locks language sql security invoker set search_path=public as $$
 insert into studio_locks(ad_id,campaign_id,owner_id,owner_name,token,expires_at) values(p_ad,p_campaign,p_owner,p_name,p_token,now()+interval '2 minutes')
 on conflict(ad_id) do update set owner_id=excluded.owner_id,owner_name=excluded.owner_name,token=excluded.token,expires_at=excluded.expires_at
 where studio_locks.expires_at<now() or (studio_locks.owner_id=p_owner and studio_locks.token=p_token) returning *;
$$;
revoke all on function public.studio_acquire_lock(uuid,uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.studio_acquire_lock(uuid,uuid,text,text,uuid) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('studio-media','studio-media',false,200000000,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime']);

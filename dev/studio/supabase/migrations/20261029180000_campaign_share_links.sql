-- Public presentation capabilities. Raw tokens are returned once, never stored.
create table public.studio_share_links (
  campaign_id uuid primary key references public.studio_campaigns(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  status text not null check (status in ('active', 'revoked')),
  created_by uuid not null references public.studio_members(id),
  created_at timestamptz not null default now(),
  revoked_by uuid references public.studio_members(id),
  revoked_at timestamptz,
  check ((status = 'active' and revoked_at is null and revoked_by is null)
    or (status = 'revoked' and revoked_at is not null and revoked_by is not null))
);
alter table public.studio_share_links enable row level security;
revoke all on public.studio_share_links from anon, authenticated;
grant all on public.studio_share_links to service_role;

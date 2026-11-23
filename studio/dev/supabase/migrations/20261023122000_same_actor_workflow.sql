create or replace function public.studio_commit(p_id uuid,p_revision int,p_document jsonb,p_ad uuid default null,p_owner text default null,p_token uuid default null)
returns boolean language plpgsql security invoker set search_path=public as $$
declare previous jsonb; entry jsonb; current_ad jsonb; existing_lock studio_locks;
begin
 select document into previous from studio_campaigns where id=p_id and revision=p_revision for update;
 if not found then return false; end if;
 if p_ad is not null then
  select * into existing_lock from studio_locks where ad_id=p_ad and campaign_id=p_id for update;
  if not found or existing_lock.owner_id is distinct from p_owner or existing_lock.token is distinct from p_token or existing_lock.expires_at<=now() then raise exception 'Edit lock expired or owned by another user'; end if;
 end if;
 for entry in select value from jsonb_array_elements(previous->'ads') loop
  select value into current_ad from jsonb_array_elements(p_document->'ads') where value->>'id'=entry->>'id';
  if current_ad is distinct from entry and (p_ad is null or (entry->>'id')::uuid<>p_ad) then
   perform 1 from studio_locks where ad_id=(entry->>'id')::uuid and expires_at>now() and owner_id is distinct from p_owner for update;
   if found then raise exception 'An advertisement is currently locked'; end if;
  end if;
 end loop;
 update studio_campaigns set document=p_document,revision=(p_document->>'revision')::int,updated_at=now() where id=p_id;
 return true;
end $$;

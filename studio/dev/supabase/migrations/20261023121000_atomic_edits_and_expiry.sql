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
   perform 1 from studio_locks where ad_id=(entry->>'id')::uuid and expires_at>now() for update;
   if found then raise exception 'An advertisement is currently locked'; end if;
  end if;
 end loop;
 update studio_campaigns set document=p_document,revision=(p_document->>'revision')::int,updated_at=now() where id=p_id;
 return true;
end $$;
create extension if not exists pg_cron;
create function public.studio_expire_due_campaigns() returns integer language plpgsql security definer set search_path=public as $$
declare row studio_campaigns; ads jsonb; entry jsonb; events jsonb; total integer=0; ev jsonb;
begin
 for row in select * from studio_campaigns where document->>'status'='active' and nullif(document->>'endDate','') is not null and (now() at time zone 'America/Toronto') >= ((document->>'endDate')::date + time '23:59') for update skip locked loop
  ads='[]'::jsonb;
  for entry in select value from jsonb_array_elements(row.document->'ads') loop
   if entry->>'status'='on_air' then
    ev=jsonb_build_object('id',gen_random_uuid(),'at',now(),'actorId','scheduler','actorName','Fin automatique','action','stopped','before',jsonb_build_object('status','on_air'),'after',jsonb_build_object('status','stopped','reason','campaign_finished'));
    entry=entry||jsonb_build_object('status','stopped','stopReason','campaign_finished','revision',(entry->>'revision')::int+1,'history',coalesce(entry->'history','[]'::jsonb)||jsonb_build_array(ev));
   end if;
   ads=ads||jsonb_build_array(entry);
  end loop;
  ev=jsonb_build_object('id',gen_random_uuid(),'at',now(),'actorId','scheduler','actorName','Fin automatique','action','finished','before',jsonb_build_object('status','active'),'after',jsonb_build_object('status','finished'));
  update studio_campaigns set revision=row.revision+1,updated_at=now(),document=row.document||jsonb_build_object('status','finished','revision',row.revision+1,'ads',ads,'history',coalesce(row.document->'history','[]'::jsonb)||jsonb_build_array(ev)) where id=row.id;
  total=total+1;
 end loop;
 return total;
end $$;
revoke all on function public.studio_expire_due_campaigns() from public,anon,authenticated;
grant execute on function public.studio_expire_due_campaigns() to service_role;
select cron.schedule('studio-expire-campaigns','* * * * *','select public.studio_expire_due_campaigns()');

alter table public.studio_members add column access text not null default 'active' check(access in ('active','revoked'));
create function public.studio_update_member(p_actor uuid,p_member uuid,p_role text,p_access text) returns void language plpgsql security invoker set search_path=public as $$
begin
 perform pg_advisory_xact_lock(1234567891);
 if not exists(select 1 from studio_members where id=p_actor and role='validator' and access='active') then raise exception 'Validator access required'; end if;
 if p_actor=p_member and (p_role<>'validator' or p_access<>'active') then raise exception 'Cannot remove your own validator access'; end if;
 update studio_members set role=p_role,access=p_access where id=p_member;
 if not found then raise exception 'Member not found'; end if;
end $$;
revoke all on function public.studio_update_member(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.studio_update_member(uuid,uuid,text,text) to service_role;
create or replace function public.studio_can_upload(object_name text) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from studio_members where id=auth.uid() and access='active') and exists(select 1 from studio_campaigns c,jsonb_array_elements(c.document->'media') m where c.document->>'status'='active' and m->>'path'=object_name and m->>'state'='uploading');
$$;

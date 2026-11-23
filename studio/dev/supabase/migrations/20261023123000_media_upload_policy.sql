create function public.studio_can_upload(object_name text) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from studio_members where id=auth.uid()) and exists(select 1 from studio_campaigns c,jsonb_array_elements(c.document->'media') m where c.document->>'status'='active' and m->>'path'=object_name and m->>'state'='uploading');
$$;
revoke all on function public.studio_can_upload(text) from public,anon;
grant execute on function public.studio_can_upload(text) to authenticated;
create policy studio_media_insert on storage.objects for insert to authenticated with check(bucket_id='studio-media' and public.studio_can_upload(name));

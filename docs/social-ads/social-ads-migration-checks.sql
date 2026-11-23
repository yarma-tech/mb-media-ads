-- À exécuter uniquement dans une base locale isolée après migration.
select plateforme,placement,type_media,ratio,variant_status,count(*) from public.sa_ads group by 1,2,3,4,5;
select count(*) as variantes_invalides from public.sa_ads where variant_status='valid' and not public.sa_valid_variant(plateforme,placement,type_media,ratio);
select tablename,policyname,roles,cmd,qual,with_check from pg_policies where tablename like 'sa_%' or (schemaname='storage' and policyname like 'sa_media%');
select a.id from public.sa_approvals a left join public.sa_ads d on d.id=a.ad_id and d.plan_id=a.plan_id where d.id is null;
-- Les tests transactionnels à deux comptes, rollback et refus de payloads sont
-- exécutés par le parent dans sa fixture auth/storage locale, sans production.

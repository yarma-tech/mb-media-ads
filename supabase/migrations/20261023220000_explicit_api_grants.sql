-- Explicit API privileges for new Supabase projects. Existing RLS remains mandatory.
grant select, insert, update, delete on public.sa_plans, public.sa_ads,
  public.sa_share_links, public.sa_comments, public.sa_brand_settings to authenticated;
grant select on public.sa_approvals to authenticated;
grant all on public.sa_plans, public.sa_ads, public.sa_share_links,
  public.sa_comments, public.sa_approvals, public.sa_brand_settings to service_role;

-- Public catalogue, private profiles and campaign requests use their existing policies.
grant select on public.plateformes, public.model_coefficients to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (nom_entreprise, secteur, type_entreprise, score_historique_marque)
  on public.profiles to authenticated;
grant select, insert, update on public.demandes to authenticated;
grant all on public.plateformes, public.model_coefficients, public.profiles,
  public.demandes to service_role;

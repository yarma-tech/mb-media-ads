-- Durcissement : les fonctions SECURITY DEFINER de l'auth ne doivent pas être
-- exposées en RPC public (advisor 0028/0029). Le trigger handle_new_user n'a pas
-- besoin d'EXECUTE accordé au rôle appelant ; is_admin n'est requis que pour les
-- politiques RLS évaluées par le rôle authenticated.
-- Supabase accorde EXECUTE directement à anon/authenticated (pas seulement via PUBLIC),
-- donc on révoque explicitement ces rôles.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

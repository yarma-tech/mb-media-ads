import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Vrai dès que l'URL + la clé anon sont fournies (sinon : catalogue local de secours).
export const supabaseConfigured = Boolean(url && anon);

let browserClient: SupabaseClient | null = null;
export function getBrowserClient(): SupabaseClient | null {
  if (!url || !anon) return null;
  if (!browserClient) browserClient = createClient(url, anon);
  return browserClient;
}

// Clé service_role : serveur uniquement (lecture/écriture admin, bypass RLS).
export function getAdminClient(): SupabaseClient | null {
  if (!url || !service) return null;
  return createClient(url, service, { auth: { persistSession: false } });
}

// Client utilisable côté serveur : service_role si dispo, sinon anon (lecture publique).
export function getServerClient(): SupabaseClient | null {
  return getAdminClient() ?? getBrowserClient();
}

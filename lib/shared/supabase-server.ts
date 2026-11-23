// Client Supabase côté serveur (SSR, session par cookies) — pour l'auth dans les
// Server Components, Server Actions et route handlers. Distinct de lib/supabase.ts
// (clé service_role, bypass RLS) qui sert la lecture/écriture admin du catalogue et
// des demandes.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const authConfigured = Boolean(url && anon);

export async function createServerSupabase(): Promise<SupabaseClient> {
  if (!url || !anon) throw new Error("Supabase non configuré (URL/clé anon manquante).");
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : sans effet, le proxy rafraîchit la session.
        }
      },
    },
  });
}

export async function getUser(): Promise<User | null> {
  if (!authConfigured) return null;
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  return user;
}

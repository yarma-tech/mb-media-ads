"use server";

import { redirect } from "next/navigation";
import { SECTEURS, TYPES_ENTREPRISE, type Secteur, type TypeEntreprise } from "./enums";
import { createServerSupabase } from "./supabase-server";

export type AuthState = { error?: string; message?: string };

function safeNext(next: unknown): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") ? n : "/campagne";
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!email || !password) return { error: "Email et mot de passe requis." };

  const sb = await createServerSupabase();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email ou mot de passe incorrect." };

  redirect(next);
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nomEntreprise = String(formData.get("nomEntreprise") ?? "").trim();
  const secteur = String(formData.get("secteur") ?? "") as Secteur;
  const typeEntreprise = String(formData.get("typeEntreprise") ?? "") as TypeEntreprise;

  if (!email || !password || !nomEntreprise) return { error: "Tous les champs sont requis." };
  if (password.length < 8) return { error: "Le mot de passe doit faire au moins 8 caractères." };
  if (!SECTEURS.includes(secteur)) return { error: "Secteur invalide." };
  if (!TYPES_ENTREPRISE.includes(typeEntreprise)) return { error: "Type d'entreprise invalide." };

  const sb = await createServerSupabase();
  // Les infos entreprise sont stockées dans user_metadata ; un trigger crée la ligne
  // `profiles` correspondante (voir migration auth_profiles).
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { nom_entreprise: nomEntreprise, secteur, type_entreprise: typeEntreprise },
    },
  });
  if (error) return { error: error.message };

  // Si la confirmation par email est activée, aucune session n'est créée tout de suite.
  if (!data.session) {
    return { message: "Compte créé. Vérifiez votre boîte mail pour confirmer, puis connectez-vous." };
  }

  redirect("/campagne");
}

export async function signOutAction(): Promise<void> {
  const sb = await createServerSupabase();
  await sb.auth.signOut();
  redirect("/");
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createPlan,
  deleteAd,
  ensureShareLink,
  insertAd,
  resolveComment,
  setPlanStatut,
  updateAd,
} from "@/lib/social-ads/db";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  genererToken,
  getAllowedRatios,
  type Ad,
  type Format,
  type Media,
  type Plateforme,
} from "@/lib/social-ads/types";

// Créer un plan puis rediriger vers son éditeur.
export async function createPlanAction(formData: FormData): Promise<void> {
  const nom = String(formData.get("nom") ?? "").trim();
  const clientNom = String(formData.get("client_nom") ?? "").trim() || null;
  if (!nom) return;
  const id = await createPlan(nom, clientNom);
  if (id) redirect(`/social/${id}`);
}

export async function addAdAction(
  planId: string,
  plateforme: Plateforme,
  format: Format,
): Promise<Ad | null> {
  const ratio = getAllowedRatios(plateforme, format)[0];
  const ad = await insertAd(planId, { plateforme, format, ratio });
  revalidatePath(`/social/${planId}`);
  return ad;
}

export type AdPatch = Partial<
  Pick<
    Ad,
    | "plateforme"
    | "format"
    | "ratio"
    | "marque_nom"
    | "marque_handle"
    | "marque_logo"
    | "texte_principal"
    | "titre"
    | "description"
    | "cta"
    | "lien_libelle"
    | "medias"
  >
>;

export async function updateAdAction(planId: string, adId: string, patch: AdPatch): Promise<boolean> {
  const ok = await updateAd(adId, patch);
  revalidatePath(`/social/${planId}`);
  return ok;
}

export async function deleteAdAction(planId: string, adId: string): Promise<boolean> {
  const ok = await deleteAd(adId);
  revalidatePath(`/social/${planId}`);
  return ok;
}

export async function createShareAction(planId: string): Promise<{ token: string } | { error: string }> {
  const link = await ensureShareLink(planId, genererToken());
  if (!link) return { error: "Impossible de créer le lien (Supabase configuré ?)." };
  await setPlanStatut(planId, "en_revue");
  revalidatePath(`/social/${planId}`);
  return { token: link.token };
}

export async function resolveCommentAction(
  planId: string,
  commentId: string,
  resolu: boolean,
): Promise<boolean> {
  const ok = await resolveComment(commentId, resolu);
  revalidatePath(`/social/${planId}`);
  return ok;
}

// Crée une URL d'upload signée pour le bucket public `social-ads`. Le fichier est
// ensuite envoyé DIRECTEMENT depuis le navigateur (uploadToSignedUrl) — il ne
// transite pas par le serveur Next, ce qui lève la limite ~1 Mo des Server Actions
// et permet les vidéos lourdes (plafond = limite du bucket / du projet Supabase).
export async function createUploadUrlAction(
  planId: string,
  filename: string,
  contentType: string,
): Promise<{ path: string; token: string; publicUrl: string; type: Media["type"] } | { error: string }> {
  const sb = await createServerSupabase();
  const ext = (filename.split(".").pop() || "bin").toLowerCase();
  const path = `plans/${planId}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await sb.storage.from("social-ads").createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "URL d'upload indisponible." };
  const { data: pub } = sb.storage.from("social-ads").getPublicUrl(path);
  const type: Media["type"] = contentType.startsWith("video")
    ? "video"
    : ext === "gif"
      ? "gif"
      : "image";
  return { path, token: data.token, publicUrl: pub.publicUrl, type };
}

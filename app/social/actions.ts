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
  ownedPlan,
  getPlanForOwner,
  type BrandSettings,
} from "@/lib/social-ads/db";
import { createServerSupabase } from "@/lib/supabase-server";
import { buildMediaManifest } from "@/lib/social-ads/manifest";
import {
  genererToken,
  PLATEFORMES,
  FORMATS,
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
  if (!PLATEFORMES.includes(plateforme) || !FORMATS.includes(format))
    return null;
  if (
    (plateforme === "tiktok" && format !== "reel") ||
    (plateforme === "youtube" && !["feed_video", "reel"].includes(format))
  )
    return null;
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
    | "placement"
    | "type_media"
    | "destination_url"
    | "creative_ref"
  >
>;

export async function updateAdAction(
  planId: string,
  adId: string,
  patch: AdPatch,
): Promise<boolean> {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return false;
  const detail = await getPlanForOwner(planId);
  if (!detail?.ads.some((a) => a.id === adId)) return false;
  if (
    patch.medias &&
    (!Array.isArray(patch.medias) ||
      patch.medias.length > 10 ||
      (
        await Promise.all(
          patch.medias.map(
            async (m) =>
              !m ||
              !["image", "gif"].includes(m.type) ||
              typeof m.url !== "string" ||
              (m.url !== "" &&
                !(await validStorageUrl(m.url, `plans/${planId}/`))) ||
              Object.keys(m).some(
                (k) =>
                  ![
                    "type",
                    "url",
                    "creative_ref",
                    "titre",
                    "description",
                    "largeur",
                    "hauteur",
                  ].includes(k),
              ),
          ),
        )
      ).some(Boolean))
  )
    return false;
  if (
    patch.marque_logo &&
    !(await validStorageUrl(patch.marque_logo, `plans/${planId}/`))
  )
    return false;
  const ok = await updateAd(adId, patch);
  revalidatePath(`/social/${planId}`);
  return ok;
}

export async function updateTextAction(
  planId: string,
  adId: string,
  patch: import("@/lib/social-ads/review").EditableAdText,
): Promise<Ad | null> {
  const { TEXT_FIELDS } = await import("@/lib/social-ads/review");
  if (
    !patch ||
    Object.keys(patch).some(
      (k) => !TEXT_FIELDS.includes(k as (typeof TEXT_FIELDS)[number]),
    )
  )
    return null;
  if (!(await updateAdAction(planId, adId, patch))) return null;
  return (
    (await getPlanForOwner(planId))?.ads.find((a) => a.id === adId) || null
  );
}

export async function deleteAdAction(
  planId: string,
  adId: string,
): Promise<boolean> {
  const detail = await getPlanForOwner(planId);
  if (!detail?.ads.some((a) => a.id === adId)) return false;
  const ok = await deleteAd(adId);
  revalidatePath(`/social/${planId}`);
  return ok;
}

export async function createShareAction(
  planId: string,
): Promise<{ token: string } | { error: string }> {
  if (!(await ownedPlan(planId))) return { error: "Plan inaccessible." };
  const link = await ensureShareLink(planId, genererToken());
  if (!link)
    return { error: "Impossible de créer le lien (Supabase configuré ?)." };
  await setPlanStatut(planId, "en_revue");
  revalidatePath(`/social/${planId}`);
  return { token: link.token };
}

export async function resolveCommentAction(
  planId: string,
  commentId: string,
  resolu: boolean,
): Promise<boolean> {
  const detail = await getPlanForOwner(planId);
  if (!detail?.comments.some((c) => c.id === commentId)) return false;
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
  size: number,
): Promise<
  | { path: string; token: string; publicUrl: string; type: Media["type"] }
  | { error: string }
> {
  const sb = await createServerSupabase();
  if (!(await ownedPlan(planId))) return { error: "Plan inaccessible." };
  if (!isImageUpload(filename, contentType, size))
    return { error: "Image JPG, PNG, WebP ou GIF requise, maximum 50 Mo." };
  const ext = (filename.split(".").pop() || "bin").toLowerCase();
  const path = `plans/${planId}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await sb.storage
    .from("social-ads")
    .createSignedUploadUrl(path);
  if (error || !data)
    return { error: error?.message ?? "URL d'upload indisponible." };
  const { data: pub } = sb.storage.from("social-ads").getPublicUrl(path);
  const type: Media["type"] = contentType.startsWith("video")
    ? "video"
    : ext === "gif"
      ? "gif"
      : "image";
  return { path, token: data.token, publicUrl: pub.publicUrl, type };
}

function isImageUpload(filename: string, mime: string, size: number) {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
  };
  return (
    !!ext &&
    types[ext] === mime &&
    Number.isFinite(size) &&
    size >= 0 &&
    size <= 50 * 1024 * 1024
  );
}

export async function saveBrandAction(
  settings: BrandSettings,
): Promise<boolean> {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (
    !user ||
    !settings ||
    Object.keys(settings).some((k) => !["logo_url", "accounts"].includes(k))
  )
    return false;
  const { PLATEFORMES } = await import("@/lib/social-ads/types");
  if (
    !settings.accounts ||
    Object.entries(settings.accounts).some(
      ([p, a]) =>
        !PLATEFORMES.includes(p as Plateforme) ||
        !a ||
        Object.keys(a).some((k) => !["nom", "handle"].includes(k)) ||
        typeof a.nom !== "string" ||
        typeof a.handle !== "string" ||
        a.nom.length > 120 ||
        a.handle.length > 120,
    )
  )
    return false;
  if (
    settings.logo_url &&
    !(await validStorageUrl(settings.logo_url, `brands/${user.id}/`))
  )
    return false;
  const { error } = await sb
    .from("sa_brand_settings")
    .upsert({ user_id: user.id, ...settings });
  revalidatePath("/social/parametrage");
  return !error;
}

export async function createBrandUploadAction(
  filename: string,
  contentType: string,
  size: number,
) {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user || !isImageUpload(filename, contentType, size))
    return { error: "Image invalide ou session absente." };
  const path = `brands/${user.id}/${crypto.randomUUID()}.${filename.split(".").pop()!.toLowerCase()}`;
  const { data, error } = await sb.storage
    .from("social-ads")
    .createSignedUploadUrl(path);
  if (!data || error) return { error: "Upload indisponible." };
  return {
    path,
    token: data.token,
    publicUrl: sb.storage.from("social-ads").getPublicUrl(path).data.publicUrl,
  };
}

async function validStorageUrl(url: string, prefix: string): Promise<boolean> {
  if (typeof url !== "string") return false;
  const sb = await createServerSupabase();
  const base = sb.storage.from("social-ads").getPublicUrl(prefix)
    .data.publicUrl;
  if (!url.startsWith(base) || /\.\.|%2f|%2e/i.test(url)) return false;
  const filename = url.slice(base.length);
  if (!/^[a-f0-9-]+\.(jpg|jpeg|png|gif|webp)$/.test(filename)) return false;
  const { data } = await sb.storage
    .from("social-ads")
    .list(prefix.replace(/\/$/, ""), { search: filename });
  return !!data?.some(
    (f) =>
      f.name === filename &&
      Number(f.metadata?.size) <= 50 * 1024 * 1024 &&
      ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        f.metadata?.mimetype || "",
      ),
  );
}

export async function attachMediaAction(
  planId: string,
  slotKey: string,
  storagePath: string,
): Promise<boolean> {
  const detail = await getPlanForOwner(planId);
  if (!detail || !storagePath.startsWith(`plans/${planId}/`)) return false;
  const slot = buildMediaManifest(detail.ads).find((s) => s.key === slotKey);
  if (!slot) return false;
  const sb = await createServerSupabase();
  const url = sb.storage.from("social-ads").getPublicUrl(storagePath)
    .data.publicUrl;
  if (!(await validStorageUrl(url, `plans/${planId}/`))) return false;
  for (const ad of detail.ads.filter((a) =>
    slot.destinations.some((d) => d.adId === a.id),
  )) {
    const medias = ad.medias.map((m) => ({ ...m }));
    for (const dest of slot.destinations.filter((d) => d.adId === ad.id)) {
      if (dest.cardIndex === null)
        medias.splice(0, medias.length, { type: "image", url });
      else
        medias[dest.cardIndex] = {
          ...medias[dest.cardIndex],
          type: "image",
          url,
        };
    }
    if (!(await updateAd(ad.id, { medias }))) return false;
  }
  revalidatePath(`/social/${planId}`);
  return true;
}

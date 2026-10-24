// Module Social Ads — accès aux données.
//
// Deux chemins :
//   • OWNER : `createServerSupabase()` (session cookie + RLS). Le partenaire ne
//     touche que ses propres plans, la RLS le garantit.
//   • REVIEW (lien public) : `getAdminClient()` (service_role, bypass RLS) après
//     validation du TOKEN côté serveur. Le destinataire anonyme n'a jamais de
//     client Supabase — tout passe par ces fonctions.
import "server-only";
import { getAdminClient } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";
import type { Ad, Approval, Comment, Decision, Plan, ShareLink } from "./types";
import {
  legacyFormat,
  legacyVariant,
  parseVariant,
  getVariantSpec,
  variantOf,
} from "./specs";
import { convertLegacyAd } from "./legacy";
import { TEXT_FIELDS, type EditableAdText } from "./review";
import type { ImportResult } from "./import";

export type BrandSettings = {
  logo_url: string | null;
  accounts: Partial<Record<Ad["plateforme"], { nom: string; handle: string }>>;
};
export async function getBrandSettings(): Promise<BrandSettings | null> {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb
    .from("sa_brand_settings")
    .select("logo_url,accounts")
    .eq("user_id", user.id)
    .maybeSingle();
  return data as BrandSettings | null;
}
export async function persistImportedPlan(
  imported: ImportResult,
): Promise<string | null> {
  const sb = await createServerSupabase();
  const { data, error } = await sb.rpc("sa_import_campaign", {
    payload: { nom: imported.nom, ads: imported.ads },
  });
  return error ? null : (data as string);
}

export async function ownedPlan(planId: string): Promise<boolean> {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return false;
  const { data } = await sb
    .from("sa_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

export function validateText(patch: EditableAdText, ad: Ad): boolean {
  if (
    !patch ||
    Array.isArray(patch) ||
    typeof patch !== "object" ||
    Object.keys(patch).some(
      (k) => !TEXT_FIELDS.includes(k as (typeof TEXT_FIELDS)[number]),
    )
  )
    return false;
  let spec;
  try {
    spec = getVariantSpec(variantOf(ad));
  } catch {
    return false;
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v !== null && typeof v !== "string") return false;
    const value = v || "";
    const max =
      k === "texte_principal"
        ? spec.hardLimits.text
        : k === "titre"
          ? spec.hardLimits.title
          : k === "description"
            ? spec.hardLimits.description
            : k === "cta"
              ? 80
              : 2048;
    if (max !== null && value.length > max) return false;
    if (k === "destination_url" && value && !/^https?:\/\//i.test(value))
      return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// OWNER
// ---------------------------------------------------------------------------

export async function listPlans(): Promise<Plan[]> {
  const sb = await createServerSupabase();
  const { data } = await sb
    .from("sa_plans")
    .select("*")
    .order("updated_at", { ascending: false });
  return (data as Plan[]) ?? [];
}

export async function createPlan(
  nom: string,
  clientNom: string | null,
): Promise<string | null> {
  const sb = await createServerSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data, error } = await sb
    .from("sa_plans")
    .insert({ user_id: user.id, nom, client_nom: clientNom })
    .select("id")
    .single();
  if (error) return null;
  return (data as { id: string }).id;
}

export type PlanDetail = {
  plan: Plan;
  ads: Ad[];
  share: ShareLink | null;
  comments: Comment[];
  approvals: Approval[];
};

export async function getPlanForOwner(
  planId: string,
): Promise<PlanDetail | null> {
  const sb = await createServerSupabase();
  const { data: plan } = await sb
    .from("sa_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();
  if (!plan) return null;

  const [ads, share, comments, approvals] = await Promise.all([
    sb
      .from("sa_ads")
      .select("*")
      .eq("plan_id", planId)
      .order("ordre", { ascending: true }),
    sb
      .from("sa_share_links")
      .select("*")
      .eq("plan_id", planId)
      .eq("actif", true)
      .maybeSingle(),
    sb
      .from("sa_comments")
      .select("*")
      .eq("plan_id", planId)
      .order("created_at", { ascending: true }),
    sb.from("sa_approvals").select("*").eq("plan_id", planId),
  ]);

  return {
    plan: plan as Plan,
    ads: ((ads.data as Ad[]) ?? []).map((a) => {
      const r = convertLegacyAd(a);
      return { ...r.ad, format: r.ad.format || legacyFormat(variantOf(r.ad)) };
    }),
    share: (share.data as ShareLink | null) ?? null,
    comments: (comments.data as Comment[]) ?? [],
    approvals: (approvals.data as Approval[]) ?? [],
  };
}

export async function insertAd(
  planId: string,
  partial: Partial<Ad>,
): Promise<Ad | null> {
  if (!(await ownedPlan(planId))) return null;
  const sb = await createServerSupabase();
  const variant = parseVariant(
    partial.placement
      ? partial
      : legacyVariant(
          partial.plateforme || "facebook",
          partial.format || "feed_image",
          partial.ratio,
        ),
  );
  if (variant.status === "invalid") return null;
  const brand = await getBrandSettings();
  const account = brand?.accounts[variant.variant.plateforme];
  // Place la nouvelle annonce en fin de liste.
  const { data: last } = await sb
    .from("sa_ads")
    .select("ordre")
    .eq("plan_id", planId)
    .order("ordre", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordre = last ? (last as { ordre: number }).ordre + 1 : 0;
  const { data, error } = await sb
    .from("sa_ads")
    .insert({
      plan_id: planId,
      ordre,
      ...sanitizeAd(partial),
      ...variant.variant,
      variant_status: "valid",
      format:
        variant.variant.plateforme === "youtube"
          ? null
          : legacyFormat(variant.variant),
      marque_nom: partial.marque_nom || account?.nom || null,
      marque_handle: partial.marque_handle || account?.handle || null,
      marque_logo: partial.marque_logo || brand?.logo_url || null,
    })
    .select("*")
    .single();
  if (error) return null;
  return data as Ad;
}

export async function updateAd(
  adId: string,
  partial: Partial<Ad>,
): Promise<boolean> {
  const sb = await createServerSupabase();
  const { data: existing } = await sb
    .from("sa_ads")
    .select("*")
    .eq("id", adId)
    .maybeSingle();
  if (!existing || !(await ownedPlan(existing.plan_id))) return false;
  const clean = sanitizeAd(partial);
  if (Object.keys(clean).length !== Object.keys(partial).length) return false;
  const merged = { ...existing, ...partial } as Ad;
  for (const k of [
    "marque_nom",
    "marque_handle",
    "creative_ref",
    "lien_libelle",
  ] as const) {
    if (
      k in partial &&
      partial[k] !== null &&
      (typeof partial[k] !== "string" || partial[k]!.length > 500)
    )
      return false;
  }
  if (partial.format && !partial.placement)
    Object.assign(
      merged,
      legacyVariant(
        merged.plateforme,
        partial.format,
        partial.ratio || merged.ratio,
      ),
    );
  const variant = parseVariant(merged);
  if (variant.status === "invalid") return false;
  const texts = Object.fromEntries(
    Object.entries(partial).filter(([k]) =>
      TEXT_FIELDS.includes(k as (typeof TEXT_FIELDS)[number]),
    ),
  ) as EditableAdText;
  if (!validateText(texts, merged)) return false;
  const { error } = await sb
    .from("sa_ads")
    .update({
      ...clean,
      ...variant.variant,
      variant_status: "valid",
      format:
        merged.plateforme === "youtube" ? null : legacyFormat(variant.variant),
    })
    .eq("id", adId)
    .eq("plan_id", existing.plan_id);
  return !error;
}

export async function deleteAd(adId: string): Promise<boolean> {
  const sb = await createServerSupabase();
  const { error } = await sb.from("sa_ads").delete().eq("id", adId);
  return !error;
}

export async function setPlanStatut(
  planId: string,
  statut: Plan["statut"],
): Promise<boolean> {
  const sb = await createServerSupabase();
  const { error } = await sb
    .from("sa_plans")
    .update({ statut })
    .eq("id", planId);
  return !error;
}

export async function resolveComment(
  commentId: string,
  resolu: boolean,
): Promise<boolean> {
  const sb = await createServerSupabase();
  const { error } = await sb
    .from("sa_comments")
    .update({ resolu })
    .eq("id", commentId);
  return !error;
}

// N'autorise que les colonnes éditables (jamais id/plan_id/timestamps).
function sanitizeAd(p: Partial<Ad>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const keys: (keyof Ad)[] = [
    "plateforme",
    "format",
    "ratio",
    "marque_nom",
    "marque_handle",
    "marque_logo",
    "texte_principal",
    "titre",
    "description",
    "cta",
    "lien_libelle",
    "medias",
    "placement",
    "type_media",
    "destination_url",
    "creative_ref",
  ];
  for (const k of keys) if (k in p) out[k] = p[k];
  return out;
}

// ---------------------------------------------------------------------------
// LIENS DE PARTAGE (owner)
// ---------------------------------------------------------------------------

// Renvoie le lien actif du plan, en le créant si besoin.
export async function ensureShareLink(
  planId: string,
  token: string,
): Promise<ShareLink | null> {
  const sb = await createServerSupabase();
  const { data: existing } = await sb
    .from("sa_share_links")
    .select("*")
    .eq("plan_id", planId)
    .eq("actif", true)
    .maybeSingle();
  if (existing) return existing as ShareLink;
  const { data, error } = await sb
    .from("sa_share_links")
    .insert({ plan_id: planId, token })
    .select("*")
    .single();
  if (error) return null;
  return data as ShareLink;
}

// ---------------------------------------------------------------------------
// REVIEW (lien public, service_role, token-validé)
// ---------------------------------------------------------------------------

export type ReviewData = {
  plan: Pick<Plan, "id" | "nom" | "client_nom" | "statut">;
  ads: Ad[];
  comments: Comment[];
  approvals: Approval[];
};

async function planIdFromToken(token: string): Promise<string | null> {
  if (typeof token !== "string" || !/^[a-zA-Z0-9_-]{16,128}$/.test(token))
    return null;
  const admin = getAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("sa_share_links")
    .select("plan_id, actif, expire_le")
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  const link = data as {
    plan_id: string;
    actif: boolean;
    expire_le: string | null;
  };
  if (!link.actif) return null;
  if (link.expire_le && new Date(link.expire_le).getTime() < Date.now())
    return null;
  return link.plan_id;
}

export async function getReviewByToken(
  token: string,
): Promise<ReviewData | null> {
  const admin = getAdminClient();
  if (!admin) return null;
  const planId = await planIdFromToken(token);
  if (!planId) return null;

  const [plan, ads, comments, approvals] = await Promise.all([
    admin
      .from("sa_plans")
      .select("id, nom, client_nom, statut")
      .eq("id", planId)
      .single(),
    admin
      .from("sa_ads")
      .select("*")
      .eq("plan_id", planId)
      .order("ordre", { ascending: true }),
    admin
      .from("sa_comments")
      .select("*")
      .eq("plan_id", planId)
      .order("created_at", { ascending: true }),
    admin.from("sa_approvals").select("*").eq("plan_id", planId),
  ]);
  if (!plan.data) return null;

  return {
    plan: plan.data as ReviewData["plan"],
    ads: ((ads.data as Ad[]) ?? []).map((a) => {
      const r = convertLegacyAd(a);
      return { ...r.ad, format: r.ad.format || legacyFormat(variantOf(r.ad)) };
    }),
    comments: (comments.data as Comment[]) ?? [],
    approvals: (approvals.data as Approval[]) ?? [],
  };
}

export async function addPublicComment(
  token: string,
  adId: string | null,
  auteur: string,
  corps: string,
): Promise<boolean> {
  const admin = getAdminClient();
  if (!admin) return false;
  const planId = await planIdFromToken(token);
  if (!planId) return false;
  // Si adId fourni, vérifier qu'il appartient bien au plan (anti-injection d'id).
  if (adId) {
    const { data } = await admin
      .from("sa_ads")
      .select("id")
      .eq("id", adId)
      .eq("plan_id", planId)
      .maybeSingle();
    if (!data) return false;
  }
  const { error } = await admin.from("sa_comments").insert({
    plan_id: planId,
    ad_id: adId,
    auteur: auteur.slice(0, 80) || "Invité",
    corps: corps.slice(0, 2000),
  });
  return !error;
}

export async function setPublicApproval(
  token: string,
  adId: string,
  relecteur: string,
  decision: Decision,
): Promise<boolean> {
  if (!["approuve", "revision"].includes(decision)) return false;
  const admin = getAdminClient();
  if (!admin) return false;
  const planId = await planIdFromToken(token);
  if (!planId) return false;
  const { data: ad } = await admin
    .from("sa_ads")
    .select("id")
    .eq("id", adId)
    .eq("plan_id", planId)
    .maybeSingle();
  if (!ad) return false;

  const { error } = await admin.from("sa_approvals").upsert(
    {
      plan_id: planId,
      ad_id: adId,
      relecteur: relecteur.slice(0, 80) || "Invité",
      decision,
    },
    { onConflict: "ad_id,relecteur" },
  );
  if (error) return false;

  // Le trigger SQL recalcule le statut dans la transaction de décision.
  return true;
}

export async function editPublicAd(
  token: string,
  adId: string,
  patch: EditableAdText,
): Promise<Ad | null> {
  const planId = await planIdFromToken(token);
  const admin = getAdminClient();
  if (!planId || !admin) return null;
  const { data } = await admin
    .from("sa_ads")
    .select("*")
    .eq("id", adId)
    .eq("plan_id", planId)
    .maybeSingle();
  if (!data || !validateText(patch, data as Ad)) return null;
  const { data: updated, error } = await admin
    .from("sa_ads")
    .update(patch)
    .eq("id", adId)
    .eq("plan_id", planId)
    .select("*")
    .single();
  return error ? null : (updated as Ad);
}

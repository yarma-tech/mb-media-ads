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

// ---------------------------------------------------------------------------
// OWNER
// ---------------------------------------------------------------------------

export async function listPlans(): Promise<Plan[]> {
  const sb = await createServerSupabase();
  const { data } = await sb.from("sa_plans").select("*").order("updated_at", { ascending: false });
  return (data as Plan[]) ?? [];
}

export async function createPlan(nom: string, clientNom: string | null): Promise<string | null> {
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

export async function getPlanForOwner(planId: string): Promise<PlanDetail | null> {
  const sb = await createServerSupabase();
  const { data: plan } = await sb.from("sa_plans").select("*").eq("id", planId).maybeSingle();
  if (!plan) return null;

  const [ads, share, comments, approvals] = await Promise.all([
    sb.from("sa_ads").select("*").eq("plan_id", planId).order("ordre", { ascending: true }),
    sb.from("sa_share_links").select("*").eq("plan_id", planId).eq("actif", true).maybeSingle(),
    sb.from("sa_comments").select("*").eq("plan_id", planId).order("created_at", { ascending: true }),
    sb.from("sa_approvals").select("*").eq("plan_id", planId),
  ]);

  return {
    plan: plan as Plan,
    ads: (ads.data as Ad[]) ?? [],
    share: (share.data as ShareLink | null) ?? null,
    comments: (comments.data as Comment[]) ?? [],
    approvals: (approvals.data as Approval[]) ?? [],
  };
}

export async function insertAd(planId: string, partial: Partial<Ad>): Promise<Ad | null> {
  const sb = await createServerSupabase();
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
    .insert({ plan_id: planId, ordre, ...sanitizeAd(partial) })
    .select("*")
    .single();
  if (error) return null;
  return data as Ad;
}

export async function updateAd(adId: string, partial: Partial<Ad>): Promise<boolean> {
  const sb = await createServerSupabase();
  const { error } = await sb.from("sa_ads").update(sanitizeAd(partial)).eq("id", adId);
  return !error;
}

export async function deleteAd(adId: string): Promise<boolean> {
  const sb = await createServerSupabase();
  const { error } = await sb.from("sa_ads").delete().eq("id", adId);
  return !error;
}

export async function setPlanStatut(planId: string, statut: Plan["statut"]): Promise<boolean> {
  const sb = await createServerSupabase();
  const { error } = await sb.from("sa_plans").update({ statut }).eq("id", planId);
  return !error;
}

export async function resolveComment(commentId: string, resolu: boolean): Promise<boolean> {
  const sb = await createServerSupabase();
  const { error } = await sb.from("sa_comments").update({ resolu }).eq("id", commentId);
  return !error;
}

// N'autorise que les colonnes éditables (jamais id/plan_id/timestamps).
function sanitizeAd(p: Partial<Ad>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const keys: (keyof Ad)[] = [
    "plateforme",
    "format",
    "ratio",
    "ordre",
    "marque_nom",
    "marque_handle",
    "marque_logo",
    "texte_principal",
    "titre",
    "description",
    "cta",
    "lien_libelle",
    "medias",
  ];
  for (const k of keys) if (k in p) out[k] = p[k];
  return out;
}

// ---------------------------------------------------------------------------
// LIENS DE PARTAGE (owner)
// ---------------------------------------------------------------------------

// Renvoie le lien actif du plan, en le créant si besoin.
export async function ensureShareLink(planId: string, token: string): Promise<ShareLink | null> {
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
  const admin = getAdminClient();
  if (!admin) return null;
  const { data } = await admin
    .from("sa_share_links")
    .select("plan_id, actif, expire_le")
    .eq("token", token)
    .maybeSingle();
  if (!data) return null;
  const link = data as { plan_id: string; actif: boolean; expire_le: string | null };
  if (!link.actif) return null;
  if (link.expire_le && new Date(link.expire_le).getTime() < Date.now()) return null;
  return link.plan_id;
}

export async function getReviewByToken(token: string): Promise<ReviewData | null> {
  const admin = getAdminClient();
  if (!admin) return null;
  const planId = await planIdFromToken(token);
  if (!planId) return null;

  const [plan, ads, comments, approvals] = await Promise.all([
    admin.from("sa_plans").select("id, nom, client_nom, statut").eq("id", planId).single(),
    admin.from("sa_ads").select("*").eq("plan_id", planId).order("ordre", { ascending: true }),
    admin.from("sa_comments").select("*").eq("plan_id", planId).order("created_at", { ascending: true }),
    admin.from("sa_approvals").select("*").eq("plan_id", planId),
  ]);
  if (!plan.data) return null;

  return {
    plan: plan.data as ReviewData["plan"],
    ads: (ads.data as Ad[]) ?? [],
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
    const { data } = await admin.from("sa_ads").select("id").eq("id", adId).eq("plan_id", planId).maybeSingle();
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

  // Met à jour le statut du plan : approuvé si toutes les annonces le sont.
  await refreshPlanStatut(planId);
  return true;
}

// Recalcule le statut du plan à partir des décisions (service_role).
async function refreshPlanStatut(planId: string): Promise<void> {
  const admin = getAdminClient();
  if (!admin) return;
  const [{ data: ads }, { data: approvals }] = await Promise.all([
    admin.from("sa_ads").select("id").eq("plan_id", planId),
    admin.from("sa_approvals").select("ad_id, decision").eq("plan_id", planId),
  ]);
  const adIds = ((ads as { id: string }[]) ?? []).map((a) => a.id);
  if (adIds.length === 0) return;
  const approuves = new Set(
    ((approvals as { ad_id: string; decision: Decision }[]) ?? [])
      .filter((a) => a.decision === "approuve")
      .map((a) => a.ad_id),
  );
  const toutApprouve = adIds.every((id) => approuves.has(id));
  await admin
    .from("sa_plans")
    .update({ statut: toutApprouve ? "approuve" : "en_revue" })
    .eq("id", planId);
}

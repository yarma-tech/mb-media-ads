"use server";

import { revalidatePath } from "next/cache";
import { addPublicComment, setPublicApproval } from "@/lib/social-ads/db";
import type { Decision } from "@/lib/social-ads/types";

// Actions de la page publique de validation : aucune authentification.
// La sécurité repose sur le TOKEN, validé côté serveur dans lib/social-ads/db.

export async function submitCommentAction(
  token: string,
  adId: string | null,
  auteur: string,
  corps: string,
): Promise<boolean> {
  if (!corps.trim()) return false;
  const ok = await addPublicComment(token, adId, auteur.trim(), corps.trim());
  if (ok) revalidatePath(`/preview/${token}`);
  return ok;
}

export async function submitApprovalAction(
  token: string,
  adId: string,
  relecteur: string,
  decision: Decision,
): Promise<boolean> {
  const ok = await setPublicApproval(token, adId, relecteur.trim(), decision);
  if (ok) revalidatePath(`/preview/${token}`);
  return ok;
}

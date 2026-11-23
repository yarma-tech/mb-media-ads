import type { Ad, Approval } from "./types";
export const TEXT_FIELDS = [
  "texte_principal",
  "titre",
  "description",
  "cta",
  "destination_url",
] as const;
export type EditableAdText = Partial<Pick<Ad, (typeof TEXT_FIELDS)[number]>>;
export function decisionForAd(
  approvals: Pick<Approval, "decision">[],
): "sans_decision" | "approuve" | "revision" {
  return approvals.some((a) => a.decision === "revision")
    ? "revision"
    : approvals.some((a) => a.decision === "approuve")
      ? "approuve"
      : "sans_decision";
}
export function groupAdsByPlatform(ads: Ad[]) {
  const groups = new Map<Ad["plateforme"], Ad[]>();
  [...ads]
    .sort((a, b) => a.ordre - b.ordre)
    .forEach((ad) =>
      groups.set(ad.plateforme, [...(groups.get(ad.plateforme) || []), ad]),
    );
  return [...groups].map(([plateforme, ads]) => ({ plateforme, ads }));
}

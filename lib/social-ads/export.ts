import type { Ad, Approval, Plan } from "./types";
import { PLATEFORME_LABEL } from "./types";
import { decisionForAd, groupAdsByPlatform } from "./review";
export function exportPlanText(
  plan: Plan,
  ads: Ad[],
  approvals: Approval[],
  exportedAt: Date,
): string {
  const lines = [
    `Plan : ${plan.nom}`,
    `Date : ${exportedAt.toISOString()}`,
    "",
  ];
  for (const group of groupAdsByPlatform(ads)) {
    lines.push(`=== ${PLATEFORME_LABEL[group.plateforme]} ===`, "");
    for (const ad of group.ads) {
      const decision = decisionForAd(
        approvals.filter((a) => a.ad_id === ad.id),
      );
      lines.push(
        `Annonce ${ad.ordre + 1} - ordre ${ad.ordre}`,
        `Placement : ${ad.placement || ad.format}`,
        `Média : ${ad.type_media || ad.format}`,
        `Ratio : ${ad.ratio}`,
        `Texte principal : ${ad.texte_principal || ""}`,
        `Titre : ${ad.titre || ""}`,
        `Description : ${ad.description || ""}`,
        `CTA : ${ad.cta || ""}`,
        `URL : ${ad.destination_url || ""}`,
        `Référence créa : ${ad.creative_ref || ""}`,
        `Décision : ${decision === "revision" ? "À réviser" : decision === "approuve" ? "Approuvée" : "Sans décision"}`,
      );
      if (ad.type_media === "carrousel" || ad.format === "feed_carrousel")
        ad.medias.forEach((m, i) =>
          lines.push(
            `Carte ${i + 1}`,
            `Référence : ${m.creative_ref || ""}`,
            `Titre : ${m.titre || ""}`,
            `Description : ${m.description || ""}`,
          ),
        );
      lines.push("", "----------------------------------------", "");
    }
  }
  return lines.join("\n").replace(/\u2014/g, "-");
}

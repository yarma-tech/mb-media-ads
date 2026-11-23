import type { Ad } from "./types";
import { legacyVariant } from "./specs";

export function convertLegacyAd(
  row: Ad,
):
  | { status: "converted"; ad: Ad }
  | { status: "needs_review"; ad: Ad; message: string } {
  if (row.placement && row.type_media) return { status: "converted", ad: row };
  if (
    row.format === "story" &&
    (!row.medias.length ||
      new Set(row.medias.map((m) => (m.type === "video" ? "video" : "image")))
        .size > 1)
  ) {
    return {
      status: "needs_review",
      ad: { ...row, variant_status: "needs_review" },
      message:
        "Story historique: choisir image ou capture vidéo et vérifier le ratio.",
    };
  }
  try {
    const v = legacyVariant(row.plateforme, row.format, row.ratio);
    if (row.format === "story" && row.medias[0]?.type === "video")
      v.type_media = "video";
    return {
      status: "converted",
      ad: { ...row, ...v, variant_status: "valid" },
    };
  } catch {
    return {
      status: "needs_review",
      ad: { ...row, variant_status: "needs_review" },
      message: "Combinaison historique à vérifier.",
    };
  }
}

import { CATALOG, CHANNELS, mediaChannels } from "./catalog";
import type { Ad, Campaign, Channel } from "./types";

export function currentAds(campaign: Campaign): Ad[] {
  const latest = new Map<string, Ad>();
  for (const ad of campaign.ads) {
    const old = latest.get(ad.familyId);
    if (!old || old.version < ad.version) latest.set(ad.familyId, ad);
  }
  return [...latest.values()];
}
export function intendedChannels(campaign: Campaign): Channel[] {
  const channels = new Set([
    ...(campaign.channels ?? []),
    ...campaign.ads.map((a) => a.channel),
    ...campaign.media.flatMap(mediaChannels),
  ]);
  return (Object.keys(CHANNELS) as Channel[]).filter((channel) =>
    channels.has(channel),
  );
}
const statuses = {
  draft: "Brouillon",
  pending: "À valider",
  approved: "Validée",
  changes_requested: "À modifier",
  on_air: "On air",
  stopped: "Arrêtée",
};
export function copyAdsText(campaign: Campaign, ads: Ad[]): string {
  return ads
    .map((ad, i) => {
      const media = campaign.media.find((m) => m.id === ad.mediaId);
      return [
        `Annonce ${i + 1}`,
        `Nom : ${ad.name}`,
        `Canal : ${CHANNELS[ad.channel]}`,
        `Thématique : ${ad.theme ?? ""}`,
        `Format : ${CATALOG[ad.channel].find((f) => f.id === ad.format)?.label ?? ad.format}`,
        ...(ad.channel === "google"
          ? [
              `Titres : ${ad.headlines.join("\n")}`,
              `Descriptions : ${ad.descriptions.join("\n")}`,
              `Chemin 1 : ${ad.path1}`,
              `Chemin 2 : ${ad.path2}`,
            ]
          : [
              `Texte : ${ad.copy}`,
              `Titre : ${ad.headline}`,
              `CTA : ${ad.cta}`,
            ]),
        `Lien : ${ad.url || campaign.defaultUrl}`,
        `Média : ${media?.name ?? ""}`,
        `Statut : ${statuses[ad.status]}`,
        ...ad.comments.map(
          (c) =>
            `${c.resolution === "handled" ? "Commentaire traité" : "Commentaire"} : ${c.text}`,
        ),
      ].join("\n");
    })
    .join("\n\n");
}

import { compatibleFormats, mediaChannels, preferredFormats } from "./catalog";
import { addAd } from "./workflow";
import type { Actor, Campaign, Channel } from "./types";

export interface MediaAdPlacement {
  mediaId: string;
  channel: Channel;
  format: string;
  label: string;
}
export type MediaAdSelection = Pick<
  MediaAdPlacement,
  "mediaId" | "channel" | "format"
>;

/** Every compatible, assigned placement not already represented by an ad. */
export function mediaAdPlan(
  campaign: Campaign,
  channels: Channel[],
  mediaIds = campaign.media.map((m) => m.id),
): MediaAdPlacement[] {
  const ids = new Set(mediaIds);
  const existing = new Set(
    campaign.ads.map((a) => `${a.mediaId}:${a.channel}:${a.format}`),
  );
  return campaign.media
    .filter((m) => ids.has(m.id) && m.state === "ready")
    .flatMap((media) =>
      [...new Set(channels)]
        .filter((channel) => mediaChannels(media).includes(channel))
        .flatMap((channel) =>
          preferredFormats(media, channel)
            .filter(
              (format) => !existing.has(`${media.id}:${channel}:${format.id}`),
            )
            .map((format) => ({
              mediaId: media.id,
              channel,
              format: format.id,
              label: format.label,
            })),
        ),
    );
}

/** One command/one optimistic commit: a failed lot cannot leave half its ads. */
export function createMediaAds(
  campaign: Campaign,
  mediaIds: string[],
  channels: Channel[],
  actor: Actor,
  now: string,
  selections?: MediaAdSelection[],
): { campaign: Campaign; created: number } {
  if (campaign.status !== "active") throw new Error("Campagne terminée.");
  if (mediaIds.some((id) => !campaign.media.some((m) => m.id === id)))
    throw new Error("Média introuvable dans cette campagne.");
  const placements = selections ?? mediaAdPlan(campaign, channels, mediaIds);
  // Validate the entire request before creating anything. A caller cannot smuggle
  // an unrelated channel, unselected file, unfinished upload or invented format.
  for (const choice of placements) {
    const media = campaign.media.find((m) => m.id === choice.mediaId);
    if (
      !mediaIds.includes(choice.mediaId) ||
      !channels.includes(choice.channel) ||
      !media ||
      media.state !== "ready" ||
      !mediaChannels(media).includes(choice.channel) ||
      !compatibleFormats(media, choice.channel).some(
        (f) => f.id === choice.format,
      )
    )
      throw new Error("Sélection de média ou de format incompatible.");
  }
  let next = campaign;
  for (const placement of placements) {
    if (
      next.ads.some(
        (ad) =>
          ad.mediaId === placement.mediaId &&
          ad.channel === placement.channel &&
          ad.format === placement.format,
      )
    )
      continue;
    next = addAd(next, placement.channel, placement.format, actor, now);
    next.ads[next.ads.length - 1].mediaId = placement.mediaId;
  }
  return { campaign: next, created: next.ads.length - campaign.ads.length };
}

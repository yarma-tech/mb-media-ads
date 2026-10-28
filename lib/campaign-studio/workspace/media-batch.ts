import { compatibleFormats, mediaChannels } from "./catalog";
import { addAd } from "./workflow";
import type { Actor, Campaign, Channel } from "./types";

export interface MediaAdPlacement {
  mediaId: string;
  channel: Channel;
  format: string;
  label: string;
}

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
          compatibleFormats(media, channel)
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
): { campaign: Campaign; created: number } {
  if (campaign.status !== "active") throw new Error("Campagne terminée.");
  if (mediaIds.some((id) => !campaign.media.some((m) => m.id === id)))
    throw new Error("Média introuvable dans cette campagne.");
  const placements = mediaAdPlan(campaign, channels, mediaIds);
  let next = campaign;
  for (const placement of placements) {
    next = addAd(next, placement.channel, placement.format, actor, now);
    next.ads[next.ads.length - 1].mediaId = placement.mediaId;
  }
  return { campaign: next, created: placements.length };
}

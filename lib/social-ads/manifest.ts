import type { Ad, Ratio } from "./types";
import { normalize } from "./normalize";

export type MediaSlot = {
  key: string;
  reference: string;
  ratio: Ratio;
  destinations: {
    adId: string;
    cardIndex: number | null;
    plateforme: string;
    placement: string;
  }[];
  complete: boolean;
  matchable: boolean;
};
const fileKey = (name: string) => normalize(name.replace(/\.[a-z0-9]+$/i, ""));
export function buildMediaManifest(ads: Ad[]): MediaSlot[] {
  const slots = new Map<string, MediaSlot>();
  for (const ad of ads) {
    const carousel =
      ad.type_media === "carrousel" || ad.format === "feed_carrousel";
    const refs = carousel
      ? ad.medias.map((m, i) => ({ ref: m.creative_ref, index: i, url: m.url }))
      : [{ ref: ad.creative_ref, index: null, url: ad.medias[0]?.url }];
    for (const item of refs) {
      const ref =
        item.ref ||
        `Annonce ${ad.ordre + 1}${item.index !== null ? ` carte ${item.index + 1}` : ""}`;
      const key = `${
        item.ref
          ? item.ref
              .trim()
              .toLowerCase()
              .replace(/\.[a-z0-9]+$/i, "")
          : `${ad.id}:${item.index}`
      }|${ad.ratio}`;
      const slot = slots.get(key) || {
        key,
        reference: ref,
        ratio: ad.ratio,
        destinations: [],
        complete: true,
        matchable: !!item.ref,
      };
      slot.destinations.push({
        adId: ad.id,
        cardIndex: item.index,
        plateforme: ad.plateforme,
        placement: ad.placement || ad.format,
      });
      slot.complete = slot.complete && !!item.url;
      slots.set(key, slot);
    }
  }
  return [...slots.values()];
}
export type MediaMatch = { filename: string } & (
  | { status: "matched"; slotKey: string }
  | { status: "ambiguous"; slotKeys: string[] }
  | { status: "unmatched" }
);
export function matchMediaFiles(
  slots: MediaSlot[],
  filenames: string[],
): MediaMatch[] {
  const frequency = new Map<string, number>();
  filenames.forEach((n) =>
    frequency.set(fileKey(n), (frequency.get(fileKey(n)) ?? 0) + 1),
  );
  return filenames.map((filename) => {
    const matches = slots.filter(
      (s) => s.matchable && fileKey(s.reference) === fileKey(filename),
    );
    if (!matches.length) return { filename, status: "unmatched" };
    if (matches.length > 1 || frequency.get(fileKey(filename))! > 1)
      return {
        filename,
        status: "ambiguous",
        slotKeys: matches.map((s) => s.key),
      };
    return { filename, status: "matched", slotKey: matches[0].key };
  });
}

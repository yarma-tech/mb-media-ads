import { MEDIA_LIMIT_BYTES } from "./upload-limits";
import type { Channel, Media } from "./types";
export const CHANNELS: Record<Channel, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  display: "Display",
  google: "Google SEM",
};
export interface Format {
  id: string;
  label: string;
  width: number;
  height: number;
  kind: "image" | "video" | "text";
  exact: boolean;
}
const f = (
  id: string,
  label: string,
  width: number,
  height: number,
  kind: Format["kind"] = "image",
  exact = false,
): Format => ({ id, label, width, height, kind, exact });
export const CATALOG: Record<Channel, Format[]> = {
  facebook: [
    f("square", "Fil carré", 1, 1),
    f("portrait", "Fil portrait", 4, 5),
    f("story", "Story", 9, 16),
    f("reel", "Reel", 9, 16, "video"),
    f("video", "Vidéo paysage", 16, 9, "video"),
  ],
  instagram: [
    f("square", "Fil carré", 1, 1),
    f("portrait", "Fil portrait", 4, 5),
    f("story", "Story", 9, 16),
    f("story_video", "Story vidéo", 9, 16, "video"),
    f("reel", "Reel", 9, 16, "video"),
  ],
  tiktok: [f("vertical", "Vidéo verticale", 9, 16, "video")],
  youtube: [
    f("instream", "In-stream", 16, 9, "video"),
    f("short", "Short", 9, 16, "video"),
  ],
  display: [
    f("rectangle", "Rectangle", 300, 250, "image", true),
    f("halfpage", "Demi-page", 300, 600, "image", true),
    f("leaderboard", "Leaderboard", 728, 90, "image", true),
    f("billboard", "Billboard", 970, 250, "image", true),
    f("mobile", "Mobile", 320, 100, "image", true),
  ],
  google: [f("search", "Annonce responsive Search", 0, 0, "text")],
};
export function compatibleFormats(
  media: Pick<Media, "mime" | "width" | "height" | "bytes">,
  channel: Channel,
): Format[] {
  if (
    !Number.isFinite(media.width) ||
    !Number.isFinite(media.height) ||
    media.width <= 0 ||
    media.height <= 0 ||
    media.bytes <= 0
  )
    return [];
  if (media.mime.startsWith("video/") && media.bytes > MEDIA_LIMIT_BYTES) return [];
  if (channel === "display" && media.bytes > 150_000) return [];
  const kind = media.mime.startsWith("video/")
    ? "video"
    : media.mime.startsWith("image/")
      ? "image"
      : null;
  return CATALOG[channel].filter(
    (f) =>
      f.kind === kind &&
      (f.exact
        ? media.width === f.width && media.height === f.height
        : Math.abs(media.width / media.height / (f.width / f.height) - 1) <=
          0.01),
  );
}
export function uniqueMediaFor(
  format: string,
  channel: Channel,
  media: Media[],
): Media | null {
  const matches = media.filter(
    (m) =>
      m.channel === channel &&
      m.state === "ready" &&
      compatibleFormats(m, channel).some((f) => f.id === format),
  );
  return matches.length === 1 ? matches[0] : null;
}

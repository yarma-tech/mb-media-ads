import { MEDIA_LIMIT_BYTES, MEDIA_LIMIT_MB } from "./upload-limits";
import type { Channel, Media } from "./types";
import {
  META_RULES,
  matchesMetaRatio,
  validateMetaMedia,
  metaMediaKind,
  type MetaCheck,
  type MetaPlacement,
} from "./meta-formats";
export function mediaChannels(
  media: Pick<Media, "channel" | "channels">,
): Channel[] {
  return media.channels?.length
    ? [...new Set(media.channels)]
    : [media.channel];
}
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
  meta?: { placement: MetaPlacement; mode: "preset" | "adaptive" | "fallback" };
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
// Keep every historical identifier. New formats are additive; no stored announcement is rewritten.
for (const channel of ["facebook", "instagram"] as const) {
  CATALOG[channel] = CATALOG[channel].map((format) => ({
    ...format,
    meta: {
      placement: format.id.startsWith("story")
        ? "story"
        : format.id === "reel"
          ? "reel"
          : "feed",
      mode:
        format.id.startsWith("story") || format.id === "reel"
          ? "adaptive"
          : "preset",
    },
  }));
  const presets = [
    f("landscape", "Fil paysage · 1,91:1", 191, 100),
    f("landscape_16_9", "Fil paysage · 16:9", 16, 9),
    f("square_video", "Vidéo carrée · 1:1", 1, 1, "video"),
    f("portrait_video", "Vidéo portrait · 4:5", 4, 5, "video"),
    f("wide_video", "Vidéo paysage · 1,91:1", 191, 100, "video"),
    ...(channel === "instagram"
      ? [
          f("landscape_video", "Vidéo paysage · 16:9", 16, 9, "video"),
          f("tall_video", "Vidéo portrait · 2:3", 2, 3, "video"),
          f("vertical_video", "Vidéo du fil · 9:16", 9, 16, "video"),
        ]
      : []),
  ];
  CATALOG[channel].push(
    ...presets.map((format) => ({
      ...format,
      meta: { placement: "feed" as const, mode: "preset" as const },
    })),
    {
      ...f("feed_image", "Image du fil · autres proportions", 1, 1),
      meta: { placement: "feed", mode: "fallback" },
    },
    {
      ...f("feed_video", "Vidéo du fil · autres proportions", 1, 1, "video"),
      meta: { placement: "feed", mode: "fallback" },
    },
    {
      ...f("reel_image", "Reel image", 9, 16),
      meta: { placement: "reel", mode: "adaptive" },
    },
    ...(channel === "facebook"
      ? [
          {
            ...f("story_video", "Story vidéo", 9, 16, "video"),
            meta: { placement: "story" as const, mode: "adaptive" as const },
          },
        ]
      : []),
  );
}
type MediaInput = Pick<Media, "mime" | "width" | "height" | "bytes"> &
  Partial<Pick<Media, "duration" | "frameRate">>;
export function formatCheck(
  media: MediaInput,
  channel: Channel,
  format: Format,
): MetaCheck | null {
  if (
    (channel !== "facebook" && channel !== "instagram") ||
    !format.meta ||
    format.kind === "text"
  )
    return null;
  const rule = META_RULES[channel][format.kind][format.meta.placement];
  const check = validateMetaMedia(media, rule);
  if (check.status === "rejected" || format.meta.mode === "adaptive")
    return check;
  const matches = (candidate: Format) =>
    matchesMetaRatio(media, candidate.width / candidate.height, rule.tolerance);
  const matched =
    format.meta.mode === "preset"
      ? matches(format)
      : !CATALOG[channel].some(
          (candidate) =>
            candidate.kind === format.kind &&
            candidate.meta?.placement === format.meta!.placement &&
            candidate.meta.mode === "preset" &&
            matches(candidate),
        );
  return matched
    ? check
    : {
        status: "rejected",
        errors: ["Les proportions du média ne correspondent pas à ce format."],
      };
}
export function compatibleFormats(
  media: Pick<Media, "mime" | "width" | "height" | "bytes"> &
    Partial<Pick<Media, "duration" | "frameRate">>,
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
  if (media.bytes > MEDIA_LIMIT_BYTES) return [];
  if (channel === "display" && media.bytes > 150_000) return [];
  if (
    channel === "display" &&
    media.mime === "image/gif" &&
    ((media.duration ?? 0) > 30 || (media.frameRate ?? 0) >= 5)
  )
    return [];
  const kind =
    channel === "facebook" || channel === "instagram"
      ? metaMediaKind(media)
      : media.mime.startsWith("video/")
        ? "video"
        : media.mime.startsWith("image/")
          ? "image"
          : null;
  return CATALOG[channel].filter(
    (f) =>
      f.kind === kind &&
      (f.meta
        ? formatCheck(media, channel, f)?.status !== "rejected"
        : f.exact
          ? media.width === f.width && media.height === f.height
          : Math.abs(media.width / media.height / (f.width / f.height) - 1) <=
            0.01),
  );
}
export function preferredFormats(
  media: MediaInput,
  channel: Channel,
): Format[] {
  const formats = compatibleFormats(media, channel);
  if (channel !== "facebook" && channel !== "instagram") return formats;
  const vertical = media.width / media.height < 0.75;
  const suggested =
    formats.find((f) =>
      vertical
        ? f.id === (metaMediaKind(media) === "video" ? "reel" : "story")
        : f.meta?.placement === "feed",
    ) ?? formats[0];
  return suggested ? [suggested] : [];
}
export function mediaCompatibilityMessages(
  media: MediaInput,
  channel: Channel,
): string[] {
  if (media.bytes > MEDIA_LIMIT_BYTES)
    return [`Limite du Studio : ${MEDIA_LIMIT_MB} Mo par fichier.`];
  const formats = preferredFormats(media, channel);
  if (formats.length) {
    const check = formatCheck(media, channel, formats[0]);
    return check && "warnings" in check ? check.warnings : [];
  }
  if (channel !== "facebook" && channel !== "instagram")
    return [
      "Dimensions ou caractéristiques non prises en charge pour ce canal.",
    ];
  const kind = metaMediaKind(media) ?? "image";
  const checks = Object.values(META_RULES[channel][kind]).map((rule) =>
    validateMetaMedia(media, rule),
  );
  return [
    ...new Set(
      checks.flatMap((check) =>
        check.status === "rejected" ? check.errors : [],
      ),
    ),
  ];
}
export function uniqueMediaFor(
  format: string,
  channel: Channel,
  media: Media[],
): Media | null {
  const matches = media.filter(
    (m) =>
      mediaChannels(m).includes(channel) &&
      m.state === "ready" &&
      compatibleFormats(m, channel).some((f) => f.id === format),
  );
  const definition = CATALOG[channel].find(
    (candidate) => candidate.id === format,
  );
  if (
    (channel === "facebook" || channel === "instagram") &&
    definition?.meta?.mode === "adaptive" &&
    definition.kind !== "text"
  ) {
    const rule =
      META_RULES[channel][definition.kind][definition.meta.placement];
    const native = matches.filter((media) =>
      matchesMetaRatio(
        media,
        definition.width / definition.height,
        rule.tolerance,
      ),
    );
    if (native.length) return native.length === 1 ? native[0] : null;
  }
  return matches.length === 1 ? matches[0] : null;
}

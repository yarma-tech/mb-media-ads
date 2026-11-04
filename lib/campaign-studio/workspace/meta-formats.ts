/** Meta Ads Guide, Awareness objective, checked directly 2026-11-04.
 * General placement matrix: https://www.facebook.com/business/help/682655495435254
 * Recommendations must not become upload requirements. */
export type MetaChannel = "facebook" | "instagram";
export type MetaPlacement = "feed" | "story" | "reel";
export type MetaKind = "image" | "video";
export type MetaMedia = {
  mime: string;
  width: number;
  height: number;
  bytes: number;
  duration?: number | null;
};
export function metaMediaKind(
  media: Pick<MetaMedia, "mime" | "duration">,
): MetaKind | null {
  if (
    media.mime.startsWith("video/") ||
    (media.mime === "image/gif" && (media.duration ?? 0) > 0)
  )
    return "video";
  return media.mime.startsWith("image/") ? "image" : null;
}
export type MetaCheck =
  | { status: "accepted" }
  | { status: "warning" | "unverified"; warnings: string[] }
  | { status: "rejected"; errors: string[] };
export interface MetaRule {
  channel: MetaChannel;
  kind: MetaKind;
  placement: MetaPlacement;
  ratios: readonly number[];
  range?: readonly [number, number];
  reviewRange?: readonly [number, number];
  recommended: number;
  tolerance: number | null;
  minWidth: number;
  minHeight?: number;
  maxDuration?: number;
  source: string;
  checkedAt: string;
}
const ratio = {
  wide: 1.91,
  landscape: 16 / 9,
  square: 1,
  portrait: 4 / 5,
  tall: 2 / 3,
  vertical: 9 / 16,
};
const feed = [ratio.wide, ratio.landscape, ratio.square, ratio.portrait];
const story = [...feed, ratio.vertical];
const reel = [...story, ratio.tall];
function rule(
  channel: MetaChannel,
  kind: MetaKind,
  placement: MetaPlacement,
  options: Pick<MetaRule, "ratios" | "recommended" | "tolerance" | "minWidth"> &
    Partial<MetaRule>,
): MetaRule {
  const slug =
    placement === "feed"
      ? `${channel}-feed`
      : placement === "story"
        ? `${channel}-story`
        : channel === "facebook"
          ? "facebook-facebook-reels"
          : "instagram-reels";
  return {
    channel,
    kind,
    placement,
    source: `https://www.facebook.com/business/ads-guide/update/${kind}/${slug}`,
    checkedAt: "2026-11-04",
    ...options,
  };
}
export const META_RULES: Record<
  MetaChannel,
  Record<MetaKind, Record<MetaPlacement, MetaRule>>
> = {
  facebook: {
    image: {
      feed: rule("facebook", "image", "feed", {
        ratios: feed,
        reviewRange: [0.8, 1.91],
        recommended: 0.8,
        tolerance: 0.03,
        minWidth: 600,
      }),
      story: rule("facebook", "image", "story", {
        ratios: story,
        recommended: 9 / 16,
        tolerance: 0.01,
        minWidth: 500,
      }),
      reel: rule("facebook", "image", "reel", {
        ratios: reel,
        recommended: 9 / 16,
        tolerance: 0.03,
        minWidth: 600,
        minHeight: 600,
      }),
    },
    video: {
      feed: rule("facebook", "video", "feed", {
        ratios: feed,
        reviewRange: [0.8, 1.91],
        recommended: 0.8,
        tolerance: null,
        minWidth: 120,
        minHeight: 120,
        maxDuration: 14460,
      }),
      story: rule("facebook", "video", "story", {
        ratios: story,
        recommended: 9 / 16,
        tolerance: 0.01,
        minWidth: 250,
        maxDuration: 180,
      }),
      reel: rule("facebook", "video", "reel", {
        ratios: reel,
        reviewRange: [9 / 16, 1.91],
        recommended: 9 / 16,
        tolerance: null,
        minWidth: 0,
      }),
    },
  },
  instagram: {
    image: {
      feed: rule("instagram", "image", "feed", {
        ratios: feed,
        range: [0.8, 1.91],
        recommended: 0.8,
        tolerance: 0.01,
        minWidth: 500,
      }),
      story: rule("instagram", "image", "story", {
        ratios: story,
        recommended: 9 / 16,
        tolerance: 0.01,
        minWidth: 500,
      }),
      reel: rule("instagram", "image", "reel", {
        ratios: reel,
        recommended: 9 / 16,
        tolerance: 0.01,
        minWidth: 500,
      }),
    },
    video: {
      feed: rule("instagram", "video", "feed", {
        ratios: reel,
        reviewRange: [9 / 16, 1.91],
        recommended: 9 / 16,
        tolerance: 0.01,
        minWidth: 250,
        maxDuration: 3600,
      }),
      story: rule("instagram", "video", "story", {
        ratios: story,
        recommended: 9 / 16,
        tolerance: 0.01,
        minWidth: 250,
        maxDuration: 3600,
      }),
      reel: rule("instagram", "video", "reel", {
        ratios: reel,
        reviewRange: [9 / 16, 1.91],
        recommended: 9 / 16,
        tolerance: null,
        minWidth: 250,
        maxDuration: 900,
      }),
    },
  },
};
export function matchRatio(
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number,
  tolerance: number,
): boolean {
  if (
    ![width, height, targetWidth, targetHeight].every(
      (n) => Number.isFinite(n) && n > 0,
    ) ||
    !Number.isFinite(tolerance) ||
    tolerance < 0
  )
    return false;
  return (
    Math.abs(width / height / (targetWidth / targetHeight) - 1) <=
    tolerance + 1e-10
  );
}
/** A whole-pixel export may round an exact mathematical ratio. This is not a Meta percentage tolerance. */
export function matchesMetaRatio(
  media: Pick<MetaMedia, "width" | "height">,
  target: number,
  tolerance: number | null,
): boolean {
  if (
    ![media.width, media.height, target].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  )
    return false;
  return (
    matchRatio(media.width, media.height, target, 1, tolerance ?? 0) ||
    (tolerance === null && Math.abs(media.width - media.height * target) <= 1)
  );
}
export function validateMetaMedia(media: MetaMedia, rule: MetaRule): MetaCheck {
  const errors: string[] = [],
    warnings: string[] = [];
  if (
    ![media.width, media.height, media.bytes].every(
      (n) => Number.isFinite(n) && n > 0,
    )
  )
    return {
      status: "rejected",
      errors: ["Dimensions ou poids du média invalides."],
    };
  const kind = metaMediaKind(media);
  if (kind !== rule.kind)
    return {
      status: "rejected",
      errors: [
        rule.kind === "video"
          ? "Un fichier vidéo est requis."
          : "Une image est requise.",
      ],
    };
  const minWidth =
    rule.channel === "instagram" &&
    rule.placement === "reel" &&
    rule.kind === "video" &&
    (media.duration ?? 0) >= 30
      ? 500
      : rule.minWidth;
  if (media.width < minWidth)
    errors.push(
      `Largeur minimale : ${minWidth} px (fichier : ${media.width} px).`,
    );
  if (rule.minHeight && media.height < rule.minHeight)
    errors.push(`Hauteur minimale : ${rule.minHeight} px.`);
  if (
    rule.channel === "facebook" &&
    rule.placement === "feed" &&
    rule.kind === "image" &&
    matchesMetaRatio(media, 0.8, rule.tolerance) &&
    media.height < 750
  )
    errors.push("Hauteur minimale pour le fil portrait Facebook : 750 px.");
  if (media.bytes > (rule.kind === "image" ? 30000000 : 4000000000))
    errors.push(
      rule.kind === "image"
        ? "Image limitée à 30 Mo sur Meta."
        : "Vidéo limitée à 4 Go sur Meta.",
    );
  if (
    rule.kind === "video" &&
    media.duration != null &&
    (!Number.isFinite(media.duration) || media.duration <= 0)
  )
    errors.push("Durée de vidéo invalide.");
  if (
    rule.maxDuration &&
    media.duration != null &&
    media.duration > rule.maxDuration
  )
    errors.push(`Durée maximale pour ce placement : ${rule.maxDuration} s.`);
  if (
    rule.kind === "video" &&
    rule.placement !== "reel" &&
    media.duration != null &&
    media.duration < 1
  )
    errors.push("Durée minimale pour ce placement : 1 s.");
  if (
    rule.channel === "instagram" &&
    rule.placement === "reel" &&
    media.mime === "image/gif"
  )
    errors.push("Les GIF ne sont pas pris en charge pour les Reels Instagram.");
  const actual = media.width / media.height,
    t = rule.tolerance ?? 0;
  const canonical = rule.ratios.some((target) =>
    matchesMetaRatio(media, target, rule.tolerance),
  );
  const inRange =
    rule.range &&
    actual >= rule.range[0] * (1 - t) - 1e-10 &&
    actual <= rule.range[1] * (1 + t) + 1e-10;
  const review =
    !canonical &&
    !inRange &&
    rule.reviewRange &&
    actual >= rule.reviewRange[0] &&
    actual <= rule.reviewRange[1];
  if (!canonical && !inRange && !review)
    errors.push(
      `Proportions non prises en charge pour ce placement (fichier : ${media.width} × ${media.height}).`,
    );
  if (errors.length) return { status: "rejected", errors };
  if (!matchesMetaRatio(media, rule.recommended, rule.tolerance))
    warnings.push(
      `${rule.recommended === 0.8 ? "4:5" : "9:16"} recommandé pour ce placement ; le fichier original est conservé.`,
    );
  if (
    rule.kind === "image" &&
    !["image/jpeg", "image/png"].includes(media.mime)
  )
    warnings.push("Meta recommande un export JPG ou PNG pour les images.");
  if (
    rule.kind === "video" &&
    !["video/mp4", "video/quicktime", "image/gif"].includes(media.mime)
  )
    warnings.push("Meta recommande un export MP4 ou MOV pour la vidéo.");
  if (review || (rule.kind === "video" && media.duration == null))
    return {
      status: "unverified",
      warnings: [
        ...warnings,
        "À vérifier dans Meta : caractéristiques non confirmées pour ce fichier.",
      ],
    };
  return warnings.length
    ? { status: "warning", warnings }
    : { status: "accepted" };
}

import type { Ad, Format, FormatSpec, Plateforme, Ratio } from "./types";

export const PLACEMENTS = [
  "feed",
  "stories",
  "reels",
  "in_stream",
  "in_feed",
  "shorts",
] as const;
export type Placement = (typeof PLACEMENTS)[number];
export type AdVariant =
  | {
      plateforme: "facebook";
      placement: "feed";
      type_media: "image" | "video";
      ratio: "1:1" | "4:5" | "1.91:1" | "16:9" | "9:16";
    }
  | {
      plateforme: "facebook";
      placement: "feed";
      type_media: "carrousel";
      ratio: "1:1";
    }
  | {
      plateforme: "instagram";
      placement: "feed";
      type_media: "image" | "video" | "carrousel";
      ratio: "1:1" | "4:5";
    }
  | {
      plateforme: "facebook" | "instagram";
      placement: "stories";
      type_media: "image" | "video";
      ratio: "9:16";
    }
  | {
      plateforme: "facebook" | "instagram";
      placement: "reels";
      type_media: "video";
      ratio: "9:16";
    }
  | {
      plateforme: "linkedin";
      placement: "feed";
      type_media: "image";
      ratio: "1:1" | "4:5" | "1.91:1";
    }
  | {
      plateforme: "linkedin";
      placement: "feed";
      type_media: "video";
      ratio: "1:1" | "4:5" | "16:9" | "9:16";
    }
  | {
      plateforme: "linkedin";
      placement: "feed";
      type_media: "carrousel";
      ratio: "1:1";
    }
  | {
      plateforme: "tiktok";
      placement: "in_feed";
      type_media: "video";
      ratio: "9:16";
    }
  | {
      plateforme: "youtube";
      placement: "in_stream";
      type_media: "video";
      ratio: "16:9" | "9:16" | "1:1";
    }
  | {
      plateforme: "youtube";
      placement: "in_feed";
      type_media: "video";
      ratio: "16:9";
    }
  | {
      plateforme: "youtube";
      placement: "shorts";
      type_media: "video";
      ratio: "9:16";
    };

export type VariantSpec = FormatSpec & {
  descriptionMax: number | null;
  hardLimits: {
    text: number | null;
    title: number | null;
    description: number | null;
  };
  titreShown: number;
  cards: { min: number; max: number } | null;
  views: ("desktop" | "mobile")[];
  safeZone?: { top: number; bottom: number; left: number; right: number };
};
export type VariantChoice = Pick<
  AdVariant,
  "plateforme" | "placement" | "type_media"
>;

export function allowedRatios(v: VariantChoice): Ratio[] {
  const { plateforme: p, placement: l, type_media: m } = v;
  if (
    (p === "facebook" || p === "instagram") &&
    l === "stories" &&
    (m === "image" || m === "video")
  )
    return ["9:16"];
  if ((p === "facebook" || p === "instagram") && l === "reels" && m === "video")
    return ["9:16"];
  if (p === "tiktok" && l === "in_feed" && m === "video") return ["9:16"];
  if (p === "youtube" && m === "video") {
    if (l === "shorts") return ["9:16"];
    if (l === "in_feed") return ["16:9"];
    if (l === "in_stream") return ["16:9", "9:16", "1:1"];
  }
  if (l === "feed" && ["image", "video", "carrousel"].includes(m)) {
    if (p === "instagram") return ["1:1", "4:5"];
    if (p === "facebook")
      return m === "carrousel"
        ? ["1:1"]
        : ["1:1", "4:5", "1.91:1", "16:9", "9:16"];
    if (p === "linkedin")
      return m === "carrousel"
        ? ["1:1"]
        : m === "video"
          ? ["16:9", "1:1", "4:5", "9:16"]
          : ["1.91:1", "1:1", "4:5"];
  }
  return [];
}

export function parseVariant(
  input: unknown,
):
  | { status: "valid"; variant: AdVariant }
  | { status: "invalid"; message: string } {
  if (!input || typeof input !== "object")
    return { status: "invalid", message: "Variante manquante." };
  const v = input as AdVariant;
  if (!allowedRatios(v).includes(v.ratio))
    return {
      status: "invalid",
      message: `Combinaison non supportée: ${v.plateforme} / ${v.placement} / ${v.type_media} / ${v.ratio}.`,
    };
  return {
    status: "valid",
    variant: {
      plateforme: v.plateforme,
      placement: v.placement,
      type_media: v.type_media,
      ratio: v.ratio,
    } as AdVariant,
  };
}

export function getVariantSpec(v: AdVariant): VariantSpec {
  const parsed = parseVariant(v);
  if (parsed.status === "invalid") throw new Error(parsed.message);
  const p = v.plateforme;
  const vertical =
    ["stories", "reels", "shorts"].includes(v.placement) || p === "tiktok";
  const reel = v.placement === "reels";
  return {
    texteShown:
      p === "youtube"
        ? 90
        : p === "tiktok"
          ? 50
          : reel
            ? 44
            : p === "linkedin"
              ? 150
              : 125,
    texteMax:
      p === "facebook"
        ? 2200
        : p === "instagram"
          ? reel
            ? 44
            : 2200
          : p === "linkedin"
            ? v.type_media === "carrousel"
              ? 255
              : 3000
            : p === "tiktok"
              ? 100
              : 5000,
    texteHard: p === "tiktok",
    titreMax:
      p === "youtube"
        ? v.placement === "in_feed"
          ? 100
          : 90
        : p === "linkedin"
          ? 200
          : p === "tiktok"
            ? 0
            : 40,
    titreShown:
      p === "linkedin"
        ? 70
        : p === "facebook" && v.placement === "feed"
          ? 27
          : 40,
    hardLimits: {
      text:
        p === "linkedin"
          ? v.type_media === "carrousel"
            ? 255
            : 3000
          : p === "instagram"
            ? reel
              ? 44
              : 2200
            : p === "facebook" && v.placement === "feed"
              ? 2200
              : null,
      title:
        p === "linkedin"
          ? v.type_media === "carrousel"
            ? null
            : 200
          : p === "youtube"
            ? v.placement === "in_feed"
              ? 100
              : 90
            : null,
      description:
        p === "youtube"
          ? 90
          : p === "linkedin" && v.type_media === "image"
            ? 300
            : null,
    },
    titreHard: true,
    descriptionMax:
      p === "youtube"
        ? 90
        : p === "linkedin" && v.type_media === "image"
          ? 300
          : null,
    ratios: allowedRatios(v),
    resolution: vertical
      ? "1080×1920"
      : v.ratio === "16:9"
        ? "1920×1080"
        : v.ratio === "4:5"
          ? "1080×1350"
          : v.ratio === "1.91:1"
            ? "1200×627"
            : "1080×1080",
    views: vertical ? ["mobile"] : ["desktop", "mobile"],
    cards: v.type_media === "carrousel" ? { min: 2, max: 10 } : null,
    ...(vertical
      ? {
          safeZone: {
            top: 0.14,
            bottom: reel || p === "instagram" ? 0.35 : 0.2,
            left: 0.06,
            right: 0.06,
          },
        }
      : {}),
  };
}

export function legacyVariant(
  p: Plateforme,
  format: Format,
  ratio?: Ratio,
): AdVariant {
  const placement: Placement =
    p === "tiktok"
      ? "in_feed"
      : p === "youtube"
        ? format === "reel"
          ? "shorts"
          : "in_feed"
        : format === "story"
          ? "stories"
          : format === "reel"
            ? "reels"
            : "feed";
  const type_media =
    format === "feed_carrousel"
      ? "carrousel"
      : ["feed_video", "reel"].includes(format) || p === "youtube"
        ? "video"
        : "image";
  const choice = { plateforme: p, placement, type_media } as VariantChoice;
  const ratios = allowedRatios(choice);
  if (!ratios.length)
    throw new Error("Format historique incompatible avec la plateforme.");
  return {
    ...choice,
    ratio: ratio && ratios.includes(ratio) ? ratio : ratios[0],
  } as AdVariant;
}

export function variantOf(
  ad: Pick<Ad, "plateforme" | "format" | "ratio" | "placement" | "type_media">,
): AdVariant {
  if (ad.placement && ad.type_media) {
    const result = parseVariant(ad);
    if (result.status === "valid") return result.variant;
    throw new Error(result.message);
  }
  return legacyVariant(ad.plateforme, ad.format, ad.ratio);
}

export function legacyFormat(v: AdVariant): Format {
  return v.placement === "stories"
    ? "story"
    : ["reels", "shorts"].includes(v.placement) || v.plateforme === "tiktok"
      ? "reel"
      : v.type_media === "carrousel"
        ? "feed_carrousel"
        : v.type_media === "video"
          ? "feed_video"
          : "feed_image";
}

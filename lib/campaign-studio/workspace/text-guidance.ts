import type { Ad, AdFields } from "./types";

export type TextGuidance = {
  limit: number;
  kind: "recommendation" | "field_limit";
  context: string;
  source: string;
  counting: "graphemes" | "google";
};

const metaGuide = "https://www.facebook.com/business/ads-guide/update/";
const shorts = "https://support.google.com/google-ads/answer/16041697?hl=en";
const demandGen = "https://support.google.com/google-ads/answer/17141078?hl=en";
const search = "https://support.google.com/google-ads/answer/7684791?hl=en";

function recommendation(
  limit: number,
  context: string,
  source: string,
): TextGuidance {
  return {
    limit,
    kind: "recommendation",
    context,
    source,
    counting: "graphemes",
  };
}

/** Writing guidance, not a promise of the exact visible truncation point. */
export function textGuidance(
  ad: Pick<Ad, "channel" | "format">,
  field: keyof AdFields,
): TextGuidance | null {
  if (ad.channel === "google" && ad.format === "search") {
    const limit =
      field === "headlines"
        ? 30
        : field === "descriptions"
          ? 90
          : field === "path1" || field === "path2"
            ? 15
            : null;
    return limit === null
      ? null
      : {
          limit,
          kind: "field_limit",
          context: "Google Search, par texte",
          source: search,
          counting: "google",
        };
  }
  if (ad.channel === "tiktok" && ad.format === "vertical" && field === "copy")
    return recommendation(
      100,
      "repère de légende TikTok In-Feed (4 lignes), pas un plafond universel",
      "https://ads.tiktok.com/resources/help/article/tiktok-reservation-in-feed-ads-reach-frequency?lang=en",
    );
  if (field !== "copy" && field !== "headline") return null;
  const copy = field === "copy";
  if (ad.channel === "facebook") {
    if (["square", "portrait", "video"].includes(ad.format))
      return recommendation(
        copy ? 150 : 27,
        "Facebook Feed",
        `${metaGuide}${ad.format === "video" ? "video" : "image"}/facebook-feed`,
      );
    if (ad.format === "story")
      return recommendation(
        copy ? 125 : 40,
        "Facebook Stories",
        `${metaGuide}image/facebook-story`,
      );
    if (ad.format === "reel")
      return recommendation(
        copy ? 40 : 55,
        "Facebook Reels",
        `${metaGuide}video/facebook-facebook-reels`,
      );
  }
  if (ad.channel === "instagram") {
    if (["square", "portrait"].includes(ad.format))
      return recommendation(
        copy ? 125 : 40,
        "Instagram Feed",
        `${metaGuide}image/instagram-feed`,
      );
    if (ad.format === "story")
      return copy
        ? recommendation(
            125,
            "Instagram Stories",
            `${metaGuide}image/instagram-story`,
          )
        : null;
    if (ad.format === "story_video")
      return copy
        ? recommendation(
            125,
            "Instagram Stories vidéo",
            `${metaGuide}video/instagram-story`,
          )
        : null;
    if (ad.format === "reel")
      return copy
        ? recommendation(
            44,
            "Instagram Reels",
            `${metaGuide}video/instagram-reels`,
          )
        : null;
  }
  if (ad.channel === "youtube") {
    if (ad.format === "short")
      return copy
        ? {
            limit: 90,
            kind: "field_limit",
            context: "description YouTube Shorts",
            source: shorts,
            counting: "graphemes",
          }
        : recommendation(40, "titre de la carte CTA YouTube Shorts", shorts);
    if (ad.format === "instream")
      return recommendation(
        copy ? 90 : 40,
        "modèle Demand Gen, pas tous les formats YouTube",
        demandGen,
      );
  }
  // No independent TikTok headline or free-form CTA limit; Display is artwork-only.
  return null;
}

const segmenter = new Intl.Segmenter("fr", { granularity: "grapheme" });

export function guidanceLength(
  text: string,
  counting: TextGuidance["counting"],
): number {
  // Match the existing Search validation. Double-width-language weighting is
  // not yet implemented by that validator; do not introduce a second rule here.
  if (counting === "google") return Array.from(text).length;
  return Array.from(segmenter.segment(text)).length;
}

/** Google assets occupy one cell but each newline is a separate constrained asset. */
export function characterBudget(
  value: string | string[],
  guidance: TextGuidance,
) {
  const values = Array.isArray(value) ? value : [value];
  const lengths = values.map((text) => guidanceLength(text, guidance.counting));
  const used = Math.max(0, ...lengths);
  return {
    used,
    remaining: guidance.limit - used,
    variant:
      Array.isArray(value) && values.length > 1
        ? lengths.indexOf(used) + 1
        : null,
    progress: Math.min(1, Math.max(0, used / guidance.limit)),
  };
}

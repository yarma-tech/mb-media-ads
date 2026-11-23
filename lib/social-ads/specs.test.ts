import { describe, expect, it } from "vitest";
import { getVariantSpec, parseVariant } from "./specs";
import { convertLegacyAd } from "./legacy";
import type { Ad } from "./types";

describe("référentiel fermé", () => {
  it("décrit Reels Instagram et refuse Story carrousel", () => {
    const spec = getVariantSpec({
      plateforme: "instagram",
      placement: "reels",
      type_media: "video",
      ratio: "9:16",
    });
    expect(spec).toMatchObject({
      texteShown: 44,
      views: ["mobile"],
      safeZone: { top: 0.14, bottom: 0.35, left: 0.06, right: 0.06 },
    });
    expect(
      parseVariant({
        plateforme: "facebook",
        placement: "stories",
        type_media: "carrousel",
        ratio: "9:16",
      }).status,
    ).toBe("invalid");
  });
  it("Shorts garde description 90 et vidéo 9:16", () => {
    expect(
      getVariantSpec({
        plateforme: "youtube",
        placement: "shorts",
        type_media: "video",
        ratio: "9:16",
      }).descriptionMax,
    ).toBe(90);
    expect(
      parseVariant({
        plateforme: "instagram",
        placement: "reels",
        type_media: "image",
        ratio: "9:16",
      }).status,
    ).toBe("invalid");
  });
  it("conserve Story ambiguë et ses données sources", () => {
    const ad = {
      plateforme: "instagram",
      format: "story",
      ratio: "1:1",
      medias: [],
      texte_principal: "Texte ancien",
    } as unknown as Ad;
    expect(convertLegacyAd(ad)).toMatchObject({
      status: "needs_review",
      ad: { ratio: "1:1", texte_principal: "Texte ancien" },
    });
  });
});

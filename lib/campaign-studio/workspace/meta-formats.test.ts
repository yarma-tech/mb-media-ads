import { describe, expect, it } from "vitest";
import { matchRatio, META_RULES, validateMetaMedia } from "./meta-formats";
const image = {
  mime: "image/jpeg",
  width: 1080,
  height: 1080,
  bytes: 10000,
  duration: null,
};
describe("règles Meta documentées", () => {
  it("applique une frontière inclusive stable, propre à chaque placement", () => {
    expect(matchRatio(1030, 1000, 1, 1, 0.03)).toBe(true);
    expect(matchRatio(1031, 1000, 1, 1, 0.03)).toBe(false);
    expect(matchRatio(1010, 1000, 1, 1, 0.01)).toBe(true);
    expect(matchRatio(1011, 1000, 1, 1, 0.01)).toBe(false);
    expect(matchRatio(0, 1000, 1, 1, 0.03)).toBe(false);
    expect(matchRatio(Infinity, 1000, 1, 1, 0.03)).toBe(false);
    expect(META_RULES.facebook.image.feed.tolerance).toBe(0.03);
    expect(META_RULES.instagram.image.feed.tolerance).toBe(0.01);
    expect(META_RULES.facebook.video.feed.tolerance).toBeNull();
  });
  it("accepte les ratios intermédiaires Instagram et avertit sur les recommandations", () => {
    expect(
      validateMetaMedia(
        { ...image, width: 1500, height: 1000 },
        META_RULES.instagram.image.feed,
      ).status,
    ).toBe("warning");
    expect(
      validateMetaMedia(
        { ...image, width: 800, height: 1000 },
        META_RULES.instagram.image.feed,
      ).status,
    ).toBe("accepted");
    expect(
      validateMetaMedia(
        { ...image, width: 720, height: 1080 },
        META_RULES.instagram.image.feed,
      ).status,
    ).toBe("rejected");
  });
  it("distingue refus technique et préférence créative", () => {
    expect(
      validateMetaMedia(
        { ...image, width: 200 },
        META_RULES.facebook.image.feed,
      ).status,
    ).toBe("rejected");
    expect(
      validateMetaMedia(
        { ...image, bytes: 30000001 },
        META_RULES.instagram.image.story,
      ).status,
    ).toBe("rejected");
    expect(
      validateMetaMedia(image, META_RULES.instagram.image.story).status,
    ).toBe("warning");
    expect(
      validateMetaMedia(
        { ...image, mime: "video/mp4", duration: 181 },
        META_RULES.facebook.video.story,
      ).status,
    ).toBe("rejected");
    expect(
      validateMetaMedia(
        { ...image, mime: "video/mp4", duration: 8 },
        META_RULES.facebook.video.feed,
      ).status,
    ).not.toBe("rejected");
  });
  it("reconnaît les GIF animés comme vidéos Meta et respecte l’exclusion Reels Instagram", () => {
    const gif = { ...image, mime: "image/gif", duration: 8 };
    expect(
      validateMetaMedia(gif, META_RULES.facebook.video.feed).status,
    ).not.toBe("rejected");
    expect(validateMetaMedia(gif, META_RULES.instagram.video.reel).status).toBe(
      "rejected",
    );
  });
});

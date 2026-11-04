import { it, expect } from "vitest";
import { compatibleFormats, uniqueMediaFor, preferredFormats } from "./catalog";
import type { Media } from "./types";
const image: Media = {
  id: "m",
  name: "test.jpg",
  path: "test",
  mime: "image/jpeg",
  bytes: 10000,
  width: 1080,
  height: 1080,
  duration: null,
  channel: "facebook",
  state: "ready",
  errors: [],
};
it("détecte un format au ratio et refuse un média hors catalogue", () => {
  expect(preferredFormats(image, "facebook").map((f) => f.id)).toEqual([
    "square",
  ]);
  expect(
    compatibleFormats({ ...image, width: 567, height: 900 }, "instagram"),
  ).toEqual([]);
  expect(
    compatibleFormats(
      { ...image, mime: "video/mp4", bytes: 200000001 },
      "youtube",
    ),
  ).toEqual([]);
  expect(
    compatibleFormats(
      { ...image, width: 300, height: 250, bytes: 150001 },
      "display",
    ),
  ).toEqual([]);
});
it("ne choisit jamais arbitrairement entre médias compatibles", () => {
  expect(uniqueMediaFor("square", "facebook", [image])?.id).toBe("m");
  expect(
    uniqueMediaFor("square", "facebook", [image, { ...image, id: "other" }]),
  ).toBeNull();
});
it("privilégie la variante native Story sans rendre ambiguë une association auparavant évidente", () => {
  const vertical = { ...image, id: "vertical", width: 1080, height: 1920 };
  expect(uniqueMediaFor("story", "facebook", [image, vertical])?.id).toBe(
    "vertical",
  );
  expect(
    uniqueMediaFor("story", "facebook", [
      image,
      vertical,
      { ...vertical, id: "vertical-2" },
    ]),
  ).toBeNull();
});
it("reconnaît les fichiers Meta paysage et les vidéos carrées/portrait", () => {
  for (const channel of ["facebook", "instagram"] as const) {
    expect(
      compatibleFormats({ ...image, width: 1200, height: 628 }, channel).some(
        (f) => f.id === "landscape",
      ),
    ).toBe(true);
    expect(
      compatibleFormats({ ...image, width: 1920, height: 1080 }, channel).some(
        (f) => f.id === "landscape_16_9",
      ),
    ).toBe(true);
    expect(
      compatibleFormats(
        { ...image, mime: "video/mp4", duration: 8 },
        channel,
      ).some((f) => f.id === "square_video"),
    ).toBe(true);
    expect(
      compatibleFormats(
        { ...image, mime: "video/mp4", width: 1080, height: 1350, duration: 8 },
        channel,
      ).some((f) => f.id === "portrait_video"),
    ).toBe(true);
  }
  expect(
    compatibleFormats(
      { ...image, mime: "video/mp4", width: 1080, height: 1920, duration: 8 },
      "facebook",
    ).some((f) => f.id === "story_video"),
  ).toBe(true);
  expect(
    compatibleFormats(
      { ...image, width: 1500, height: 1000 },
      "instagram",
    ).some((f) => f.id === "feed_image"),
  ).toBe(true);
  expect(
    compatibleFormats({ ...image, width: 1030, height: 1000 }, "facebook").some(
      (f) => f.id === "square",
    ),
  ).toBe(true);
  expect(
    compatibleFormats(
      { ...image, width: 1030, height: 1000 },
      "instagram",
    ).some((f) => f.id === "square"),
  ).toBe(false);
});

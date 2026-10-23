import { it, expect } from "vitest";
import { compatibleFormats, uniqueMediaFor } from "./catalog";
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
  expect(compatibleFormats(image, "facebook").map((f) => f.id)).toEqual([
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

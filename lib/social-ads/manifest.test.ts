import { expect, it } from "vitest";
import { buildMediaManifest, matchMediaFiles } from "./manifest";
import type { Ad } from "./types";

it("partage une créa+ratio image et capture vidéo, et signale multi-ratio", () => {
  const ads = [
    {
      id: "1",
      creative_ref: "Été",
      ratio: "4:5",
      medias: [],
      type_media: "image",
    },
    {
      id: "2",
      creative_ref: "Été",
      ratio: "4:5",
      medias: [],
      type_media: "video",
    },
    {
      id: "3",
      creative_ref: "Été",
      ratio: "9:16",
      medias: [],
      type_media: "video",
    },
  ] as unknown as Ad[];
  const slots = buildMediaManifest(ads);
  expect(slots).toHaveLength(2);
  expect(slots[0].destinations).toHaveLength(2);
  expect(
    matchMediaFiles(slots, ["ete.PNG", "autre.jpg"]).map((m) => m.status),
  ).toEqual(["ambiguous", "unmatched"]);
});
it("normalise les noms de fichiers et garde les collisions de références explicites", () => {
  const ads = [
    {
      id: "1",
      ordre: 0,
      creative_ref: "Été",
      ratio: "1:1",
      medias: [],
      type_media: "image",
    },
    {
      id: "2",
      ordre: 1,
      creative_ref: "Ete",
      ratio: "1:1",
      medias: [],
      type_media: "image",
    },
  ] as unknown as Ad[];
  expect(matchMediaFiles(buildMediaManifest(ads), ["ETE.png"])[0].status).toBe(
    "ambiguous",
  );
  const slots = buildMediaManifest(ads.slice(0, 1));
  expect(matchMediaFiles(slots, ["ete.PNG"])[0].status).toBe("matched");
  expect(
    matchMediaFiles(slots, ["ete.png", "ETE.jpg"]).every(
      (m) => m.status === "ambiguous",
    ),
  ).toBe(true);
});
it("produit quatre slots de cartes et ne fusionne pas les références manquantes", () => {
  const ads = [
    {
      id: "1",
      ordre: 0,
      ratio: "1:1",
      type_media: "carrousel",
      medias: ["A", "B", "C", "D"].map((creative_ref) => ({
        creative_ref,
        url: "",
      })),
    },
    { id: "2", ordre: 1, ratio: "1:1", type_media: "image", medias: [] },
    { id: "3", ordre: 2, ratio: "1:1", type_media: "image", medias: [] },
  ] as unknown as Ad[];
  const slots = buildMediaManifest(ads);
  expect(slots).toHaveLength(6);
  expect(slots.slice(0, 4).map((s) => s.destinations[0].cardIndex)).toEqual([
    0, 1, 2, 3,
  ]);
});

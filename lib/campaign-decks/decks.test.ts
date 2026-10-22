import { describe, expect, it } from "vitest";
import { classifyFormat } from "./config";
import { buildSlides } from "./slides";
import type { AssetFormat, DeckAsset, DeckCampaign, DeckTheme } from "./types";

const asset = (format: AssetFormat): DeckAsset => ({
  id: format,
  url: `/test/${format}.gif`,
  width: 1080,
  height: 1080,
  format,
  mime: "image/gif",
});
const theme = (
  id: string,
  order: number,
  formats: AssetFormat[],
): DeckTheme => ({
  id,
  name: id,
  order,
  assets: formats.map(asset),
  copy: {},
});
const campaign = (themes: DeckTheme[]): DeckCampaign => ({
  id: "test",
  title: "Admissions",
  subtitle: "Campagne",
  cta: "S'inscrire",
  destination: "https://collegecmsa.ca",
  brandId: "cmsa",
  themes,
});

describe("classement par dimensions", () => {
  it.each([
    [1080, 1080, "square"],
    [1200, 1200, "square"],
    [1080, 1350, "portrait"],
    [1080, 1920, "vertical"],
    [300, 250, "rectangle"],
    [300, 600, "skyscraper"],
    [320, 100, "mobile"],
    [728, 90, "leaderboard"],
    [970, 250, "billboard"],
    [1009, 1000, "square"],
    [1010, 1000, "square"],
    [990, 1000, "square"],
    [1011, 1000, "unclassified"],
    [989, 1000, "unclassified"],
    [1939, 500, "unclassified"],
    [1600, 900, "unclassified"],
    [0, 0, "unclassified"],
    [-1080, -1080, "unclassified"],
    [Infinity, Infinity, "unclassified"],
    [NaN, 1000, "unclassified"],
  ])("%s × %s → %s", (width, height, expected) => {
    expect(classifyFormat(width, height)).toBe(expected);
  });
});

describe("structure du deck", () => {
  it("produit 13 slides, canaux groupés, thématiques triées sans mutation", () => {
    const themes = [
      theme("AZIMUT", 2, ["square", "mobile"]),
      theme("Générique", 0, ["square", "billboard"]),
      theme("Hockey", 1, ["vertical", "rectangle"]),
    ];
    const slides = buildSlides(campaign(themes));
    expect(
      slides.map((s) =>
        s.kind === "cover"
          ? "cover"
          : s.kind === "divider"
            ? s.channel
            : `${s.channel}:${s.theme.name}`,
      ),
    ).toEqual([
      "cover",
      "facebook",
      "facebook:Générique",
      "facebook:Hockey",
      "facebook:AZIMUT",
      "instagram",
      "instagram:Générique",
      "instagram:Hockey",
      "instagram:AZIMUT",
      "display",
      "display:Générique",
      "display:Hockey",
      "display:AZIMUT",
    ]);
    expect(themes.map((t) => t.name)).toEqual([
      "AZIMUT",
      "Générique",
      "Hockey",
    ]);
    expect(new Set(slides.map((s) => s.id)).size).toBe(13);
  });

  it("omet les canaux et thèmes vides, y compris les fichiers non classés", () => {
    const slides = buildSlides(
      campaign([
        theme("Vide", 0, []),
        theme("Inconnu", 1, ["unclassified"]),
        theme("Bannières", 2, ["rectangle"]),
      ]),
    );
    expect(slides.map((s) => s.kind)).toEqual(["cover", "divider", "content"]);
    expect(slides[2]).toMatchObject({
      channel: "display",
      theme: { id: "Bannières" },
    });
  });

  it("conserve une slide Meta quand deux des trois formats manquent", () => {
    const slides = buildSlides(campaign([theme("Hockey", 0, ["portrait"])]));
    expect(slides).toHaveLength(5);
    expect(slides[2]).toMatchObject({
      channel: "facebook",
      theme: { assets: [{ format: "portrait" }] },
    });
    expect(slides[4]).toMatchObject({ channel: "instagram" });
  });

  it("conserve seulement la couverture pour une campagne vide", () => {
    expect(buildSlides(campaign([]))).toEqual([{ id: "cover", kind: "cover" }]);
  });
});

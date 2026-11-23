import { BRANDS, FORMATS } from "./config";
import type { BrandId, DeckCampaign, DeckTheme } from "./types";

export type DemoScenario = "complete" | "missing" | "empty";

export function demoCampaign(
  brandId: BrandId,
  scenario: DemoScenario = "complete",
): DeckCampaign {
  const names = ["Générique", "Hockey", "AZIMUT"];
  const slugs = ["generique", "hockey", "azimut"];
  const messages = [
    "Un milieu pour apprendre, grandir et trouver sa voie. Découvrez notre collège et préparez la prochaine rentrée.",
    "La passion du hockey. L'ambition de réussir. Découvrez un parcours qui fait grandir les talents, sur la glace et en classe.",
    "Ouvrir ses horizons. Explorer, apprendre et se dépasser avec le programme AZIMUT. Une aventure qui commence ici.",
  ];
  const themes: DeckTheme[] = names.map((name, order) => ({
    id: slugs[order],
    name,
    order,
    assets: FORMATS.map((f) => ({
      id: `${slugs[order]}-${f.id}`,
      url:
        f.channel === "display"
          ? `/deck-demo/${brandId}-${f.width}x${f.height}.gif`
          : `/deck-demo/${brandId}-${slugs[order]}-${f.id}.jpg`,
      width: f.channel === "display" ? f.width : 1080,
      height:
        f.channel === "display"
          ? f.height
          : f.id === "square"
            ? 1080
            : f.id === "portrait"
              ? 1350
              : 1920,
      format: f.id,
      mime: f.channel === "display" ? "image/gif" : "image/jpeg",
    })),
    copy: Object.fromEntries(
      (["facebook", "instagram"] as const).flatMap((channel) =>
        (["square", "portrait", "vertical"] as const).map((format) => [
          `${channel}:${format}`,
          {
            primary: messages[order],
            headline: "Un avenir à votre image",
            description: "Admissions 2027-2028",
          },
        ]),
      ),
    ),
  }));
  if (scenario === "missing") {
    themes[0].assets = themes[0].assets.filter((a) => a.format !== "portrait");
    themes[1].assets = themes[1].assets.filter((a) => a.format === "portrait");
    themes[2].assets = [];
    themes[0].copy["facebook:square"] = { primary: messages[0] };
    themes[0].copy["instagram:vertical"] = {};
  }
  return {
    id: "demo",
    brandId,
    title: "Admissions 2027-2028",
    subtitle: "Annonces Meta et bannières display",
    cta: "S'inscrire",
    destination: `https://${BRANDS[brandId].domain}`,
    themes: scenario === "empty" ? [] : themes,
  };
}

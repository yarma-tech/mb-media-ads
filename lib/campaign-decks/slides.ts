import { FORMATS } from "./config";
import type { Channel, DeckCampaign, DeckSlide } from "./types";

export function buildSlides(campaign: DeckCampaign): DeckSlide[] {
  const slides: DeckSlide[] = [{ id: "cover", kind: "cover" }];
  const themes = [...campaign.themes].sort((a, b) => a.order - b.order);
  for (const channel of [
    "facebook",
    "instagram",
    "display",
  ] as const satisfies readonly Channel[]) {
    const eligible = themes.filter((t) =>
      t.assets.some((a) =>
        FORMATS.some(
          (f) =>
            f.id === a.format &&
            f.channel === (channel === "display" ? "display" : "meta"),
        ),
      ),
    );
    if (!eligible.length) continue;
    slides.push({ id: `divider-${channel}`, kind: "divider", channel });
    for (const theme of eligible)
      slides.push({
        id: `${channel}-${theme.id}`,
        kind: "content",
        channel,
        theme,
      });
  }
  return slides;
}

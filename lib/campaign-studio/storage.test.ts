import { describe, expect, it } from "vitest";
import { INITIAL_CAMPAIGNS } from "./fixtures";
import { reviewCreative, setCampaignOnAir } from "./model";
import { restoreCampaigns, serializeCampaigns } from "./storage";

describe("sauvegarde des décisions de démonstration", () => {
  it("restaure une campagne approuvée et passée On air", () => {
    const first = INITIAL_CAMPAIGNS[0];
    const live = setCampaignOnAir(
      first.creatives.reduce(
        (campaign, creative) =>
          reviewCreative(campaign, creative.id, "approved"),
        first,
      ),
    );
    const restored = restoreCampaigns(serializeCampaigns([live]));
    expect(restored[0].creatives.every((c) => c.status === "on_air")).toBe(
      true,
    );
    expect(restored[0].metrics).toEqual(first.metrics);
    expect(restored).toHaveLength(INITIAL_CAMPAIGNS.length);
  });
  it("conserve les commentaires mais jamais des statistiques ou médias injectés", () => {
    const first = INITIAL_CAMPAIGNS[0];
    const changed = reviewCreative(
      first,
      first.creatives[0].id,
      "changes_requested",
      "Agrandir le titre",
    );
    const raw = JSON.parse(serializeCampaigns([changed]));
    raw.campaigns[0].metrics = [{ impressions: 999999 }];
    raw.campaigns[0].creatives[0].image = "https://invalid.example/image.jpg";
    const restored = restoreCampaigns(JSON.stringify(raw))[0];
    expect(restored.creatives[0].comments.at(-1)?.text).toBe(
      "Agrandir le titre",
    );
    expect(restored.creatives[0].image).toBe(first.creatives[0].image);
    expect(restored.metrics).toEqual(first.metrics);
  });
  it("revient aux fixtures si le stockage est illisible ou d'une autre version", () => {
    for (const raw of [null, "{", "null", '{"version":2,"campaigns":[]}']) {
      expect(restoreCampaigns(raw)).toEqual(INITIAL_CAMPAIGNS);
    }
  });
  it("rejette une mise en ligne partielle incohérente", () => {
    const raw = JSON.parse(serializeCampaigns(INITIAL_CAMPAIGNS));
    raw.campaigns[0].creatives[0].status = "on_air";
    expect(restoreCampaigns(JSON.stringify(raw))[0]).toEqual(
      INITIAL_CAMPAIGNS[0],
    );
  });
});

it("restaure le texte et le CTA édités sans accepter un CTA inconnu", () => {
  const campaign = structuredClone(INITIAL_CAMPAIGNS[0]);
  campaign.creatives[0].copy = "Découvrez nos programmes.";
  campaign.creatives[0].cta = "Nous contacter";
  const raw = serializeCampaigns([campaign]);
  const restored = restoreCampaigns(raw)[0].creatives[0];
  expect(restored.copy).toBe("Découvrez nos programmes.");
  expect(restored.cta).toBe("Nous contacter");
  const invalid = JSON.parse(raw);
  invalid.campaigns[0].creatives[0].cta = "CTA inconnu";
  invalid.campaigns[0].creatives[0].copy = "x".repeat(2201);
  const safe = restoreCampaigns(JSON.stringify(invalid))[0].creatives[0];
  expect(safe.cta).toBeUndefined();
  expect(safe.copy).toBe(INITIAL_CAMPAIGNS[0].creatives[0].copy);
});

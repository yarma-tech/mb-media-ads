import { describe, expect, it } from "vitest";
import {
  campaignStatus,
  periodMetrics,
  returnToReview,
  reviewCreative,
  setCampaignOnAir,
  summarizeMetrics,
} from "./model";
import type { StudioCampaign } from "./types";

const campaign = (): StudioCampaign => ({
  id: "test",
  brandId: "cmsa",
  name: "Admissions",
  description: "Démo",
  dates: "Octobre",
  objective: "Inscriptions",
  budget: 1000,
  creatives: [
    {
      id: "a",
      name: "Générique",
      platform: "facebook",
      placement: "feed_square",
      image: "/test.jpg",
      status: "pending",
      copy: "Bonjour",
      comments: [],
    },
    {
      id: "b",
      name: "Hockey",
      platform: "instagram",
      placement: "reel",
      image: "/test.jpg",
      status: "approved",
      copy: "Hockey",
      comments: [],
    },
  ],
  metrics: [
    {
      date: "2026-10-01",
      platform: "facebook",
      impressions: 1000,
      clicks: 20,
      conversions: 2,
      spend: 10,
    },
    {
      date: "2026-10-22",
      platform: "instagram",
      impressions: 2000,
      clicks: 30,
      conversions: 3,
      spend: 15,
    },
  ],
});

describe("validation puis On air", () => {
  it("interdit On air tant qu'un visuel n'est pas approuvé", () => {
    expect(() => setCampaignOnAir(campaign())).toThrow();
  });
  it("approuve, met On air, puis rouvre la validation sans modifier la source", () => {
    const source = campaign();
    const approved = reviewCreative(source, "a", "approved");
    expect(campaignStatus(approved)).toBe("approved");
    const live = setCampaignOnAir(approved);
    expect(campaignStatus(live)).toBe("on_air");
    expect(live.creatives.every((c) => c.status === "on_air")).toBe(true);
    expect(campaignStatus(returnToReview(live))).toBe("pending");
    expect(source.creatives[0].status).toBe("pending");
  });
  it("exige un commentaire pour une modification et conserve l'historique après approbation", () => {
    expect(() =>
      reviewCreative(campaign(), "a", "changes_requested", " "),
    ).toThrow();
    const changed = reviewCreative(
      campaign(),
      "a",
      "changes_requested",
      "Corriger le titre",
    );
    expect(campaignStatus(changed)).toBe("changes_requested");
    expect(
      reviewCreative(changed, "a", "approved").creatives[0].comments[0].text,
    ).toBe("Corriger le titre");
  });
  it("interdit de réviser directement un visuel en diffusion", () => {
    const live = setCampaignOnAir(reviewCreative(campaign(), "a", "approved"));
    expect(() => reviewCreative(live, "a", "pending")).toThrow();
  });
  it("ne valide pas implicitement une campagne vide", () => {
    expect(() => setCampaignOnAir({ ...campaign(), creatives: [] })).toThrow();
  });
});

describe("statistiques de démonstration", () => {
  it("calcule les taux sur les totaux, pas en moyennant les ratios", () => {
    const result = summarizeMetrics(campaign().metrics);
    expect(result).toMatchObject({
      impressions: 3000,
      clicks: 50,
      conversions: 5,
      spend: 25,
      cpc: 0.5,
    });
    expect(result.ctr).toBeCloseTo(1.666666);
    expect(summarizeMetrics([])).toEqual({
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      ctr: 0,
      cpc: 0,
    });
  });
  it("filtre les périodes et les plateformes sans inclure les campagnes en validation", () => {
    const live = setCampaignOnAir(reviewCreative(campaign(), "a", "approved"));
    expect(periodMetrics([live, campaign()], "30d", "all")).toHaveLength(2);
    expect(periodMetrics([live], "7d", "all")).toHaveLength(1);
    expect(periodMetrics([live], "30d", "facebook")[0].clicks).toBe(20);
    expect(periodMetrics([live], "7d", "facebook")).toEqual([]);
  });
});

it("annule une validation individuelle sans perdre le texte ni les commentaires", () => {
  const commented = reviewCreative(campaign(), "a", "changes_requested", "Revoir le titre");
  const approved = reviewCreative(commented, "a", "approved");
  const undone = reviewCreative(approved, "a", "pending");
  expect(undone.creatives[0].status).toBe("pending");
  expect(undone.creatives[0].comments).toEqual(approved.creatives[0].comments);
  expect(undone.creatives[0].copy).toBe(approved.creatives[0].copy);
  expect(undone.creatives[1]).toEqual(approved.creatives[1]);
  expect(() => setCampaignOnAir(undone)).toThrow();
});

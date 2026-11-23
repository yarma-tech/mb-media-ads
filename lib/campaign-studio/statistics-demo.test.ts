import { describe, expect, it } from "vitest";
import {
  STATISTICS_CAMPAIGNS,
  costPerLead,
  prospectConversion,
  statisticsRanking,
  statisticsRows,
  statisticsTotals,
} from "./statistics-demo";

describe("Statistiques synthétiques, une campagne à la fois", () => {
  it("calcule prospects/impressions, sans confondre admissions et conversions", () => {
    const totals = statisticsTotals(
      statisticsRows(STATISTICS_CAMPAIGNS[0], "all"),
    );
    expect(totals).toEqual({
      leads: 142,
      admissions: 18,
      spend: 4260,
      impressions: 120000,
    });
    expect(costPerLead(totals)).toBe(30);
    expect(prospectConversion(totals)).toBeCloseTo(142 / 120000);
    expect(
      statisticsTotals(statisticsRows(STATISTICS_CAMPAIGNS[1], "all")).leads,
    ).toBe(235);
  });
  it("filtre les chiffres et le classement avec la même période", () => {
    const day = statisticsTotals(
      statisticsRows(STATISTICS_CAMPAIGNS[0], "day"),
    );
    expect(day.leads).toBe(13);
    expect(day.admissions).toBe(2);
    expect(
      statisticsRanking(STATISTICS_CAMPAIGNS, "day")[0].metrics.admissions,
    ).toBe(3);
  });
  it("limite le classement aux cinq campagnes en cours, triées par admissions puis prospects", () => {
    const source = [
      ...STATISTICS_CAMPAIGNS,
      ...Array.from({ length: 5 }, (_, i) => ({
        ...STATISTICS_CAMPAIGNS[0],
        id: `autre-${i}`,
      })),
      { ...STATISTICS_CAMPAIGNS[1], id: "terminee", end: "2026-10-29" },
      { ...STATISTICS_CAMPAIGNS[1], id: "future", start: "2026-10-31" },
    ];
    const rank = statisticsRanking(source, "all");
    expect(rank).toHaveLength(5);
    expect(rank[0].campaign.id).toBe("aec");
    expect(rank.map((r) => r.campaign.id)).not.toContain("terminee");
    expect(rank.map((r) => r.campaign.id)).not.toContain("future");
    const ties = statisticsRanking(
      [
        STATISTICS_CAMPAIGNS[0],
        { ...STATISTICS_CAMPAIGNS[0], id: "plus", leadFactor: 2 },
      ],
      "all",
    );
    expect(ties[0].campaign.id).toBe("plus");
  });
  it("ne présente pas zéro comme coût ou taux lorsqu'un dénominateur manque", () => {
    const empty = statisticsTotals([]);
    expect(costPerLead(empty)).toBeNull();
    expect(prospectConversion(empty)).toBeNull();
  });
});

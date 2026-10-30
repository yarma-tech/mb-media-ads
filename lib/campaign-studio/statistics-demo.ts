/** Presentation-only dataset. Never attributed to real workspace campaigns. */
export const STATISTICS_REFERENCE_DATE = "2026-10-30";
export type StatisticsPeriod = "all" | "day";
export interface StatisticsMetrics {
  leads: number;
  admissions: number;
  spend: number;
  impressions: number;
}
export interface StatisticsChannel extends StatisticsMetrics {
  id: string;
  name: string;
  subtitle: string;
  logo?: "facebook" | "google" | "tiktok";
}
export interface StatisticsCampaign {
  id: string;
  name: string;
  budget: number;
  start: string;
  end: string;
  dates: string;
  days: number;
  leadFactor: number;
  spendFactor: number;
  admissions: number[];
  dailyAdmissions: number[];
}
export const STATISTICS_CAMPAIGNS: StatisticsCampaign[] = [
  {
    id: "admissions",
    name: "Universel · Admissions",
    budget: 12000,
    start: "2026-09-01",
    end: "2026-10-31",
    dates: "1 sept. - 31 oct. 2026",
    days: 61,
    leadFactor: 1,
    spendFactor: 1,
    admissions: [8, 5, 1, 1, 2, 1, 0, 0],
    dailyAdmissions: [1, 1, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "aec",
    name: "Universel · AEC hiver",
    budget: 24000,
    start: "2026-10-15",
    end: "2026-11-15",
    dates: "15 oct. - 15 nov. 2026",
    days: 32,
    leadFactor: 1.65,
    spendFactor: 1.9,
    admissions: [14, 12, 4, 2, 2, 1, 1, 0],
    dailyAdmissions: [2, 1, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "jpo",
    name: "Universel · Portes ouvertes",
    budget: 8000,
    start: "2026-10-01",
    end: "2026-10-30",
    dates: "1 oct. - 30 oct. 2026",
    days: 30,
    leadFactor: 0.55,
    spendFactor: 0.68,
    admissions: [4, 3, 1, 0, 1, 0, 0, 0],
    dailyAdmissions: [0, 0, 0, 0, 0, 0, 0, 0],
  },
];
const channels: Omit<StatisticsChannel, "admissions">[] = [
  {
    id: "meta",
    name: "Meta Ads",
    subtitle: "Facebook · Instagram",
    leads: 64,
    spend: 1920,
    impressions: 48000,
    logo: "facebook",
  },
  {
    id: "google",
    name: "Google Ads",
    subtitle: "Search · YouTube · Display",
    leads: 36,
    spend: 1080,
    impressions: 24000,
    logo: "google",
  },
  {
    id: "tiktok",
    name: "TikTok",
    subtitle: "Vidéo",
    leads: 12,
    spend: 240,
    impressions: 16000,
    logo: "tiktok",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    subtitle: "Social",
    leads: 8,
    spend: 160,
    impressions: 10000,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    subtitle: "Social professionnel",
    leads: 10,
    spend: 400,
    impressions: 6000,
  },
  {
    id: "openai",
    name: "OpenAI Ads",
    subtitle: "ChatGPT",
    leads: 6,
    spend: 180,
    impressions: 5000,
  },
  {
    id: "bell",
    name: "Bell Média",
    subtitle: "Display · Vidéo",
    leads: 4,
    spend: 160,
    impressions: 7000,
  },
  {
    id: "lapresse",
    name: "La Presse",
    subtitle: "Display · Natif",
    leads: 2,
    spend: 120,
    impressions: 4000,
  },
];
export function statisticsRows(
  campaign: StatisticsCampaign,
  period: StatisticsPeriod,
): StatisticsChannel[] {
  const daily = period === "day";
  return channels.map((row, i) => ({
    ...row,
    admissions: (daily ? campaign.dailyAdmissions : campaign.admissions)[i],
    leads: Math.round(
      (daily ? [6, 4, 1, 1, 1, 0, 0, 0][i] : row.leads) * campaign.leadFactor,
    ),
    spend:
      (daily ? [126, 75, 18, 14, 32, 12, 10, 8][i] : row.spend) *
      campaign.spendFactor,
    impressions: Math.round(
      (daily
        ? [3300, 1800, 1200, 800, 450, 400, 450, 300][i]
        : row.impressions) * campaign.leadFactor,
    ),
  }));
}
export function statisticsTotals(rows: StatisticsMetrics[]): StatisticsMetrics {
  return rows.reduce(
    (a, r) => ({
      leads: a.leads + r.leads,
      admissions: a.admissions + r.admissions,
      spend: a.spend + r.spend,
      impressions: a.impressions + r.impressions,
    }),
    { leads: 0, admissions: 0, spend: 0, impressions: 0 },
  );
}
export function costPerLead(metrics: StatisticsMetrics): number | null {
  return metrics.leads ? metrics.spend / metrics.leads : null;
}
export function prospectConversion(metrics: StatisticsMetrics): number | null {
  return metrics.impressions ? metrics.leads / metrics.impressions : null;
}
export function statisticsRanking(
  campaigns: StatisticsCampaign[],
  period: StatisticsPeriod,
) {
  return campaigns
    .filter(
      (c) =>
        c.start <= STATISTICS_REFERENCE_DATE &&
        c.end >= STATISTICS_REFERENCE_DATE,
    )
    .map((campaign) => ({
      campaign,
      metrics: statisticsTotals(statisticsRows(campaign, period)),
    }))
    .sort(
      (a, b) =>
        b.metrics.admissions - a.metrics.admissions ||
        b.metrics.leads - a.metrics.leads ||
        a.campaign.name.localeCompare(b.campaign.name, "fr"),
    )
    .slice(0, 5);
}

import type {
  CampaignStatus,
  CreativeStatus,
  MetricDay,
  Metrics,
  Period,
  PlatformFilter,
  StudioCampaign,
} from "./types";

export const DEMO_DATE = "2026-10-22";
export const PLATFORM_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  display: "Display",
} as const;
export const PLACEMENT_LABELS = {
  feed_square: "Fil · 1:1",
  feed_portrait: "Fil · 4:5",
  reel: "Reels · 9:16",
  youtube_instream: "In-stream · 16:9",
  display_billboard: "Bannière · 970 × 250",
} as const;
export const number = (value: number) =>
  new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 0 }).format(value);
export const money = (value: number) =>
  new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 2,
  }).format(value);
export const percent = (value: number) =>
  new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 2 }).format(value) +
  " %";

export function campaignStatus(campaign: StudioCampaign): CampaignStatus {
  const statuses = campaign.creatives.map((c) => c.status);
  if (!statuses.length) return "pending";
  if (statuses.every((s) => s === "on_air")) return "on_air";
  if (statuses.some((s) => s === "changes_requested"))
    return "changes_requested";
  if (statuses.every((s) => s === "approved")) return "approved";
  return "pending";
}
export function reviewCreative(
  campaign: StudioCampaign,
  id: string,
  status: Exclude<CreativeStatus, "on_air">,
  comment?: string,
): StudioCampaign {
  const creative = campaign.creatives.find((c) => c.id === id);
  if (!creative) throw new Error("Visuel introuvable.");
  if (creative.status === "on_air")
    throw new Error("Revenez en validation avant de modifier ce visuel.");
  const text = comment?.trim().replace(/\u2014/g, "-");
  if (status === "changes_requested" && !text)
    throw new Error("Ajoutez un commentaire pour préciser la modification.");
  return {
    ...campaign,
    creatives: campaign.creatives.map((c) =>
      c.id === id
        ? {
            ...c,
            status,
            comments: text
              ? [
                  ...c.comments,
                  {
                    id: crypto.randomUUID(),
                    author: "Vous",
                    text,
                    date: new Date().toISOString(),
                  },
                ]
              : c.comments,
          }
        : c,
    ),
  };
}
export function setCampaignOnAir(campaign: StudioCampaign): StudioCampaign {
  if (campaignStatus(campaign) !== "approved")
    throw new Error(
      "Tous les visuels doivent être approuvés avant la mise On air.",
    );
  return {
    ...campaign,
    creatives: campaign.creatives.map((c) => ({ ...c, status: "on_air" })),
  };
}
export function returnToReview(campaign: StudioCampaign): StudioCampaign {
  return {
    ...campaign,
    creatives: campaign.creatives.map((c) => ({ ...c, status: "pending" })),
  };
}
export function periodMetrics(
  campaigns: StudioCampaign[],
  period: Period,
  platform: PlatformFilter,
): MetricDay[] {
  const start = new Date(`${DEMO_DATE}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - (period === "7d" ? 6 : 29));
  const from = start.toISOString().slice(0, 10);
  return campaigns
    .filter((c) => campaignStatus(c) === "on_air")
    .flatMap((c) => c.metrics)
    .filter(
      (d) =>
        d.date >= from &&
        d.date <= DEMO_DATE &&
        (platform === "all" || d.platform === platform),
    );
}
export function summarizeMetrics(days: MetricDay[]): Metrics {
  const sum = days.reduce(
    (totals, day) => ({
      impressions: totals.impressions + day.impressions,
      clicks: totals.clicks + day.clicks,
      conversions: totals.conversions + day.conversions,
      spend: totals.spend + day.spend,
    }),
    { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
  );
  return {
    ...sum,
    spend: Math.round(sum.spend * 100) / 100,
    ctr: sum.impressions ? (100 * sum.clicks) / sum.impressions : 0,
    cpc: sum.clicks ? sum.spend / sum.clicks : 0,
  };
}

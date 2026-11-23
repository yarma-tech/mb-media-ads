import { INITIAL_CAMPAIGNS } from "./fixtures";
import type { CreativeStatus, StudioCampaign, StudioComment } from "./types";

export const STORAGE_KEY = "mb-media:campaign-studio:v1";
const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const statuses: readonly CreativeStatus[] = [
  "pending",
  "approved",
  "changes_requested",
  "on_air",
];

// Restore editable copy and decisions; assets and metrics remain trusted fixtures.
export function restoreCampaigns(raw: string | null): StudioCampaign[] {
  if (!raw) return INITIAL_CAMPAIGNS;
  try {
    const stored: unknown = JSON.parse(raw);
    if (
      !isObject(stored) ||
      stored.version !== 1 ||
      !Array.isArray(stored.campaigns)
    )
      return INITIAL_CAMPAIGNS;
    const saved = stored.campaigns;
    return INITIAL_CAMPAIGNS.map((campaign) => {
      const match: unknown = saved.find(
        (c) => isObject(c) && c.id === campaign.id,
      );
      if (!isObject(match) || !Array.isArray(match.creatives)) return campaign;
      const entries = match.creatives;
      const creatives = campaign.creatives.map((creative) => {
        const entry: unknown = entries.find(
          (c) => isObject(c) && c.id === creative.id,
        );
        if (
          !isObject(entry) ||
          !statuses.includes(entry.status as CreativeStatus) ||
          !Array.isArray(entry.comments)
        )
          return creative;
        const comments = entry.comments.filter(
          (c): c is StudioComment =>
            isObject(c) &&
            typeof c.id === "string" &&
            typeof c.author === "string" &&
            typeof c.text === "string" &&
            typeof c.date === "string" &&
            Number.isFinite(Date.parse(c.date)),
        );
        return {
          ...creative,
          copy:
            typeof entry.copy === "string" &&
            entry.copy.trim() &&
            entry.copy.length <= 2200
              ? entry.copy
              : creative.copy,
          cta:
            typeof entry.cta === "string" &&
            [
              "S’inscrire",
              "En savoir plus",
              "Nous contacter",
              "Réserver",
            ].includes(entry.cta)
              ? entry.cta
              : creative.cta,
          status: entry.status as CreativeStatus,
          comments,
        };
      });
      if (
        creatives.some((c) => c.status === "on_air") &&
        !creatives.every((c) => c.status === "on_air")
      )
        return campaign;
      return { ...campaign, creatives };
    });
  } catch {
    return INITIAL_CAMPAIGNS;
  }
}

export function serializeCampaigns(campaigns: StudioCampaign[]) {
  return JSON.stringify({
    version: 1,
    campaigns: campaigns.map((c) => ({
      id: c.id,
      creatives: c.creatives.map((a) => ({
        id: a.id,
        copy: a.copy,
        cta: a.cta,
        status: a.status,
        comments: a.comments,
      })),
    })),
  });
}

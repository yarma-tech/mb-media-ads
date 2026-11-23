import type { BrandId } from "../campaign-decks/types";

export type Platform = "facebook" | "instagram" | "youtube" | "display";
export type CreativeStatus =
  "pending" | "approved" | "changes_requested" | "on_air";
export type CampaignStatus = CreativeStatus;
export type Placement =
  | "feed_square"
  | "feed_portrait"
  | "reel"
  | "youtube_instream"
  | "display_billboard";
export type BrandFilter = BrandId | "all";
export type PlatformFilter = Platform | "all";
export type Period = "7d" | "30d";

export interface StudioComment {
  id: string;
  author: string;
  text: string;
  date: string;
}
export interface Creative {
  id: string;
  name: string;
  platform: Platform;
  placement: Placement;
  image: string;
  status: CreativeStatus;
  copy: string;
  cta?: string;
  comments: StudioComment[];
}
export interface MetricDay {
  date: string;
  platform: Platform;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}
export interface StudioCampaign {
  id: string;
  brandId: BrandId;
  name: string;
  description: string;
  dates: string;
  objective: string;
  budget: number;
  creatives: Creative[];
  metrics: MetricDay[];
}
export interface Metrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  ctr: number;
  cpc: number;
}

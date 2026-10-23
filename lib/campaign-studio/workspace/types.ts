export type Channel =
  "facebook" | "instagram" | "tiktok" | "youtube" | "display" | "google";
export type Actor =
  | { kind: "human"; id: string; name: string; role: "preparer" | "validator" }
  | { kind: "agent"; id: string; name: string; role: "preparer" };
export type AdStatus =
  "draft" | "pending" | "approved" | "changes_requested" | "on_air" | "stopped";
export type StopReason = "replaced" | "manual" | "campaign_finished";
export type AdFields = {
  name: string;
  copy: string;
  headline: string;
  descriptions: string[];
  headlines: string[];
  cta: string;
  url: string;
  mediaId: string | null;
  path1: string;
  path2: string;
};
export interface Event {
  id: string;
  at: string;
  actorId: string;
  actorName: string;
  action: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}
export interface Ad extends AdFields {
  brandSnapshot?: Brand;
  id: string;
  familyId: string;
  version: number;
  channel: Channel;
  format: string;
  status: AdStatus;
  stopReason: StopReason | null;
  createdBy: string;
  revision: number;
  history: Event[];
  comments: { text: string; author: string; at: string }[];
}
export interface Media {
  id: string;
  name: string;
  path: string;
  mime: string;
  bytes: number;
  width: number;
  height: number;
  duration: number | null;
  channel: Channel;
  state: "uploading" | "ready" | "invalid";
  errors: string[];
}
export interface Brand {
  id: string;
  name: string;
  logo: string;
  website: string;
}
export interface Campaign {
  id: string;
  name: string;
  brandId: string | null;
  defaultUrl: string;
  startDate: string | null;
  endDate: string | null;
  status: "active" | "finished";
  createdBy: string;
  revision: number;
  ads: Ad[];
  media: Media[];
  history: Event[];
}

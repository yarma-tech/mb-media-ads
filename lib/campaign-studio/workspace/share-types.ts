import type { Ad, Brand, Campaign, Media } from "./types";
export type SharedAd = Pick<
  Ad,
  | "id"
  | "channel"
  | "format"
  | "copy"
  | "headline"
  | "headlines"
  | "descriptions"
  | "cta"
  | "url"
  | "mediaId"
  | "path1"
  | "path2"
  | "theme"
  | "brandSnapshot"
>;
export type SharedMedia = Pick<
  Media,
  "id" | "mime" | "width" | "height" | "duration" | "name" | "state"
>;
export type PreviewCampaign = Pick<Campaign, "brandId" | "defaultUrl"> & {
  media: SharedMedia[];
};
export interface SharedCampaign extends PreviewCampaign {
  name: string;
  ads: SharedAd[];
}
export interface PublicPresentation {
  campaign: SharedCampaign;
  brands: Brand[];
  mediaUrls: Record<string, string>;
}

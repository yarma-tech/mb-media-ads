export type BrandId = "cmsa" | "cu";
export type DeckVersion = "visuals" | "copy";
export type Channel = "facebook" | "instagram" | "display";
export type MetaFormat = "square" | "portrait" | "vertical";
export type DisplayFormat =
  "billboard" | "leaderboard" | "skyscraper" | "rectangle" | "mobile";
export type AssetFormat = MetaFormat | DisplayFormat | "unclassified";
export type ReviewStatus = "pending" | "approved" | "changes_requested";

export interface Brand {
  id: BrandId;
  name: string;
  pageName: string;
  avatar: string;
  logo: string;
  domain: string;
  dark: string;
  accent: string;
  onAccent: string;
}

export interface DeckAsset {
  id: string;
  url: string;
  width: number;
  height: number;
  format: AssetFormat;
  mime: "image/jpeg" | "image/png" | "image/gif";
}

export interface AdCopy {
  primary?: string;
  headline?: string;
  description?: string;
  cta?: string;
}

export interface DeckTheme {
  id: string;
  name: string;
  order: number;
  assets: DeckAsset[];
  copy: Partial<Record<`${Exclude<Channel, "display">}:${MetaFormat}`, AdCopy>>;
}

export interface DeckCampaign {
  id: string;
  brandId: BrandId;
  title: string;
  subtitle: string;
  cta: string;
  destination: string;
  themes: DeckTheme[];
}

export type DeckSlide =
  | { id: string; kind: "cover" }
  | { id: string; kind: "divider"; channel: Channel }
  | { id: string; kind: "content"; channel: Channel; theme: DeckTheme };

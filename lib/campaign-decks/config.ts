import type { AssetFormat, Brand, BrandId, Channel } from "./types";

export const BRANDS: Record<BrandId, Brand> = {
  cmsa: {
    id: "cmsa",
    name: "CMSA",
    pageName: "Collège du Mont-Sainte-Anne",
    avatar: "/deck-demo/cmsa-avatar.svg",
    logo: "/deck-demo/cmsa-logo.svg",
    domain: "collegecmsa.ca",
    dark: "#202741",
    accent: "#FFC501",
    onAccent: "#202741",
  },
  cu: {
    id: "cu",
    name: "Collège Universel",
    pageName: "Collège Universel",
    avatar: "/deck-demo/cu-avatar.svg",
    logo: "/deck-demo/cu-logo.svg",
    domain: "collegeuniversel.ca",
    dark: "#116F3A",
    accent: "#96BA24",
    onAccent: "#116F3A",
  },
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  display: "Bannières GIF",
};

export const FORMATS = [
  {
    id: "billboard",
    width: 970,
    height: 250,
    label: "970 × 250",
    channel: "display",
  },
  {
    id: "leaderboard",
    width: 728,
    height: 90,
    label: "728 × 90",
    channel: "display",
  },
  {
    id: "skyscraper",
    width: 300,
    height: 600,
    label: "300 × 600",
    channel: "display",
  },
  {
    id: "rectangle",
    width: 300,
    height: 250,
    label: "300 × 250",
    channel: "display",
  },
  {
    id: "mobile",
    width: 320,
    height: 100,
    label: "320 × 100",
    channel: "display",
  },
  { id: "square", width: 1, height: 1, label: "1:1", channel: "meta" },
  { id: "portrait", width: 4, height: 5, label: "4:5", channel: "meta" },
  { id: "vertical", width: 9, height: 16, label: "9:16", channel: "meta" },
] as const;

export function classifyFormat(width: number, height: number): AssetFormat {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return "unclassified";
  const exact = FORMATS.find(
    (f) => f.channel === "display" && f.width === width && f.height === height,
  );
  if (exact) return exact.id;
  const ratio = width / height;
  return (
    FORMATS.find(
      (f) =>
        f.channel === "meta" &&
        Math.abs(ratio / (f.width / f.height) - 1) <= 0.01 + Number.EPSILON,
    )?.id ?? "unclassified"
  );
}

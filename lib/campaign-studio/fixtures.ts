import type { BrandId } from "../campaign-decks/types";
import { DEMO_DATE } from "./model";
import type {
  Creative,
  CreativeStatus,
  MetricDay,
  Placement,
  Platform,
  StudioCampaign,
} from "./types";

const copy = {
  generique:
    "Un milieu pour apprendre, grandir et trouver sa voie. Découvrez notre collège et préparez la prochaine rentrée.",
  hockey:
    "La passion du hockey. L'ambition de réussir. Un parcours pour grandir sur la glace et en classe.",
  azimut:
    "Votre avenir commence par une rencontre. Découvrez un milieu qui vous ressemble et des possibilités qui vous inspirent.",
};
function creative(
  id: string,
  brand: BrandId,
  theme: keyof typeof copy,
  platform: Platform,
  placement: Placement,
  status: CreativeStatus,
): Creative {
  const format =
    placement === "reel"
      ? "vertical"
      : placement === "feed_portrait"
        ? "portrait"
        : "square";
  return {
    id,
    name: { generique: "Générique", hockey: "Hockey", azimut: "Découverte" }[
      theme
    ],
    platform,
    placement,
    status,
    copy: copy[theme],
    comments: [],
    image:
      platform === "display"
        ? `/deck-demo/${brand}-970x250.gif`
        : `/deck-demo/${brand}-${theme}-${format}.jpg`,
  };
}
function metrics(platforms: Platform[], seed: number): MetricDay[] {
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(`${DEMO_DATE}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 29 + index);
    return platforms.map((platform, n) => {
      const impressions = Math.round(
        (1900 + seed * 370 + index * 58 + Math.sin(index * 0.8 + seed) * 510) /
          platforms.length,
      );
      const clicks = Math.round(
        impressions * (0.018 + seed * 0.002 + n * 0.003),
      );
      return {
        date: date.toISOString().slice(0, 10),
        platform,
        impressions,
        clicks,
        conversions: Math.round(clicks * 0.055),
        spend: Math.round(impressions * 0.009 * 100) / 100,
      };
    });
  }).flat();
}
export const INITIAL_CAMPAIGNS: StudioCampaign[] = [
  {
    id: "cmsa-admissions",
    brandId: "cmsa",
    name: "Admissions 2027-2028",
    description: "Une nouvelle année. Toutes les possibilités.",
    dates: "1 nov. - 15 déc. 2026",
    objective: "Demandes d'admission",
    budget: 4500,
    creatives: [
      creative(
        "admissions-fb",
        "cmsa",
        "generique",
        "facebook",
        "feed_square",
        "pending",
      ),
      creative(
        "admissions-ig",
        "cmsa",
        "hockey",
        "instagram",
        "reel",
        "approved",
      ),
      creative(
        "admissions-display",
        "cmsa",
        "generique",
        "display",
        "display_billboard",
        "approved",
      ),
    ],
    metrics: [],
  },
  {
    id: "cu-decouverte",
    brandId: "cu",
    name: "Un avenir à votre image",
    description: "Faire découvrir les parcours du Collège Universel.",
    dates: "5 nov. - 20 déc. 2026",
    objective: "Notoriété",
    budget: 3200,
    creatives: [
      creative(
        "decouverte-yt",
        "cu",
        "azimut",
        "youtube",
        "youtube_instream",
        "pending",
      ),
      creative(
        "decouverte-ig",
        "cu",
        "generique",
        "instagram",
        "feed_square",
        "pending",
      ),
    ],
    metrics: [],
  },
  {
    id: "cmsa-hockey",
    brandId: "cmsa",
    name: "Sport-études hockey",
    description: "Le talent se travaille, sur la glace comme en classe.",
    dates: "10 nov. - 10 déc. 2026",
    objective: "Inscriptions",
    budget: 2400,
    creatives: [
      {
        ...creative(
          "hockey-fb",
          "cmsa",
          "hockey",
          "facebook",
          "feed_portrait",
          "changes_requested",
        ),
        comments: [
          {
            id: "comment-demo",
            author: "Direction marketing",
            text: "Mettre davantage en valeur l'accompagnement scolaire dans le texte.",
            date: "2026-10-21T15:30:00Z",
          },
        ],
      },
    ],
    metrics: [],
  },
  {
    id: "cu-aec",
    brandId: "cu",
    name: "AEC · Hiver 2027",
    description: "Un nouveau départ professionnel.",
    dates: "1 nov. - 31 déc. 2026",
    objective: "Demandes d'information",
    budget: 3800,
    creatives: [
      creative(
        "aec-fb",
        "cu",
        "generique",
        "facebook",
        "feed_square",
        "approved",
      ),
      creative(
        "aec-ig",
        "cu",
        "azimut",
        "instagram",
        "feed_square",
        "approved",
      ),
    ],
    metrics: [],
  },
  {
    id: "cu-automne",
    brandId: "cu",
    name: "Votre prochaine étape",
    description: "Des programmes concrets. Un avenir qui vous ressemble.",
    dates: "23 sept. - 31 oct. 2026",
    objective: "Demandes d'information",
    budget: 4500,
    creatives: [
      creative(
        "automne-fb",
        "cu",
        "generique",
        "facebook",
        "feed_square",
        "on_air",
      ),
      creative(
        "automne-ig",
        "cu",
        "azimut",
        "instagram",
        "feed_square",
        "on_air",
      ),
    ],
    metrics: metrics(["facebook", "instagram"], 1),
  },
  {
    id: "cmsa-portes",
    brandId: "cmsa",
    name: "Portes ouvertes",
    description: "Une visite pour imaginer la suite.",
    dates: "23 sept. - 2 nov. 2026",
    objective: "Inscriptions aux portes ouvertes",
    budget: 2800,
    creatives: [
      creative(
        "portes-yt",
        "cmsa",
        "azimut",
        "youtube",
        "youtube_instream",
        "on_air",
      ),
    ],
    metrics: metrics(["youtube"], 2),
  },
  {
    id: "cmsa-rayonnement",
    brandId: "cmsa",
    name: "Ici, tout commence",
    description: "Le collège, au cœur de votre prochaine aventure.",
    dates: "23 sept. - 15 nov. 2026",
    objective: "Visites du site",
    budget: 2200,
    creatives: [
      creative(
        "rayonnement-display",
        "cmsa",
        "generique",
        "display",
        "display_billboard",
        "on_air",
      ),
    ],
    metrics: metrics(["display"], 3),
  },
];

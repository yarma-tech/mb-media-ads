// Module Social Ads — types & référentiels partagés (client + serveur).

export const PLATEFORMES = ["facebook", "instagram", "linkedin", "tiktok"] as const;
export type Plateforme = (typeof PLATEFORMES)[number];

export const PLATEFORME_LABEL: Record<Plateforme, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

export const FORMATS = ["feed_image", "feed_carrousel", "feed_video", "story", "reel"] as const;
export type Format = (typeof FORMATS)[number];

export const FORMAT_LABEL: Record<Format, string> = {
  feed_image: "Fil — image",
  feed_carrousel: "Fil — carrousel",
  feed_video: "Fil — vidéo",
  story: "Story",
  reel: "Reel / Vidéo verticale",
};

// Formats proposés par plateforme (pour restreindre l'UI).
export const FORMATS_PAR_PLATEFORME: Record<Plateforme, Format[]> = {
  facebook: ["feed_image", "feed_carrousel", "feed_video", "story"],
  instagram: ["feed_image", "feed_carrousel", "feed_video", "story", "reel"],
  linkedin: ["feed_image", "feed_carrousel", "feed_video"],
  tiktok: ["reel"],
};

// Boutons d'appel à l'action courants (libellés FR).
export const CTAS = [
  "En savoir plus",
  "Acheter",
  "S'inscrire",
  "Télécharger",
  "Réserver",
  "Contactez-nous",
  "Voir plus",
  "S'abonner",
] as const;

export type MediaType = "image" | "video" | "gif";
export type Media = {
  type: MediaType;
  url: string;
  largeur?: number;
  hauteur?: number;
};

export const RATIOS = ["1:1", "4:5", "1.91:1", "9:16"] as const;
export type Ratio = (typeof RATIOS)[number];

// Valeur numérique largeur/hauteur pour la boîte média.
export const RATIO_VALUE: Record<Ratio, number> = {
  "1:1": 1,
  "4:5": 0.8,
  "1.91:1": 1.91,
  "9:16": 0.5625,
};

export type Ad = {
  id: string;
  plan_id: string;
  ordre: number;
  plateforme: Plateforme;
  format: Format;
  ratio: Ratio;
  marque_nom: string | null;
  marque_handle: string | null;
  marque_logo: string | null;
  texte_principal: string | null;
  titre: string | null;
  description: string | null;
  cta: string | null;
  lien_libelle: string | null;
  medias: Media[];
  created_at: string;
  updated_at: string;
};

export type PlanStatut = "brouillon" | "en_revue" | "approuve";

export type Plan = {
  id: string;
  user_id: string;
  nom: string;
  client_nom: string | null;
  statut: PlanStatut;
  created_at: string;
  updated_at: string;
};

export type ShareLink = {
  id: string;
  plan_id: string;
  token: string;
  actif: boolean;
  expire_le: string | null;
  created_at: string;
};

export type Comment = {
  id: string;
  plan_id: string;
  ad_id: string | null;
  auteur: string;
  corps: string;
  resolu: boolean;
  created_at: string;
};

export type Decision = "approuve" | "revision";
export type Approval = {
  id: string;
  plan_id: string;
  ad_id: string;
  relecteur: string;
  decision: Decision;
  created_at: string;
};

export const PLAN_STATUT_LABEL: Record<PlanStatut, string> = {
  brouillon: "Brouillon",
  en_revue: "En revue",
  approuve: "Approuvé",
};

// ---------------------------------------------------------------------------
// Référentiel de specs par (plateforme × format).
// Source : specs publicitaires officielles 2026 (Meta / LinkedIn / TikTok).
//   texteShown = nb de caractères affichés avant « … Voir plus »
//   texteMax   = plafond dur du champ
//   texteHard  = coupe dure sans « Voir plus » (TikTok)
//   titreMax   = plafond du titre ; titreHard = coupe dure (LinkedIn)
//   ratios     = ratios d'image autorisés (le 1er est le défaut)
//   safeZone   = fractions (0..1) à laisser libres de texte (formats verticaux)
// ---------------------------------------------------------------------------
export type FormatSpec = {
  texteShown: number;
  texteMax: number;
  texteHard: boolean;
  titreMax: number;
  titreHard: boolean;
  ratios: Ratio[];
  resolution: string;
  safeZone?: { top: number; right: number; bottom: number };
};

const META_FEED = { texteShown: 125, texteMax: 63206, texteHard: false, titreMax: 40, titreHard: true };
const META_SAFE = { top: 0.14, right: 0.06, bottom: 0.2 };

export const SPECS: Record<Plateforme, Partial<Record<Format, FormatSpec>>> = {
  facebook: {
    feed_image: { ...META_FEED, ratios: ["1:1", "4:5", "1.91:1"], resolution: "1080×1080" },
    feed_carrousel: { ...META_FEED, titreMax: 40, ratios: ["1:1"], resolution: "1080×1080" },
    feed_video: { ...META_FEED, ratios: ["1:1", "4:5", "1.91:1"], resolution: "1080×1080" },
    story: { ...META_FEED, ratios: ["9:16"], resolution: "1080×1920", safeZone: META_SAFE },
  },
  instagram: {
    feed_image: { texteShown: 125, texteMax: 2200, texteHard: false, titreMax: 40, titreHard: true, ratios: ["1:1", "4:5"], resolution: "1080×1080" },
    feed_carrousel: { texteShown: 125, texteMax: 2200, texteHard: false, titreMax: 40, titreHard: true, ratios: ["1:1", "4:5"], resolution: "1080×1080" },
    feed_video: { texteShown: 125, texteMax: 2200, texteHard: false, titreMax: 40, titreHard: true, ratios: ["1:1", "4:5"], resolution: "1080×1080" },
    story: { texteShown: 125, texteMax: 2200, texteHard: false, titreMax: 40, titreHard: true, ratios: ["9:16"], resolution: "1080×1920", safeZone: META_SAFE },
    reel: { texteShown: 125, texteMax: 2200, texteHard: false, titreMax: 40, titreHard: true, ratios: ["9:16"], resolution: "1080×1920", safeZone: META_SAFE },
  },
  linkedin: {
    feed_image: { texteShown: 150, texteMax: 600, texteHard: false, titreMax: 70, titreHard: true, ratios: ["1.91:1", "1:1", "4:5"], resolution: "1200×627" },
    feed_carrousel: { texteShown: 255, texteMax: 600, texteHard: false, titreMax: 45, titreHard: true, ratios: ["1:1"], resolution: "1080×1080" },
    feed_video: { texteShown: 150, texteMax: 600, texteHard: false, titreMax: 70, titreHard: true, ratios: ["1:1", "4:5", "1.91:1"], resolution: "1200×627" },
  },
  tiktok: {
    reel: { texteShown: 50, texteMax: 100, texteHard: true, titreMax: 0, titreHard: true, ratios: ["9:16"], resolution: "1080×1920", safeZone: { top: 0.1, right: 0.1, bottom: 0.2 } },
  },
};

// Spec effective d'une annonce, avec repli raisonnable si le couple est absent.
export function getSpec(plateforme: Plateforme, format: Format): FormatSpec {
  const s = SPECS[plateforme]?.[format];
  if (s) return s;
  const anyFormat = Object.values(SPECS[plateforme])[0];
  return (
    anyFormat ?? {
      texteShown: 125,
      texteMax: 2200,
      texteHard: false,
      titreMax: 40,
      titreHard: true,
      ratios: ["1:1"],
      resolution: "1080×1080",
    }
  );
}

// Ratios d'image proposables pour un format donné.
export function getAllowedRatios(plateforme: Plateforme, format: Format): Ratio[] {
  return getSpec(plateforme, format).ratios;
}

// Tronque un texte à `shown` caractères en respectant les mots (pour « Voir plus »).
export function tronquer(texte: string, shown: number): { visible: string; coupe: boolean } {
  if (texte.length <= shown) return { visible: texte, coupe: false };
  const brut = texte.slice(0, shown);
  const espace = brut.lastIndexOf(" ");
  return { visible: (espace > shown * 0.6 ? brut.slice(0, espace) : brut).trimEnd(), coupe: true };
}

// Génère un token public court et non devinable pour un lien de partage.
export function genererToken(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

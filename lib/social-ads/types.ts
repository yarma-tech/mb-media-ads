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

export type Ad = {
  id: string;
  plan_id: string;
  ordre: number;
  plateforme: Plateforme;
  format: Format;
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

// Limites de caractères indicatives par plateforme (aide à la rédaction / LLM).
export const LIMITES: Record<Plateforme, { texte_principal: number; titre: number }> = {
  facebook: { texte_principal: 500, titre: 40 },
  instagram: { texte_principal: 300, titre: 40 },
  linkedin: { texte_principal: 600, titre: 70 },
  tiktok: { texte_principal: 150, titre: 40 },
};

// Génère un token public court et non devinable pour un lien de partage.
export function genererToken(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

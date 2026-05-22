import type { Catalogue } from "./types";

// Catalogue de secours (utilisé tant que Supabase n'est pas connecté).
// Calqué EXACTEMENT sur data/enrich_dataset.py (dict PROGRAMMES) et sur la
// migration supabase/migrations/20260522090002_seed_catalogue.sql.
export const CATALOGUE_SEED: Catalogue = {
  medias: [
    {
      id: "karata",
      nom: "Karata",
      description:
        "Média grand public ancré sur le Carnaval de Guadeloupe (haute saison T1). Audience large.",
      qsTypique: 7.5,
    },
    {
      id: "lumen",
      nom: "Lumen",
      description:
        "Média premium / professionnel. Formats longs (YouTube/Spotify), cible Professionnel, prix élevé.",
      qsTypique: 8.0,
    },
    {
      id: "pulse",
      nom: "Pulse",
      description:
        "Média jeune / social. Formats courts (TikTok/Instagram), cible Gamers/Kids, forte fréquence.",
      qsTypique: 6.8,
    },
  ],
  programmes: [
    { id: "inside-mas", mediaId: "karata", nom: "INSIDE MAS", cadenceParMois: 8, plateformes: ["YouTube", "Facebook", "Instagram"] },
    { id: "live", mediaId: "karata", nom: "LIVE", cadenceParMois: 4, plateformes: ["YouTube", "Facebook"] },
    { id: "karata-tour", mediaId: "karata", nom: "KARATA TOUR", cadenceParMois: 4, plateformes: ["YouTube", "Facebook", "Instagram"] },
    { id: "moun-a-mas", mediaId: "karata", nom: "MOUN A MAS", cadenceParMois: 6, plateformes: ["Facebook", "Instagram"] },
    { id: "fwet-a-mas", mediaId: "karata", nom: "FWET A MAS", cadenceParMois: 6, plateformes: ["YouTube", "TikTok", "Instagram"] },
    { id: "mizik-a", mediaId: "karata", nom: "MIZIK A", cadenceParMois: 8, plateformes: ["Spotify", "YouTube"] },
    { id: "video-partenaire", mediaId: "karata", nom: "VIDEO PARTENAIRE", cadenceParMois: 4, plateformes: ["YouTube", "Facebook"] },
    { id: "eco-matin", mediaId: "lumen", nom: "ECO MATIN", cadenceParMois: 12, plateformes: ["YouTube", "Spotify", "Facebook"] },
    { id: "grand-format", mediaId: "lumen", nom: "GRAND FORMAT", cadenceParMois: 2, plateformes: ["YouTube"] },
    { id: "tech-and-co", mediaId: "lumen", nom: "TECH & CO", cadenceParMois: 4, plateformes: ["YouTube", "Spotify"] },
    { id: "sante-plus", mediaId: "lumen", nom: "SANTÉ PLUS", cadenceParMois: 4, plateformes: ["Facebook", "YouTube"] },
    { id: "pulse-daily", mediaId: "pulse", nom: "PULSE DAILY", cadenceParMois: 30, plateformes: ["TikTok", "Instagram"] },
    { id: "game-on", mediaId: "pulse", nom: "GAME ON", cadenceParMois: 16, plateformes: ["TikTok", "YouTube"] },
    { id: "street-food", mediaId: "pulse", nom: "STREET FOOD", cadenceParMois: 12, plateformes: ["Instagram", "TikTok", "Facebook"] },
    { id: "vibe-check", mediaId: "pulse", nom: "VIBE CHECK", cadenceParMois: 16, plateformes: ["TikTok", "Instagram"] },
  ],
};

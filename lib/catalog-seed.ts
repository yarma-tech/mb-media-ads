import type { Catalogue } from "./types";

// Inventaire des plateformes numériques (valeurs du dataset data/dataset_ml_final.xlsx).
// audienceTypiqueK = audience moyenne observée par plateforme (data/fit_models.py).
export const CATALOGUE_SEED: Catalogue = {
  plateformes: [
    {
      id: "Meta",
      nom: "Meta",
      description: "Facebook & Instagram. Large portée, ciblage social fin.",
      audienceTypiqueK: 330,
    },
    {
      id: "TikTok",
      nom: "TikTok",
      description: "Vidéo courte, audience jeune, fort engagement.",
      audienceTypiqueK: 328,
    },
    {
      id: "Google Ads",
      nom: "Google Ads",
      description: "Search & Display à forte intention — meilleur taux de conversion.",
      audienceTypiqueK: 309,
    },
    {
      id: "YouTube Ads",
      nom: "YouTube Ads",
      description: "Vidéo longue et préroll, couverture de masse.",
      audienceTypiqueK: 308,
    },
  ],
};

import type { LogisticModel, RegressionModel, ScoringModel } from "./types";

// ===========================================================================
// COEFFICIENTS FACTICES (placeholder).
// Dérivés des effets multiplicatifs encodés dans data/enrich_dataset.py, transcrits
// en coefficients log-linéaires -> ordres de grandeur plausibles, PAS un fit sur données.
// À REMPLACER par l'export Altair (mêmes clés de features) : charger /models/*.json.
// ===========================================================================

const ln = Math.log;
const r = (x: number) => Math.round(x * 1e4) / 1e4;
const lnmap = (m: Record<string, number>): Record<string, number> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, r(ln(v))]));
const scale = (m: Record<string, number>, f: number): Record<string, number> =>
  Object.fromEntries(Object.entries(m).map(([k, v]) => [k, r(f * ln(v))]));

// --- facteurs repris du générateur ---
const MEDIA_PRICE = { karata: 1.09, lumen: 1.15, pulse: 0.72 };
const PLATFORM_PRICE = { YouTube: 1.1, Spotify: 1.05, Facebook: 1.0, Instagram: 1.0, TikTok: 0.95 };
const TYPEPUB_PRICE = { "Placement produit": 1.3, "Citation orale": 1.15, "Logo début/fin": 1.05, "Mécénat": 1.0, "Logo fin": 0.9, Don: 0.85 };
const MEDIA_AUD_BASE = { karata: 22.0, lumen: 16.0, pulse: 34.0 };
const PROG_POP = {
  "INSIDE MAS": 1.3, LIVE: 1.1, "KARATA TOUR": 1.05, "MOUN A MAS": 0.9, "FWET A MAS": 0.95,
  "MIZIK A": 0.85, "VIDEO PARTENAIRE": 0.7, "ECO MATIN": 0.9, "GRAND FORMAT": 1.0, "TECH & CO": 0.85,
  "SANTÉ PLUS": 0.8, "PULSE DAILY": 1.4, "GAME ON": 1.2, "STREET FOOD": 1.1, "VIBE CHECK": 1.0,
};
const PLATFORM_REACH = { YouTube: 1.15, Facebook: 1.0, TikTok: 1.25, Instagram: 1.05, Spotify: 0.8 };
const TYPEPUB_VIS = { "Placement produit": 1.15, "Citation orale": 1.05, "Logo début/fin": 1.0, "Mécénat": 0.95, "Logo fin": 0.9, Don: 0.9 };
const TYPEPUB_LEAD = { "Placement produit": 1.4, "Citation orale": 1.2, "Mécénat": 0.9, Don: 0.85, "Logo début/fin": 0.78, "Logo fin": 0.65 };
const SECTEUR_LEAD = { Food: 1.15, Tourisme: 1.1, Tech: 1.05, Automobile: 1.0, "Santé": 0.95, Luxe: 0.9 };
const TYPEPUB_FUNNEL = { "Placement produit": 1.3, "Citation orale": 1.1, "Mécénat": 0.95, Don: 0.9, "Logo début/fin": 0.85, "Logo fin": 0.8 };
const SECTEUR_FUNNEL = { Food: 1.2, Tourisme: 1.15, Automobile: 1.05, Tech: 1.0, "Santé": 1.0, Luxe: 0.7 };
const PLATFORM_FUNNEL = { YouTube: 1.1, Spotify: 1.1, Facebook: 1.0, Instagram: 0.95, TikTok: 0.8 };
const PLATFORM_FREQ = { TikTok: 3.6, Instagram: 3.0, Facebook: 2.2, YouTube: 1.5, Spotify: 1.8 };
const MEDIA_FREQ = { pulse: 1.15, karata: 1.0, lumen: 0.82 };
const SAISON = { Carnaval: 1.4, "Noël": 1.35, Rentrée: 1.18, "Fête-des-mères": 1.12, "St-Valentin": 1.1, Soldes: 1.08, Standard: 0.95, "Été": 0.84 };

// affinité cible × plateforme (interaction)
const AFFINITY: Record<string, number> = {
  Gamers__TikTok: 1.5, Gamers__YouTube: 1.2, Gamers__Instagram: 1.1, Gamers__Spotify: 0.7, Gamers__Facebook: 0.8,
  Kids__TikTok: 1.3, Kids__YouTube: 1.25, Kids__Instagram: 1.05, Kids__Spotify: 0.6, Kids__Facebook: 0.85,
  Parent__Facebook: 1.4, Parent__YouTube: 1.1, Parent__Instagram: 1.05, Parent__TikTok: 0.8, Parent__Spotify: 0.95,
  Professionnel__Spotify: 1.2, Professionnel__YouTube: 1.15, Professionnel__Facebook: 1.05, Professionnel__Instagram: 0.85, Professionnel__TikTok: 0.7,
  Artisan__Facebook: 1.25, Artisan__Instagram: 1.15, Artisan__YouTube: 1.0, Artisan__TikTok: 0.95, Artisan__Spotify: 0.85,
  Sport_Lover__Instagram: 1.2, Sport_Lover__YouTube: 1.15, Sport_Lover__TikTok: 1.1, Sport_Lover__Facebook: 1.05, Sport_Lover__Spotify: 0.95,
};
const affinityLn = lnmap(AFFINITY);

const prix: RegressionModel = {
  kind: "regression",
  link: "log",
  intercept: 6.0, // calé pour un prix typique ~870 € (qs ~7.5)
  sigma: 0.22,
  clamp: [50, 6000],
  features: {
    numeric: { Quality_Score: 0.09 },
    categorical: {
      Media: lnmap(MEDIA_PRICE),
      Plateforme: lnmap(PLATFORM_PRICE),
      Type_Pub: lnmap(TYPEPUB_PRICE),
      Programme: scale(PROG_POP, 0.55),
      Fenetre_Commerciale: lnmap(SAISON),
    },
  },
};

const audience: RegressionModel = {
  kind: "regression",
  link: "log",
  intercept: 0,
  sigma: 0.3,
  clamp: [3, 100000],
  features: {
    numeric: { Quality_Score: 0.016 },
    categorical: {
      Media: lnmap(MEDIA_AUD_BASE),
      Programme: lnmap(PROG_POP),
      Plateforme: lnmap(PLATFORM_REACH),
      Type_Pub: lnmap(TYPEPUB_VIS),
    },
  },
};

const taux_lead: RegressionModel = {
  kind: "regression",
  link: "log",
  intercept: r(ln(0.055)),
  sigma: 0.18,
  clamp: [0.005, 0.35],
  features: {
    categorical: { Type_Pub: lnmap(TYPEPUB_LEAD), Secteur: lnmap(SECTEUR_LEAD) },
    interactions: affinityLn,
  },
};

const taux_vente: RegressionModel = {
  kind: "regression",
  link: "log",
  intercept: r(ln(0.055 * 0.22)),
  sigma: 0.22,
  clamp: [0.001, 0.3],
  features: {
    categorical: {
      Type_Pub: lnmap(TYPEPUB_FUNNEL),
      Secteur: lnmap(SECTEUR_FUNNEL),
      Plateforme: lnmap(PLATFORM_FUNNEL),
    },
    interactions: affinityLn,
  },
};

const frequence: RegressionModel = {
  kind: "regression",
  link: "log",
  intercept: 0,
  sigma: 0.12,
  clamp: [1, 6],
  features: {
    categorical: { Plateforme: lnmap(PLATFORM_FREQ), Media: lnmap(MEDIA_FREQ) },
  },
};

// Propension à convertir du partenaire — cold-start profil seul (pas de comportement).
const lead_score: LogisticModel = {
  kind: "logistic",
  intercept: -0.2,
  features: {
    categorical: {
      Type_Entreprise: { "Privé": 0.15, Public: -0.05, Association: 0.05, Particulier: -0.1 },
      Secteur: { Food: 0.2, Tourisme: 0.15, Tech: 0.1, Automobile: 0.0, "Santé": -0.05, Luxe: -0.15 },
    },
  },
};

export type ModelName = "prix" | "audience" | "taux_lead" | "taux_vente" | "frequence" | "lead_score";

export const MODELS: Record<ModelName, ScoringModel> = {
  prix,
  audience,
  taux_lead,
  taux_vente,
  frequence,
  lead_score,
};

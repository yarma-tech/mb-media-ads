import type { RegressionModel, ScoringModel } from "./types";

// ===========================================================================
// COEFFICIENTS RÉELS — OLS log-linéaire ajusté sur data/dataset_ml_final.xlsx
// (5000 lignes) par data/fit_models.py. Régénérer après tout changement du
// dataset : `python3 data/fit_models.py` -> data/model_coefficients.json,
// puis recopier ici.
//
// Encodage : niveau de référence par catégorie = coefficient 0 (baseline absorbée
// dans l'intercept). Prédiction = exp(intercept + Σ coeff des niveaux observés).
// Les variables numériques du dataset (audience, durée, score de marque) sont
// volontairement EXCLUES : corrélation ~0 avec les cibles -> aucun signal.
// ===========================================================================

// Prix média net (€) — surtout piloté par le type de pub et le type d'entreprise.
const prix: RegressionModel = {
  kind: "regression",
  link: "log",
  intercept: 6.9116,
  sigma: 0.6809,
  clamp: [45, 6060],
  features: {
    categorical: {
      Plateforme: { "YouTube Ads": 0, Meta: 0.0248, TikTok: -0.0199, "Google Ads": -0.0396 },
      Type_Pub: {
        "Logo début vidéo": 0,
        "Mention orale": -0.0277,
        "Video partenaire": -0.019,
        "Placement de produit": -0.2031,
        "Video Ads": -0.3396,
      },
      Cible: {
        Professionnel: 0,
        Parent: 0.0192,
        Artisan: 0.0057,
        "Sport Lover": -0.0093,
        Gamers: 0.0229,
        Kids: -0.0274,
      },
      Periode: {
        "Temps des Fêtes": 0,
        "Black Friday": -0.0402,
        Halloween: -0.0066,
        "Rentrée scolaire": -0.0355,
        "Vacances de construction": -0.0608,
        "Vacances d'été": -0.037,
        Pâques: 0.0052,
        "Semaine de relâche": -0.1012,
        "Saint-Valentin": -0.002,
        "Hors période": -0.0248,
      },
      Secteur: {
        Automobile: 0,
        Alimentation: -0.0626,
        Tourisme: -0.0082,
        Luxe: -0.0009,
        Tech: -0.0174,
        Santé: -0.0383,
      },
      Type_Entreprise: { "Privé": 0, Public: -0.2565 },
    },
  },
};

// Taux de conversion (0..1) — surtout piloté par la cible, la plateforme et la période.
const taux_conversion: RegressionModel = {
  kind: "regression",
  link: "log",
  intercept: -1.4058,
  sigma: 0.2825,
  clamp: [0.016, 0.582],
  features: {
    categorical: {
      Plateforme: { "YouTube Ads": 0, Meta: 0.0821, TikTok: -0.1857, "Google Ads": 0.201 },
      Type_Pub: {
        "Logo début vidéo": 0,
        "Mention orale": -0.0171,
        "Video partenaire": -0.0214,
        "Placement de produit": 0.0115,
        "Video Ads": -0.027,
      },
      Cible: {
        Professionnel: 0,
        Parent: -0.3315,
        Artisan: -0.1603,
        "Sport Lover": -0.4685,
        Gamers: -0.7007,
        Kids: -1.2961,
      },
      Periode: {
        "Temps des Fêtes": 0,
        "Black Friday": 0.079,
        Halloween: -0.193,
        "Rentrée scolaire": -0.0729,
        "Vacances de construction": -0.3694,
        "Vacances d'été": -0.2725,
        Pâques: -0.1345,
        "Semaine de relâche": -0.3111,
        "Saint-Valentin": -0.1272,
        "Hors période": -0.4349,
      },
      Secteur: {
        Automobile: 0,
        Alimentation: -0.0072,
        Tourisme: 0.0011,
        Luxe: 0.022,
        Tech: 0.0109,
        Santé: 0.0118,
      },
      Type_Entreprise: { "Privé": 0, Public: -0.001 },
    },
  },
};

export type ModelName = "prix" | "taux_conversion";

export const MODELS: Record<ModelName, ScoringModel> = {
  prix,
  taux_conversion,
};

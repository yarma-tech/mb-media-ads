// Types d'échange avec le service ML (FastAPI, ml-service/main.py).
// Les noms de champs sont identiques à ceux attendus par le service (snake_case
// en français — alignés sur les colonnes du dataset).

import type { Cible, Periode, Plateforme, Secteur, TypeEntreprise, TypePub } from "./enums";

export type NiveauConfiance = "Faible" | "Moyen" | "Élevé";
export type OuiNon = "Oui" | "Non";

export type MlConfigInput = {
  Secteur_Entreprise: Secteur;
  Type_Entreprise_Prive_Public: TypeEntreprise;
  Periode: Periode;
  Media_Numerique: Plateforme;
  Type_Pub_Normalise: TypePub;
  Cible: Cible;
  Niveau_Confiance: NiveauConfiance;
  Retargeting: OuiNon;
  Duree_Campagne_Mois: number;
  Objectif_Audience_K_Vues: number;
  Score_Historique_Marque: number;
  Nb_Plateformes: number;
  Budget_Cible_K: number;
  Nb_Visuels_Crees: number;
};

export type MlPrediction = {
  prix: number;
  prixLo: number;
  prixHi: number;
  tauxConversion: number;
  tauxLo: number;
  tauxHi: number;
  pObjectif: number;
  pObjectifConfiance: number;
};

// Précision du modèle (issue de l'entraînement) — sert les badges de la page résultat.
export type MlMetricReg = { r2: number; mae: number; rmse: number; sigma: number; r2_cv: number };
export type MlMetricClf = { auc: number; accuracy: number; auc_cv: number };
export type MlMetrics = { prix: MlMetricReg; taux: MlMetricReg; objectif: MlMetricClf };

// modelType est purement informatif ("mix") — le service applique un mix figé.
export type MlMeta = { modelType: string; metrics: MlMetrics };

export type MlBatchResponse = {
  predictions: MlPrediction[];
  meta: MlMeta;
};

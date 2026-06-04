// Construit l'entrée des modèles ML à partir des champs disponibles (formulaire +
// profil + catalogue). Centralise les défauts neutres pour les features que le
// formulaire ne collecte pas (Score_Historique_Marque, Niveau_Confiance,
// Retargeting, Nb_Visuels_Crees) et les dérivations (durée, audience cible).

import type { Cible, Plateforme, Secteur, TypeEntreprise, TypePub } from "./enums";
import type { MlConfigInput, NiveauConfiance, OuiNon } from "./ml-types";
import { dureeMois, periodeCommerciale } from "./saison";
import type { Catalogue, DemandeInput, PlateformeInfo } from "./types";

// Défauts neutres (médianes raisonnables) pour les features non collectées.
const DEFAULT_NIVEAU_CONFIANCE: NiveauConfiance = "Moyen";
const DEFAULT_RETARGETING: OuiNon = "Non";
const DEFAULT_NB_VISUELS = 5;
const DEFAULT_SCORE_MARQUE = 5.0;

export type MappingProfile = {
  scoreHistoriqueMarque?: number | null;
  niveauConfiance?: NiveauConfiance;
  retargeting?: OuiNon;
  nbVisuelsCrees?: number;
};

// Estime l'audience cible quand l'utilisateur n'en donne pas (mode budget).
// Heuristique : audience typique de la plateforme × nombre de plateformes
// disponibles (proxy de l'inventaire potentiel).
function estimateAudienceK(catalogue: Catalogue, plat: PlateformeInfo): number {
  return plat.audienceTypiqueK * Math.max(1, catalogue.plateformes.length);
}

function audienceCibleK(input: DemandeInput, catalogue: Catalogue, plat: PlateformeInfo): number {
  if (input.objectifValeur && input.objectifValeur > 0) return input.objectifValeur;
  return estimateAudienceK(catalogue, plat);
}

function budgetCibleK(input: DemandeInput): number {
  if (input.budget && input.budget > 0) return input.budget / 1000;
  return 50; // médiane par défaut (50 k€)
}

export type PlacementChoice = {
  plateforme: Plateforme;
  typePub: TypePub;
  cible: Cible;
};

// Construit une entrée modèle pour UNE configuration (un placement potentiel).
export function toMlInput(
  choice: PlacementChoice,
  input: DemandeInput,
  catalogue: Catalogue,
  profile: MappingProfile = {},
): MlConfigInput {
  const plat = catalogue.plateformes.find((p) => p.id === choice.plateforme);
  if (!plat) {
    throw new Error(`Plateforme inconnue dans le catalogue : ${choice.plateforme}`);
  }
  return {
    Secteur_Entreprise: input.secteur as Secteur,
    Type_Entreprise_Prive_Public: input.typeEntreprise as TypeEntreprise,
    Periode: periodeCommerciale(input.dateDebut, input.dateFin),
    Media_Numerique: choice.plateforme,
    Type_Pub_Normalise: choice.typePub,
    Cible: choice.cible,
    Niveau_Confiance: profile.niveauConfiance ?? DEFAULT_NIVEAU_CONFIANCE,
    Retargeting: profile.retargeting ?? DEFAULT_RETARGETING,
    Duree_Campagne_Mois: Math.max(0.1, dureeMois(input.dateDebut, input.dateFin)),
    Objectif_Audience_K_Vues: audienceCibleK(input, catalogue, plat),
    Score_Historique_Marque: profile.scoreHistoriqueMarque ?? DEFAULT_SCORE_MARQUE,
    Nb_Plateformes: 1,
    Budget_Cible_K: budgetCibleK(input),
    Nb_Visuels_Crees: profile.nbVisuelsCrees ?? DEFAULT_NB_VISUELS,
  };
}

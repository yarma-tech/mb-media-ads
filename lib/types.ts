import type {
  Cible,
  EtatDemande,
  MediaId,
  Mode,
  ObjectifPrincipal,
  Plateforme,
  Secteur,
  TypeEntreprise,
  TypePub,
} from "./enums";

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------
export type Media = {
  id: MediaId;
  nom: string;
  description: string;
  qsTypique: number; // Quality_Score moyen du média (feature des modèles prix/audience)
};

export type Programme = {
  id: string;
  mediaId: MediaId;
  nom: string;
  cadenceParMois: number; // diffusions/mois -> borne la capacité d'une période
  plateformes: Plateforme[];
};

export type Catalogue = { medias: Media[]; programmes: Programme[] };

// ---------------------------------------------------------------------------
// Schéma des coefficients (compatible export Altair -> JSON)
// ---------------------------------------------------------------------------
export type FeatureCoeffs = {
  numeric?: Record<string, number>;
  categorical?: Record<string, Record<string, number>>;
  // Interaction cible × plateforme (clé `${Cible}__${Plateforme}`). Enrichissement
  // factice (l'affinité est une interaction qu'un modèle purement linéaire ne capte pas) ;
  // un export Altair simple pourra l'omettre.
  interactions?: Record<string, number>;
};

export type RegressionModel = {
  kind: "regression";
  link: "identity" | "log";
  intercept: number;
  sigma: number; // écart-type résiduel (espace du lien) -> intervalle + confiance
  features: FeatureCoeffs;
  clamp?: [number, number];
};

export type LogisticModel = {
  kind: "logistic";
  intercept: number;
  features: FeatureCoeffs;
};

export type ScoringModel = RegressionModel | LogisticModel;
export type ScoringInput = Record<string, number | string>;

// value + intervalle + confiance (0..1)
export type Estimation = { value: number; lo: number; hi: number; confiance: number };

// ---------------------------------------------------------------------------
// Entrée formulaire
// ---------------------------------------------------------------------------
export type DemandeInput = {
  nomEntreprise: string;
  nomContact: string;
  secteur: Secteur;
  typeEntreprise: TypeEntreprise;
  dateDebut: string; // yyyy-mm-dd
  dateFin: string; // yyyy-mm-dd
  objectifPrincipal: ObjectifPrincipal;
  mode: Mode;
  budget?: number; // mode budget
  objectifValeur?: number; // mode goal
};

// ---------------------------------------------------------------------------
// Sortie optimiseur
// ---------------------------------------------------------------------------
export type PlacementChoisi = {
  mediaId: MediaId;
  mediaNom: string;
  programmeId: string;
  programmeNom: string;
  plateforme: Plateforme;
  typePub: TypePub;
  cible: Cible;
  insertions: number;
  prixUnitaire: number; // € média net par insertion
  coutMediaNet: number;
  audienceK: number;
  leads: number;
  ventes: number;
  couvertureEfficaceK: number;
};

export type StatutReco = "ok" | "infaisable" | "sature";

export type Recommandation = {
  mode: Mode;
  objectifPrincipal: ObjectifPrincipal;
  placements: PlacementChoisi[];
  audienceK: Estimation;
  couvertureEfficaceK: Estimation;
  leads: Estimation;
  ventes: Estimation;
  coutMediaNet: number;
  commission: number;
  tauxCommission: number;
  budgetTotal: number; // média net + commission
  leadScore: number; // 0..1
  statut: StatutReco;
  message?: string;
};

// ---------------------------------------------------------------------------
// Demande persistée
// ---------------------------------------------------------------------------
export type Demande = {
  id: string;
  createdAt: string;
  input: DemandeInput;
  recommandation: Recommandation;
  leadScore: number;
  etat: EtatDemande;
};

import type {
  Cible,
  EtatDemande,
  Mode,
  ObjectifPrincipal,
  Plateforme,
  Secteur,
  TypeEntreprise,
  TypePub,
} from "./enums";
import type { MlMeta } from "./ml-types";

// ---------------------------------------------------------------------------
// Catalogue — l'inventaire est désormais la liste des plateformes numériques.
// ---------------------------------------------------------------------------
export type PlateformeInfo = {
  id: Plateforme;
  nom: string;
  description: string;
  // Audience représentative (K vues) servie par la plateforme — issue du dataset,
  // sert d'unité de volume au mode "panier de configs" (lib/optimizer.ts).
  audienceTypiqueK: number;
};

export type Catalogue = { plateformes: PlateformeInfo[] };

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
  tauxCible?: number; // mode taux (0..1) — Conversion seulement
  vuesCible?: number; // mode budget + Notoriété — vues souhaitées
  conversionsCible?: number; // mode budget + Conversion — conversions cible
};

// Mode auto : la partie campagne du brief (les infos entreprise viennent du profil,
// injectées côté serveur). Sous-ensemble de DemandeInput.
export type CampagneAutoInput = {
  dateDebut: string; // yyyy-mm-dd
  dateFin: string; // yyyy-mm-dd
  objectifPrincipal: ObjectifPrincipal;
  mode: Mode;
  budget?: number;
  objectifValeur?: number;
  tauxCible?: number; // mode taux (0..1)
  vuesCible?: number; // mode budget + Notoriété — vues souhaitées
  conversionsCible?: number; // mode budget + Conversion — conversions cible
};

// Mode manuel : une configuration unique choisie par l'utilisateur -> un tarif.
// (Le secteur + type d'entreprise viennent du profil, injectés côté serveur.)
export type ConfigManuelle = {
  plateforme: Plateforme;
  typePub: TypePub;
  cible: Cible;
  objectifPrincipal: ObjectifPrincipal;
  dateDebut: string; // yyyy-mm-dd
  dateFin: string; // yyyy-mm-dd
};

// Brief envoyé pour payer ou parler à un expert : auto (brief budget) ou manuel (config).
export type PaiementPayload =
  | { kind: "auto"; campagne: CampagneAutoInput }
  | { kind: "manuel"; config: ConfigManuelle };

// ---------------------------------------------------------------------------
// Sortie optimiseur
// ---------------------------------------------------------------------------
export type PlacementChoisi = {
  plateforme: Plateforme;
  typePub: TypePub;
  cible: Cible;
  prix: number; // € média net pour ce placement
  audienceK: number;
  tauxConversion: number; // 0..1
  conversions: number;
};

export type StatutReco = "ok" | "infaisable" | "sature";

export type Recommandation = {
  mode: Mode;
  objectifPrincipal: ObjectifPrincipal;
  placements: PlacementChoisi[];
  audienceK: Estimation;
  tauxConversion: Estimation; // taux de conversion moyen pondéré (0..1)
  conversions: Estimation;
  // Probabilité agrégée d'atteinte de l'objectif (modèle ML de classification).
  // Optionnel : peut manquer pour les vieilles demandes persistées avant le ML.
  pObjectif?: Estimation;
  coutMediaNet: number;
  commission: number;
  tauxCommission: number;
  budgetTotal: number; // média net + commission
  leadScore: number; // 0..1 (propension du partenaire)
  statut: StatutReco;
  message?: string;
  // Famille de modèle utilisée + sa précision (badges page résultat).
  // Optionnel : absent des demandes persistées avant l'exposition des 2 modèles.
  meta?: MlMeta;
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

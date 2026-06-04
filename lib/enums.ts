// Référentiels du domaine — valeurs EXACTES du dataset (data/dataset_ml_final.xlsx),
// car elles servent de clés catégorielles aux modèles ML (ml-service/).

// Plateformes / canaux numériques (remplace l'ancien couple Média + Plateforme).
export const PLATEFORMES = ["Meta", "TikTok", "Google Ads", "YouTube Ads"] as const;
export type Plateforme = (typeof PLATEFORMES)[number];

export const CIBLES = ["Professionnel", "Artisan", "Parent", "Sport Lover", "Gamers", "Kids"] as const;
export type Cible = (typeof CIBLES)[number];
// Les valeurs sont déjà lisibles ; le libellé est l'identité (conservé pour l'affichage).
export const CIBLE_LABEL: Record<Cible, string> = {
  Professionnel: "Professionnel",
  Artisan: "Artisan",
  Parent: "Parent",
  "Sport Lover": "Sport Lover",
  Gamers: "Gamers",
  Kids: "Kids",
};

export const TYPES_PUB = [
  "Placement de produit",
  "Mention orale",
  "Video partenaire",
  "Logo début vidéo",
  "Video Ads",
] as const;
export type TypePub = (typeof TYPES_PUB)[number];

export const SECTEURS = ["Automobile", "Alimentation", "Tourisme", "Luxe", "Tech", "Santé"] as const;
export type Secteur = (typeof SECTEURS)[number];

export const TYPES_ENTREPRISE = ["Privé", "Public"] as const;
export type TypeEntreprise = (typeof TYPES_ENTREPRISE)[number];

// Périodes commerciales (calendrier québécois) — remplace l'ancienne saisonnalité média.
export const PERIODES = [
  "Temps des Fêtes",
  "Black Friday",
  "Saint-Valentin",
  "Pâques",
  "Semaine de relâche",
  "Vacances de construction",
  "Vacances d'été",
  "Rentrée scolaire",
  "Halloween",
  "Hors période",
] as const;
export type Periode = (typeof PERIODES)[number];

// Objectif principal : Notoriété (audience/couverture) ou Conversion (taux de conversion).
export const OBJECTIFS = ["notoriete", "conversion"] as const;
export type ObjectifPrincipal = (typeof OBJECTIFS)[number];
export const OBJECTIF_LABEL: Record<ObjectifPrincipal, string> = {
  notoriete: "Notoriété",
  conversion: "Conversion",
};
export const OBJECTIF_DESC: Record<ObjectifPrincipal, string> = {
  notoriete: "Être vu et mémorisé",
  conversion: "Générer des conversions",
};
// Unité de l'objectif chiffré (mode goal) selon l'objectif principal.
export const OBJECTIF_UNITE: Record<ObjectifPrincipal, string> = {
  notoriete: "personnes touchées (K)",
  conversion: "conversions",
};

// Mode de cadrage : budget (maximiser), goal (objectif chiffré → minimiser le budget),
// taux (Conversion seulement : viser un taux de conversion cible au moindre coût).
export const MODES = ["budget", "goal", "taux"] as const;
export type Mode = (typeof MODES)[number];

// Famille de modèle ML servie (choix pédagogique exposé à l'utilisateur).
export const MODEL_TYPES = ["rf", "linear"] as const;
export type ModelType = (typeof MODEL_TYPES)[number];
export const MODEL_TYPE_LABEL: Record<ModelType, string> = {
  rf: "Random Forest",
  linear: "Régression linéaire",
};
export const MODEL_TYPE_DESC: Record<ModelType, string> = {
  rf: "Modèle d'ensemble, le plus précis",
  linear: "Modèle simple et interprétable",
};

// Canal d'une demande : achat self-service (Stripe) ou mise en relation avec un expert.
export const CANAUX = ["self_service", "expert"] as const;
export type Canal = (typeof CANAUX)[number];

// Origine de la campagne : composée par l'optimiseur (auto) ou configurée à la main.
export const TYPES_CAMPAGNE = ["auto", "manuel"] as const;
export type TypeCampagne = (typeof TYPES_CAMPAGNE)[number];

export const ETATS_DEMANDE = [
  "soumise",
  "acceptee",
  "refusee",
  "convention_envoyee",
  "payee",
] as const;
export type EtatDemande = (typeof ETATS_DEMANDE)[number];
export const ETAT_LABEL: Record<EtatDemande, string> = {
  soumise: "Soumise",
  acceptee: "Acceptée",
  refusee: "Refusée",
  convention_envoyee: "Convention envoyée",
  payee: "Payée",
};

// Taux de commission MB Média prélevé dans le budget (défaut proto ; plage 10–15 %).
export const TAUX_COMMISSION = 0.125;

// Référentiels du domaine (valeurs alignées sur data/enrich_dataset.py — clés exactes
// car elles servent de features catégorielles aux modèles de scoring).

export const PLATEFORMES = ["YouTube", "Facebook", "TikTok", "Instagram", "Spotify"] as const;
export type Plateforme = (typeof PLATEFORMES)[number];

export const CIBLES = ["Kids", "Professionnel", "Artisan", "Parent", "Gamers", "Sport_Lover"] as const;
export type Cible = (typeof CIBLES)[number];
export const CIBLE_LABEL: Record<Cible, string> = {
  Kids: "Kids",
  Professionnel: "Professionnel",
  Artisan: "Artisan",
  Parent: "Parent",
  Gamers: "Gamers",
  Sport_Lover: "Sport Lover",
};

export const TYPES_PUB = [
  "Don",
  "Mécénat",
  "Citation orale",
  "Placement produit",
  "Logo fin",
  "Logo début/fin",
] as const;
export type TypePub = (typeof TYPES_PUB)[number];

export const SECTEURS = ["Automobile", "Food", "Tourisme", "Luxe", "Tech", "Santé"] as const;
export type Secteur = (typeof SECTEURS)[number];

export const TYPES_ENTREPRISE = ["Privé", "Public", "Association", "Particulier"] as const;
export type TypeEntreprise = (typeof TYPES_ENTREPRISE)[number];

export const MEDIA_IDS = ["karata", "lumen", "pulse"] as const;
export type MediaId = (typeof MEDIA_IDS)[number];

export const OBJECTIFS = ["notoriete", "lead", "vente"] as const;
export type ObjectifPrincipal = (typeof OBJECTIFS)[number];
export const OBJECTIF_LABEL: Record<ObjectifPrincipal, string> = {
  notoriete: "Notoriété",
  lead: "Lead",
  vente: "Vente",
};
export const OBJECTIF_DESC: Record<ObjectifPrincipal, string> = {
  notoriete: "Être vu et mémorisé",
  lead: "Générer des contacts",
  vente: "Générer des achats",
};
// Unité de l'objectif chiffré (mode goal) selon l'objectif principal.
export const OBJECTIF_UNITE: Record<ObjectifPrincipal, string> = {
  notoriete: "personnes touchées efficacement (K)",
  lead: "leads",
  vente: "ventes",
};

export const MODES = ["budget", "goal"] as const;
export type Mode = (typeof MODES)[number];

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

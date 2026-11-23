// Référentiels du profil utilisateur (inscription, table `profiles`).
export const SECTEURS = ["Automobile", "Alimentation", "Tourisme", "Luxe", "Tech", "Santé"] as const;
export type Secteur = (typeof SECTEURS)[number];

export const TYPES_ENTREPRISE = ["Privé", "Public"] as const;
export type TypeEntreprise = (typeof TYPES_ENTREPRISE)[number];

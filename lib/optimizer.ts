import {
  CIBLES,
  type Cible,
  type ObjectifPrincipal,
  type Plateforme,
  type Secteur,
  TAUX_COMMISSION,
  TYPES_PUB,
  type TypeEntreprise,
  type TypePub,
} from "./enums";
import { toMlInput, type MappingProfile, type PlacementChoice } from "./feature-mapping";
import { predictBatch } from "./ml-client";
import type { MlMeta, MlPrediction } from "./ml-types";
import type {
  Catalogue,
  ConfigManuelle,
  DemandeInput,
  Estimation,
  PlacementChoisi,
  Recommandation,
  StatutReco,
} from "./types";

const Z80 = 1.2816;
// Sigmas agrégés pour les métriques dérivées (audience / conversions).
// Le taux n'a plus besoin d'un sigma constant : on s'appuie sur les intervalles
// produits par le modèle (tauxLo/tauxHi par placement).
const SIGMA = { audience: 0.25, conversions: 0.38 };

// Une configuration candidate (un placement potentiel) pour la période choisie,
// déjà enrichie de la prédiction ML.
type Config = {
  plateforme: Plateforme;
  typePub: TypePub;
  cible: Cible;
  prix: number;
  prixLo: number;
  prixHi: number;
  tauxConversion: number;
  tauxLo: number;
  tauxHi: number;
  pObjectif: number;
  pObjectifConfiance: number;
  audienceK: number;
  conversions: number;
  valeur: number;
};

function valeurUnitaire(obj: ObjectifPrincipal, audienceK: number, conversions: number): number {
  return obj === "notoriete" ? audienceK : conversions;
}

// Propension du partenaire à convertir en client payant. Heuristique sur le
// profil entreprise (le dataset campagne ne porte pas ce signal).
function partnerLeadScore(typeEntreprise: TypeEntreprise, secteur: Secteur): number {
  const base = typeEntreprise === "Privé" ? 0.58 : 0.45;
  const sect: Record<Secteur, number> = {
    Alimentation: 0.06,
    Tourisme: 0.04,
    Tech: 0.03,
    Automobile: 0,
    Luxe: -0.03,
    Santé: -0.02,
  };
  return Math.min(0.95, Math.max(0.05, base + sect[secteur]));
}

function enumerateChoices(catalogue: Catalogue): PlacementChoice[] {
  const out: PlacementChoice[] = [];
  for (const plat of catalogue.plateformes) {
    for (const typePub of TYPES_PUB) {
      for (const cible of CIBLES) {
        out.push({ plateforme: plat.id, typePub, cible });
      }
    }
  }
  return out;
}

async function buildConfigs(
  input: DemandeInput,
  catalogue: Catalogue,
  profile: MappingProfile,
): Promise<{ configs: Config[]; meta?: MlMeta }> {
  const choices = enumerateChoices(catalogue);
  const mlInputs = choices.map((c) => toMlInput(c, input, catalogue, profile));
  const { predictions: preds, meta } = await predictBatch(mlInputs, { modelType: input.modelType });

  const configs = choices.map((choice, i) => {
    const plat = catalogue.plateformes.find((p) => p.id === choice.plateforme)!;
    const pred = preds[i];
    const audienceK = plat.audienceTypiqueK;
    const conversions = audienceK * 1000 * pred.tauxConversion;
    return {
      plateforme: choice.plateforme,
      typePub: choice.typePub,
      cible: choice.cible,
      prix: pred.prix,
      prixLo: pred.prixLo,
      prixHi: pred.prixHi,
      tauxConversion: pred.tauxConversion,
      tauxLo: pred.tauxLo,
      tauxHi: pred.tauxHi,
      pObjectif: pred.pObjectif,
      pObjectifConfiance: pred.pObjectifConfiance,
      audienceK,
      conversions,
      valeur: valeurUnitaire(input.objectifPrincipal, audienceK, conversions),
    };
  });
  return { configs, meta };
}

function allocateBudget(
  configs: Config[],
  budgetMediaNet: number,
): { choix: Config[]; statut: StatutReco } {
  const ordered = [...configs].sort((a, b) => b.valeur / b.prix - a.valeur / a.prix);
  const cheapest = Math.min(...configs.map((c) => c.prix));
  if (cheapest > budgetMediaNet) return { choix: [], statut: "infaisable" };

  const choix: Config[] = [];
  let remaining = budgetMediaNet;
  for (const c of ordered) {
    if (c.prix <= remaining) {
      choix.push(c);
      remaining -= c.prix;
    }
  }
  const statut: StatutReco =
    choix.length === configs.length && remaining >= cheapest ? "sature" : "ok";
  return { choix, statut };
}

function allocateGoal(configs: Config[], target: number): { choix: Config[]; statut: StatutReco } {
  const ordered = [...configs].sort((a, b) => b.valeur / b.prix - a.valeur / a.prix);
  const choix: Config[] = [];
  let achieved = 0;
  for (const c of ordered) {
    if (achieved >= target) break;
    if (c.valeur <= 0) continue;
    choix.push(c);
    achieved += c.valeur;
  }
  return { choix, statut: achieved >= target ? "ok" : "infaisable" };
}

// Mode taux (Conversion) : plan le moins cher dont le taux pondéré ≥ cible. Un seul
// placement suffit (son taux ≥ cible => taux pondéré ≥ cible) ; on prend donc le moins
// cher parmi ceux qui atteignent la cible. Infaisable si aucun ne l'atteint.
function allocateTaux(configs: Config[], tauxCible: number): { choix: Config[]; statut: StatutReco } {
  const passing = configs.filter((c) => c.tauxConversion >= tauxCible);
  if (passing.length === 0) return { choix: [], statut: "infaisable" };
  const cheapest = passing.reduce((a, b) => (b.prix < a.prix ? b : a));
  return { choix: [cheapest], statut: "ok" };
}

function aggregate(values: number[], baseSigma: number): Estimation {
  const value = values.reduce((a, b) => a + b, 0);
  const n = Math.max(1, values.length);
  const eff = baseSigma / Math.sqrt(n);
  return {
    value,
    lo: value * Math.exp(-Z80 * eff),
    hi: value * Math.exp(Z80 * eff),
    confiance: Math.min(0.95, Math.max(0.5, Math.exp(-1.1 * eff))),
  };
}

// Taux global = ratio pondéré (conversions / audience). L'intervalle est dérivé
// des bornes du modèle ML moyennées sur les placements retenus.
function aggregateTaux(placements: PlacementChoisi[], configs: Config[]): Estimation {
  const audience = placements.reduce((s, p) => s + p.audienceK * 1000, 0);
  const conversions = placements.reduce((s, p) => s + p.conversions, 0);
  const value = audience > 0 ? conversions / audience : 0;
  const meanLo =
    configs.length > 0 ? configs.reduce((s, c) => s + c.tauxLo, 0) / configs.length : value;
  const meanHi =
    configs.length > 0 ? configs.reduce((s, c) => s + c.tauxHi, 0) / configs.length : value;
  const width = Math.max(0, meanHi - meanLo);
  const confiance = Math.min(0.95, Math.max(0.5, 1 - width));
  return { value, lo: Math.max(0, value - width / 2), hi: Math.min(1, value + width / 2), confiance };
}

// Probabilité d'atteinte de l'objectif agrégée sur les placements retenus.
// Pondération par valeur (poids du placement dans le résultat).
function aggregatePObjectif(configs: Config[]): Estimation {
  if (configs.length === 0) return { value: 0, lo: 0, hi: 0, confiance: 0 };
  const totalW = configs.reduce((s, c) => s + Math.max(c.valeur, 1e-9), 0);
  const value =
    configs.reduce((s, c) => s + c.pObjectif * Math.max(c.valeur, 1e-9), 0) / totalW;
  const confiance =
    configs.reduce((s, c) => s + c.pObjectifConfiance * Math.max(c.valeur, 1e-9), 0) / totalW;
  const spread = (1 - confiance) * 0.5;
  return {
    value,
    lo: Math.max(0, value - spread),
    hi: Math.min(1, value + spread),
    confiance: Math.min(0.95, Math.max(0.05, confiance)),
  };
}

function toPlacement(c: Config): PlacementChoisi {
  return {
    plateforme: c.plateforme,
    typePub: c.typePub,
    cible: c.cible,
    prix: c.prix,
    audienceK: c.audienceK,
    tauxConversion: c.tauxConversion,
    conversions: c.conversions,
  };
}

function assemble(
  input: { mode: DemandeInput["mode"]; objectifPrincipal: ObjectifPrincipal },
  placements: PlacementChoisi[],
  chosen: Config[],
  leadScore: number,
  statut: StatutReco,
  message?: string,
  meta?: MlMeta,
): Recommandation {
  const taux = TAUX_COMMISSION;
  const coutMediaNet = placements.reduce((s, p) => s + p.prix, 0);
  const budgetTotal = coutMediaNet / (1 - taux);
  return {
    mode: input.mode,
    objectifPrincipal: input.objectifPrincipal,
    placements,
    audienceK: aggregate(
      placements.map((p) => p.audienceK),
      SIGMA.audience,
    ),
    tauxConversion: aggregateTaux(placements, chosen),
    conversions: aggregate(
      placements.map((p) => p.conversions),
      SIGMA.conversions,
    ),
    pObjectif: aggregatePObjectif(chosen),
    coutMediaNet,
    commission: budgetTotal - coutMediaNet,
    tauxCommission: taux,
    budgetTotal,
    leadScore,
    statut,
    message,
    meta,
  };
}

export async function optimiser(
  input: DemandeInput,
  catalogue: Catalogue,
  profile: MappingProfile = {},
): Promise<Recommandation> {
  const { configs, meta } = await buildConfigs(input, catalogue, profile);
  const leadScore = partnerLeadScore(input.typeEntreprise, input.secteur);

  let choix: Config[];
  let statut: StatutReco;
  if (input.mode === "budget") {
    const budgetMediaNet = (input.budget ?? 0) * (1 - TAUX_COMMISSION);
    ({ choix, statut } = allocateBudget(configs, budgetMediaNet));
  } else if (input.mode === "taux") {
    ({ choix, statut } = allocateTaux(configs, input.tauxCible ?? 0));
  } else {
    ({ choix, statut } = allocateGoal(configs, input.objectifValeur ?? 0));
  }

  const placements = choix.map(toPlacement).sort((a, b) => b.prix - a.prix);
  return assemble(input, placements, choix, leadScore, statut, messageStatut(statut, input, configs), meta);
}

// Mode manuel : une configuration unique -> tarif et résultat attendu.
export async function predictTarif(
  config: ConfigManuelle,
  secteur: Secteur,
  typeEntreprise: TypeEntreprise,
  catalogue: Catalogue,
  profile: MappingProfile = {},
): Promise<Recommandation> {
  const plat = catalogue.plateformes.find((p) => p.id === config.plateforme);
  const base = { mode: "budget" as const, objectifPrincipal: config.objectifPrincipal };
  const leadScore = partnerLeadScore(typeEntreprise, secteur);

  if (!plat) {
    return assemble(base, [], [], leadScore, "infaisable", "Configuration invalide : plateforme introuvable.");
  }

  const input: DemandeInput = {
    nomEntreprise: "",
    nomContact: "",
    secteur,
    typeEntreprise,
    dateDebut: config.dateDebut,
    dateFin: config.dateFin,
    objectifPrincipal: config.objectifPrincipal,
    mode: "budget",
  };
  const mlInput = toMlInput(
    { plateforme: plat.id, typePub: config.typePub, cible: config.cible },
    input,
    catalogue,
    profile,
  );
  const { predictions, meta } = await predictBatch([mlInput], { modelType: config.modelType });
  const pred = predictions[0];
  const audienceK = plat.audienceTypiqueK;
  const conversions = audienceK * 1000 * pred.tauxConversion;
  const c: Config = {
    plateforme: plat.id,
    typePub: config.typePub,
    cible: config.cible,
    prix: pred.prix,
    prixLo: pred.prixLo,
    prixHi: pred.prixHi,
    tauxConversion: pred.tauxConversion,
    tauxLo: pred.tauxLo,
    tauxHi: pred.tauxHi,
    pObjectif: pred.pObjectif,
    pObjectifConfiance: pred.pObjectifConfiance,
    audienceK,
    conversions,
    valeur: valeurUnitaire(config.objectifPrincipal, audienceK, conversions),
  };

  return assemble(base, [toPlacement(c)], [c], leadScore, "ok", undefined, meta);
}

function messageStatut(statut: StatutReco, input: DemandeInput, configs: Config[]): string | undefined {
  if (statut === "ok") return undefined;
  if (statut === "infaisable" && input.mode === "budget") {
    const cheapest = Math.min(...configs.map((c) => c.prix));
    return `Budget trop faible : le placement le moins cher coûte environ ${Math.round(cheapest)} € (hors commission). Augmentez le budget.`;
  }
  if (statut === "infaisable" && input.mode === "taux") {
    const best = configs.length ? Math.max(...configs.map((c) => c.tauxConversion)) : 0;
    const cible = Math.round((input.tauxCible ?? 0) * 100);
    return `Aucun placement n'atteint un taux de conversion de ${cible} %. Le meilleur plafonne à ${Math.round(best * 100)} %. Réduisez la cible.`;
  }
  if (statut === "infaisable") {
    return "Objectif hors de portée sur cette période, même en mobilisant toutes les configurations. Réduisez l'objectif.";
  }
  return "Votre budget dépasse l'inventaire disponible : toutes les configurations pertinentes ont été retenues.";
}

// Surfaces explicites pour l'introspection / debug (les Server Actions
// importent uniquement `optimiser` et `predictTarif`).
export type { MappingProfile } from "./feature-mapping";
export type { MlPrediction };

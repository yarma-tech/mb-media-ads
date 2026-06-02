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
import { periodeCommerciale } from "./saison";
import { predictPrix, predictTauxConversion } from "./scoring";
import type {
  Catalogue,
  ConfigManuelle,
  DemandeInput,
  Estimation,
  PlacementChoisi,
  PlateformeInfo,
  Recommandation,
  ScoringInput,
  StatutReco,
} from "./types";

const Z80 = 1.2816;
// Sigmas agrégés par métrique. taux = sigma du modèle de conversion ; audience =
// dispersion représentative de la portée ; conversions = combinaison des deux.
const SIGMA = { audience: 0.25, taux: 0.2825, conversions: 0.38 };

// Une configuration candidate (un placement potentiel) pour la période choisie.
type Config = {
  plateforme: Plateforme;
  typePub: TypePub;
  cible: Cible;
  prix: number;
  tauxConversion: number;
  audienceK: number;
  conversions: number;
  valeur: number; // valeur selon l'objectif (portée ou conversions)
};

function valeurUnitaire(obj: ObjectifPrincipal, audienceK: number, conversions: number): number {
  return obj === "notoriete" ? audienceK : conversions;
}

function scoringInput(
  plateforme: Plateforme,
  typePub: TypePub,
  cible: Cible,
  secteur: Secteur,
  typeEntreprise: TypeEntreprise,
  periode: string,
): ScoringInput {
  return {
    Plateforme: plateforme,
    Type_Pub: typePub,
    Cible: cible,
    Secteur: secteur,
    Type_Entreprise: typeEntreprise,
    Periode: periode,
  };
}

// Propension du partenaire à convertir en client payant. Heuristique simple : le
// dataset campagne ne porte pas ce signal, on dérive du profil (privé/secteur).
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

function buildConfigs(input: DemandeInput, catalogue: Catalogue): Config[] {
  const periode = periodeCommerciale(input.dateDebut, input.dateFin);
  const configs: Config[] = [];
  for (const plat of catalogue.plateformes) {
    for (const typePub of TYPES_PUB) {
      for (const cible of CIBLES) {
        const si = scoringInput(plat.id, typePub, cible, input.secteur, input.typeEntreprise, periode);
        const prix = predictPrix(si).value;
        const taux = predictTauxConversion(si).value;
        const audienceK = plat.audienceTypiqueK;
        const conversions = audienceK * 1000 * taux;
        configs.push({
          plateforme: plat.id,
          typePub,
          cible,
          prix,
          tauxConversion: taux,
          audienceK,
          conversions,
          valeur: valeurUnitaire(input.objectifPrincipal, audienceK, conversions),
        });
      }
    }
  }
  return configs;
}

// Panier de configurations DISTINCTES, glouton par efficience (valeur / €).
function allocateBudget(configs: Config[], budgetMediaNet: number): { choix: Config[]; statut: StatutReco } {
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
  const statut: StatutReco = choix.length === configs.length && remaining >= cheapest ? "sature" : "ok";
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

// Taux de conversion global = ratio pondéré (conversions / audience), avec un
// intervalle dérivé du sigma du modèle de conversion sur n placements.
function aggregateTaux(placements: PlacementChoisi[]): Estimation {
  const audience = placements.reduce((s, p) => s + p.audienceK * 1000, 0);
  const conversions = placements.reduce((s, p) => s + p.conversions, 0);
  const value = audience > 0 ? conversions / audience : 0;
  const n = Math.max(1, placements.length);
  const eff = SIGMA.taux / Math.sqrt(n);
  return {
    value,
    lo: value * Math.exp(-Z80 * eff),
    hi: value * Math.exp(Z80 * eff),
    confiance: Math.min(0.95, Math.max(0.5, Math.exp(-1.1 * eff))),
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
  leadScore: number,
  statut: StatutReco,
  message?: string,
): Recommandation {
  const taux = TAUX_COMMISSION;
  const coutMediaNet = placements.reduce((s, p) => s + p.prix, 0);
  const budgetTotal = coutMediaNet / (1 - taux);
  return {
    mode: input.mode,
    objectifPrincipal: input.objectifPrincipal,
    placements,
    audienceK: aggregate(placements.map((p) => p.audienceK), SIGMA.audience),
    tauxConversion: aggregateTaux(placements),
    conversions: aggregate(placements.map((p) => p.conversions), SIGMA.conversions),
    coutMediaNet,
    commission: budgetTotal - coutMediaNet,
    tauxCommission: taux,
    budgetTotal,
    leadScore,
    statut,
    message,
  };
}

export function optimiser(input: DemandeInput, catalogue: Catalogue): Recommandation {
  const configs = buildConfigs(input, catalogue);
  const leadScore = partnerLeadScore(input.typeEntreprise, input.secteur);

  let choix: Config[];
  let statut: StatutReco;
  if (input.mode === "budget") {
    const budgetMediaNet = (input.budget ?? 0) * (1 - TAUX_COMMISSION);
    ({ choix, statut } = allocateBudget(configs, budgetMediaNet));
  } else {
    ({ choix, statut } = allocateGoal(configs, input.objectifValeur ?? 0));
  }

  const placements = choix.map(toPlacement).sort((a, b) => b.prix - a.prix);
  return assemble(input, placements, leadScore, statut, messageStatut(statut, input, configs));
}

// Mode manuel : une configuration unique -> son tarif et le résultat attendu.
export function predictTarif(
  config: ConfigManuelle,
  secteur: Secteur,
  typeEntreprise: TypeEntreprise,
  catalogue: Catalogue,
): Recommandation {
  const plat = catalogue.plateformes.find((p) => p.id === config.plateforme);
  const base = { mode: "budget" as const, objectifPrincipal: config.objectifPrincipal };
  const leadScore = partnerLeadScore(typeEntreprise, secteur);

  if (!plat) {
    return assemble(base, [], leadScore, "infaisable", "Configuration invalide : plateforme introuvable.");
  }

  const periode = periodeCommerciale(config.dateDebut, config.dateFin);
  const si = scoringInput(plat.id, config.typePub, config.cible, secteur, typeEntreprise, periode);
  const taux = predictTauxConversion(si).value;
  const audienceK = plat.audienceTypiqueK;
  const placement: PlacementChoisi = {
    plateforme: plat.id,
    typePub: config.typePub,
    cible: config.cible,
    prix: predictPrix(si).value,
    audienceK,
    tauxConversion: taux,
    conversions: audienceK * 1000 * taux,
  };

  return assemble(base, [placement], leadScore, "ok");
}

function messageStatut(statut: StatutReco, input: DemandeInput, configs: Config[]): string | undefined {
  if (statut === "ok") return undefined;
  if (statut === "infaisable" && input.mode === "budget") {
    const cheapest = Math.min(...configs.map((c) => c.prix));
    return `Budget trop faible : le placement le moins cher coûte environ ${Math.round(cheapest)} € (hors commission). Augmentez le budget.`;
  }
  if (statut === "infaisable") {
    return "Objectif hors de portée sur cette période, même en mobilisant toutes les configurations. Réduisez l'objectif.";
  }
  return "Votre budget dépasse l'inventaire disponible : toutes les configurations pertinentes ont été retenues.";
}

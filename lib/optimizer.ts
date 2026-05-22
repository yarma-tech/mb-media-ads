import {
  CIBLES,
  type Cible,
  type MediaId,
  type ObjectifPrincipal,
  type Plateforme,
  TAUX_COMMISSION,
  TYPES_PUB,
  type TypePub,
} from "./enums";
import { dureeMois, fenetreCommerciale, moisRepresentatif } from "./saison";
import {
  predictAudience,
  predictFrequence,
  predictLeadScore,
  predictPrix,
  predictTauxLead,
  predictTauxVente,
} from "./scoring";
import type {
  Catalogue,
  DemandeInput,
  Estimation,
  PlacementChoisi,
  Recommandation,
  ScoringInput,
  StatutReco,
} from "./types";

const Z80 = 1.2816;
// Sigmas de base par métrique agrégée (combinaison des modèles concernés).
const SIGMA = { audience: 0.3, couverture: 0.323, leads: 0.35, ventes: 0.372 };

type Combo = {
  mediaId: MediaId;
  mediaNom: string;
  programmeId: string;
  programmeNom: string;
  plateforme: Plateforme;
  typePub: TypePub;
  cible: Cible;
  prixUnitaire: number;
  audienceUnitK: number;
  couvUnitK: number;
  leadsUnit: number;
  ventesUnit: number;
  valeurUnit: number; // selon l'objectif principal
  valeurParEuro: number;
};

function couvertureEff(audK: number, freq: number): number {
  const reach = audK / freq;
  return freq >= 3 ? reach : reach * (freq / 3);
}

function valeurUnitaire(obj: ObjectifPrincipal, couvK: number, leads: number, ventes: number): number {
  return obj === "notoriete" ? couvK : obj === "lead" ? leads : ventes;
}

function buildCombos(input: DemandeInput, catalogue: Catalogue): Combo[] {
  const combos: Combo[] = [];
  const mois = moisRepresentatif(input.dateDebut, input.dateFin);
  const mediaById = new Map(catalogue.medias.map((m) => [m.id, m]));

  for (const prog of catalogue.programmes) {
    const media = mediaById.get(prog.mediaId);
    if (!media) continue;
    const fenetre = fenetreCommerciale(media.id, mois);

    for (const plateforme of prog.plateformes) {
      for (const typePub of TYPES_PUB) {
        for (const cible of CIBLES) {
          const si: ScoringInput = {
            Media: media.id,
            Programme: prog.nom,
            Plateforme: plateforme,
            Type_Pub: typePub,
            Cible: cible,
            Secteur: input.secteur,
            Type_Entreprise: input.typeEntreprise,
            Quality_Score: media.qsTypique,
            Fenetre_Commerciale: fenetre,
          };
          const prix = predictPrix(si).value;
          const audK = predictAudience(si).value;
          const freq = predictFrequence(si).value;
          const tl = predictTauxLead(si).value;
          const tv = predictTauxVente(si).value;
          const couvK = couvertureEff(audK, freq);
          const leads = audK * 1000 * tl;
          const ventes = audK * 1000 * tv;
          const valeur = valeurUnitaire(input.objectifPrincipal, couvK, leads, ventes);
          combos.push({
            mediaId: media.id,
            mediaNom: media.nom,
            programmeId: prog.id,
            programmeNom: prog.nom,
            plateforme,
            typePub,
            cible,
            prixUnitaire: prix,
            audienceUnitK: audK,
            couvUnitK: couvK,
            leadsUnit: leads,
            ventesUnit: ventes,
            valeurUnit: valeur,
            valeurParEuro: valeur / prix,
          });
        }
      }
    }
  }
  return combos;
}

function capacites(catalogue: Catalogue, dm: number): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of catalogue.programmes) m.set(p.id, Math.max(1, Math.floor(p.cadenceParMois * dm)));
  return m;
}

type Choix = { combo: Combo; insertions: number };

// Rendement décroissant par programme (recouvrement d'audience) : heuristique de
// diversification pour composer une vraie campagne multi-programmes. Les métriques affichées
// restent linéaires (sommes) — simplification assumée du prototype.
const FATIGUE_K = 4;
const decay = (n: number) => 1 / (1 + n / FATIGUE_K);

// Une combinaison candidate par programme (sa meilleure valeur/€) ; capacité au grain programme.
function bestPerProgramme(combos: Combo[]): Combo[] {
  const best = new Map<string, Combo>();
  for (const c of combos) {
    const cur = best.get(c.programmeId);
    if (!cur || c.valeurParEuro > cur.valeurParEuro) best.set(c.programmeId, c);
  }
  return [...best.values()];
}

function toChoix(cands: Combo[], ins: Map<string, number>): Choix[] {
  return cands
    .filter((c) => (ins.get(c.programmeId) ?? 0) > 0)
    .map((c) => ({ combo: c, insertions: ins.get(c.programmeId) as number }));
}

function allocateBudget(combos: Combo[], caps: Map<string, number>, budgetMediaNet: number): { choix: Choix[]; statut: StatutReco } {
  const cands = bestPerProgramme(combos);
  const cap = new Map(caps);
  const ins = new Map<string, number>();
  const cheapest = Math.min(...cands.map((c) => c.prixUnitaire));
  let remaining = budgetMediaNet;

  if (cheapest > budgetMediaNet) return { choix: [], statut: "infaisable" };

  // Greedy par efficience marginale (valeur décroissante / €), insertion par insertion.
  while (remaining >= cheapest) {
    let best: Combo | null = null;
    let bestScore = 0;
    for (const c of cands) {
      const used = ins.get(c.programmeId) ?? 0;
      if ((cap.get(c.programmeId) ?? 0) - used <= 0 || c.prixUnitaire > remaining) continue;
      const score = (c.valeurUnit * decay(used)) / c.prixUnitaire;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (!best) break;
    ins.set(best.programmeId, (ins.get(best.programmeId) ?? 0) + 1);
    remaining -= best.prixUnitaire;
  }

  const capaciteRestante = cands.some((c) => (cap.get(c.programmeId) ?? 0) - (ins.get(c.programmeId) ?? 0) > 0);
  const statut: StatutReco = remaining >= cheapest && !capaciteRestante ? "sature" : "ok";
  return { choix: toChoix(cands, ins), statut };
}

function allocateGoal(combos: Combo[], caps: Map<string, number>, target: number): { choix: Choix[]; statut: StatutReco } {
  const cands = bestPerProgramme(combos);
  const cap = new Map(caps);
  const ins = new Map<string, number>();
  let achieved = 0;

  while (achieved < target) {
    let best: Combo | null = null;
    let bestScore = 0;
    for (const c of cands) {
      if (c.valeurUnit <= 0) continue;
      const used = ins.get(c.programmeId) ?? 0;
      if ((cap.get(c.programmeId) ?? 0) - used <= 0) continue;
      const score = (c.valeurUnit * decay(used)) / c.prixUnitaire;
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    if (!best) break;
    ins.set(best.programmeId, (ins.get(best.programmeId) ?? 0) + 1);
    achieved += best.valeurUnit;
  }

  return { choix: toChoix(cands, ins), statut: achieved >= target ? "ok" : "infaisable" };
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

function toPlacement(c: Combo, insertions: number): PlacementChoisi {
  return {
    mediaId: c.mediaId,
    mediaNom: c.mediaNom,
    programmeId: c.programmeId,
    programmeNom: c.programmeNom,
    plateforme: c.plateforme,
    typePub: c.typePub,
    cible: c.cible,
    insertions,
    prixUnitaire: c.prixUnitaire,
    coutMediaNet: insertions * c.prixUnitaire,
    audienceK: insertions * c.audienceUnitK,
    leads: insertions * c.leadsUnit,
    ventes: insertions * c.ventesUnit,
    couvertureEfficaceK: insertions * c.couvUnitK,
  };
}

export function optimiser(input: DemandeInput, catalogue: Catalogue): Recommandation {
  const taux = TAUX_COMMISSION;
  const dm = dureeMois(input.dateDebut, input.dateFin);
  const combos = buildCombos(input, catalogue);
  const caps = capacites(catalogue, dm);

  const leadScore = predictLeadScore({ Type_Entreprise: input.typeEntreprise, Secteur: input.secteur });

  let choix: Choix[];
  let statut: StatutReco;
  if (input.mode === "budget") {
    const budgetMediaNet = (input.budget ?? 0) * (1 - taux);
    ({ choix, statut } = allocateBudget(combos, caps, budgetMediaNet));
  } else {
    ({ choix, statut } = allocateGoal(combos, caps, input.objectifValeur ?? 0));
  }

  const placements = choix
    .map((x) => toPlacement(x.combo, x.insertions))
    .sort((a, b) => b.coutMediaNet - a.coutMediaNet);

  const coutMediaNet = placements.reduce((s, p) => s + p.coutMediaNet, 0);
  const budgetTotal = coutMediaNet / (1 - taux);
  const commission = budgetTotal - coutMediaNet;

  const reco: Recommandation = {
    mode: input.mode,
    objectifPrincipal: input.objectifPrincipal,
    placements,
    audienceK: aggregate(placements.map((p) => p.audienceK), SIGMA.audience),
    couvertureEfficaceK: aggregate(placements.map((p) => p.couvertureEfficaceK), SIGMA.couverture),
    leads: aggregate(placements.map((p) => p.leads), SIGMA.leads),
    ventes: aggregate(placements.map((p) => p.ventes), SIGMA.ventes),
    coutMediaNet,
    commission,
    tauxCommission: taux,
    budgetTotal,
    leadScore,
    statut,
    message: messageStatut(statut, input, combos),
  };
  return reco;
}

function messageStatut(statut: StatutReco, input: DemandeInput, combos: Combo[]): string | undefined {
  if (statut === "ok") return undefined;
  if (statut === "infaisable" && input.mode === "budget") {
    const cheapest = Math.min(...combos.map((c) => c.prixUnitaire));
    return `Budget trop faible : le placement le moins cher coûte environ ${Math.round(cheapest)} € (hors commission). Augmentez le budget ou allongez la période.`;
  }
  if (statut === "infaisable") {
    return "Objectif hors de portée sur cette période, même en mobilisant toute la capacité de diffusion. Allongez la période ou réduisez l'objectif.";
  }
  // sature
  return "Votre budget dépasse la capacité de diffusion disponible sur cette période. Nous avons retenu le maximum pertinent ; allongez la période pour investir davantage.";
}

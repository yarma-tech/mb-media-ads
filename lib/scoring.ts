import { MODELS } from "./models";
import type {
  Estimation,
  FeatureCoeffs,
  LogisticModel,
  RegressionModel,
  ScoringInput,
} from "./types";

// Quantile normal pour un intervalle ~80 %.
const Z80 = 1.2816;

function linearPart(features: FeatureCoeffs, intercept: number, input: ScoringInput): number {
  let s = intercept;
  if (features.numeric) {
    for (const [k, c] of Object.entries(features.numeric)) {
      const v = input[k];
      if (typeof v === "number") s += c * v;
    }
  }
  if (features.categorical) {
    for (const [feat, table] of Object.entries(features.categorical)) {
      const level = input[feat];
      if (typeof level === "string" && level in table) s += table[level];
    }
  }
  if (features.interactions) {
    const key = `${input["Cible"]}__${input["Plateforme"]}`;
    if (key in features.interactions) s += features.interactions[key];
  }
  return s;
}

function clampOut(x: number, clamp?: [number, number]): number {
  if (!clamp) return x;
  return Math.min(clamp[1], Math.max(clamp[0], x));
}

// Confiance dérivée de l'incertitude résiduelle (sigma) -> bornée 0.5..0.92.
export function confianceFromSigma(sigma: number): number {
  return Math.min(0.92, Math.max(0.5, Math.exp(-1.1 * sigma)));
}

export function scoreRegression(model: RegressionModel, input: ScoringInput): Estimation {
  const mu = linearPart(model.features, model.intercept, input);
  const tr = model.link === "log" ? Math.exp : (x: number) => x;
  return {
    value: clampOut(tr(mu), model.clamp),
    lo: clampOut(tr(mu - Z80 * model.sigma), model.clamp),
    hi: clampOut(tr(mu + Z80 * model.sigma), model.clamp),
    confiance: confianceFromSigma(model.sigma),
  };
}

export function scoreLogistic(model: LogisticModel, input: ScoringInput): number {
  const z = linearPart(model.features, model.intercept, input);
  return 1 / (1 + Math.exp(-z));
}

const reg = (n: "prix" | "audience" | "taux_lead" | "taux_vente" | "frequence") =>
  MODELS[n] as RegressionModel;

export const predictPrix = (i: ScoringInput) => scoreRegression(reg("prix"), i);
export const predictAudience = (i: ScoringInput) => scoreRegression(reg("audience"), i);
export const predictTauxLead = (i: ScoringInput) => scoreRegression(reg("taux_lead"), i);
export const predictTauxVente = (i: ScoringInput) => scoreRegression(reg("taux_vente"), i);
export const predictFrequence = (i: ScoringInput) => scoreRegression(reg("frequence"), i);
export const predictLeadScore = (i: ScoringInput) => scoreLogistic(MODELS.lead_score as LogisticModel, i);

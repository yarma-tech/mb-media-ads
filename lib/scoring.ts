import { MODELS, type ModelName } from "./models";
import type { Estimation, FeatureCoeffs, RegressionModel, ScoringInput } from "./types";

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

const reg = (n: ModelName) => MODELS[n] as RegressionModel;

export const predictPrix = (i: ScoringInput) => scoreRegression(reg("prix"), i);
export const predictTauxConversion = (i: ScoringInput) => scoreRegression(reg("taux_conversion"), i);

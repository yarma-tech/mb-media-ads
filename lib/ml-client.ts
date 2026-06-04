import "server-only";

import type { MlBatchResponse, MlConfigInput, MlMeta, MlPrediction } from "./ml-types";

// Client du micro-service d'inférence ML (FastAPI sur Fly.io, voir ml-service/).
// Envoie un batch de configs, retourne les prédictions + la précision du modèle.

const DEFAULT_TIMEOUT_MS = 5_000;

// Résultat d'un batch : prédictions + méta (famille de modèle + métriques de précision).
// `meta` est absent uniquement pour le court-circuit "aucune config".
export type PredictResult = { predictions: MlPrediction[]; meta?: MlMeta };

export class MlClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "MlClientError";
  }
}

function envOrThrow(name: string): string {
  const v = process.env[name];
  if (!v) throw new MlClientError(`Variable d'environnement manquante : ${name}`);
  return v;
}

export function isFallbackEnabled(): boolean {
  return process.env.ML_FALLBACK_LOCAL === "true";
}

export async function predictBatch(
  configs: MlConfigInput[],
  options: { timeoutMs?: number; signal?: AbortSignal } = {},
): Promise<PredictResult> {
  if (configs.length === 0) return { predictions: [] };

  const url = `${envOrThrow("ML_API_URL").replace(/\/$/, "")}/predict/batch`;
  const token = envOrThrow("ML_API_TOKEN");

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  if (options.signal) {
    options.signal.addEventListener("abort", () => ctrl.abort(), { once: true });
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ configs }),
      signal: ctrl.signal,
      cache: "no-store",
    });
  } catch (err) {
    throw new MlClientError("Service ML injoignable", undefined, err);
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new MlClientError(`Service ML a renvoyé ${res.status}: ${body}`.slice(0, 500), res.status);
  }

  const payload = (await res.json()) as MlBatchResponse;
  if (!payload?.predictions || !Array.isArray(payload.predictions)) {
    throw new MlClientError("Réponse ML invalide (format inattendu)");
  }
  if (payload.predictions.length !== configs.length) {
    throw new MlClientError(
      `Réponse ML incomplète : ${payload.predictions.length}/${configs.length} prédictions`,
    );
  }
  return { predictions: payload.predictions, meta: payload.meta };
}

"use client";

import { type ComponentType, useEffect, useRef, useState } from "react";
import { type ObjectifPrincipal, OBJECTIF_DESC, OBJECTIF_LABEL, OBJECTIFS } from "@/lib/enums";
import { eur, formatPeriode } from "@/lib/format";
import type { CampagneAutoInput, Recommandation } from "@/lib/types";
import { recommander } from "../actions";
import {
  IconArrowLeft,
  IconArrowRight,
  IconEye,
  IconShoppingBag,
  IconTarget,
  IconUserPlus,
  IconWallet,
} from "./icons";
import { ResultatCta } from "./result-cta";
import { ResultatReco } from "./resultat-reco";

type Errors = Partial<Record<string, string>>;

const OBJECTIF_ICON: Record<ObjectifPrincipal, ComponentType<{ className?: string }>> = {
  notoriete: IconEye,
  lead: IconUserPlus,
  vente: IconShoppingBag,
};

function goalLabel(obj: ObjectifPrincipal): string {
  if (obj === "notoriete") return "Couverture efficace visée (milliers de personnes)";
  if (obj === "lead") return "Nombre de leads (inscriptions) visés";
  return "Nombre de ventes visées";
}

export function Formulaire({ nomEntreprise = "Votre campagne" }: { nomEntreprise?: string }) {
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [objectif, setObjectif] = useState<ObjectifPrincipal>("notoriete");
  const [mode, setMode] = useState<"budget" | "goal">("budget");
  const [budget, setBudget] = useState("");
  const [objectifValeur, setObjectifValeur] = useState("");

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [reco, setReco] = useState<Recommandation | null>(null);
  const [submitError, setSubmitError] = useState("");

  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ((reco || loading) && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [reco, loading]);

  function validate(): Errors {
    const e: Errors = {};
    if (!dateDebut) e.dateDebut = "Requis";
    if (!dateFin) e.dateFin = "Requis";
    if (dateDebut && dateFin && dateFin < dateDebut) e.dateFin = "La fin doit suivre le début";
    if (mode === "budget") {
      if (!budget || Number(budget) <= 0) e.budget = "Indiquez un budget positif";
    } else if (!objectifValeur || Number(objectifValeur) <= 0) {
      e.objectifValeur = "Indiquez un objectif positif";
    }
    return e;
  }

  function buildInput(): CampagneAutoInput {
    return {
      dateDebut,
      dateFin,
      objectifPrincipal: objectif,
      mode,
      budget: mode === "budget" ? Number(budget) : undefined,
      objectifValeur: mode === "goal" ? Number(objectifValeur) : undefined,
    };
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setLoading(true);
    setReco(null);
    setSubmitError("");
    try {
      setReco(await recommander(buildInput()));
    } catch {
      setSubmitError("Impossible de calculer la campagne pour le moment. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  function modifier() {
    setReco(null);
    setSubmitError("");
  }

  const contrainteResume =
    mode === "budget"
      ? `budget ${eur(Number(budget) || 0)}`
      : `objectif ${objectifValeur || 0} ${objectif === "notoriete" ? "K couv." : objectif === "lead" ? "leads" : "ventes"}`;

  const showForm = !reco && !loading;

  return (
    <>
      {showForm ? (
        <form className="panel form-card" onSubmit={onSubmit} noValidate>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Votre objectif principal</legend>
            <div className="segmented cols-3">
              {OBJECTIFS.map((o) => {
                const Icon = OBJECTIF_ICON[o];
                return (
                  <button type="button" key={o} aria-pressed={objectif === o} onClick={() => setObjectif(o)}>
                    <span className="seg-title">
                      <Icon /> {OBJECTIF_LABEL[o]}
                    </span>
                    <span className="seg-desc">{OBJECTIF_DESC[o]}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Votre contrainte</legend>
            <div className="segmented" style={{ marginBottom: 16 }}>
              <button type="button" aria-pressed={mode === "budget"} onClick={() => setMode("budget")}>
                <span className="seg-title">
                  <IconWallet /> J'ai un budget
                </span>
                <span className="seg-desc">On maximise le résultat</span>
              </button>
              <button type="button" aria-pressed={mode === "goal"} onClick={() => setMode("goal")}>
                <span className="seg-title">
                  <IconTarget /> J'ai un objectif chiffré
                </span>
                <span className="seg-desc">On minimise le budget</span>
              </button>
            </div>
            {mode === "budget" ? (
              <div className="field">
                <label htmlFor="budget">Budget total (€)</label>
                <input id="budget" type="number" min="0" inputMode="numeric" value={budget} onChange={(e) => setBudget(e.target.value)} aria-invalid={!!errors.budget} placeholder="Ex. 5000" />
                <span className="hint">Commission MB Média incluse dans ce montant.</span>
                {errors.budget ? <span className="field-error">{errors.budget}</span> : null}
              </div>
            ) : (
              <div className="field">
                <label htmlFor="goal">{goalLabel(objectif)}</label>
                <input id="goal" type="number" min="0" inputMode="numeric" value={objectifValeur} onChange={(e) => setObjectifValeur(e.target.value)} aria-invalid={!!errors.objectifValeur} placeholder="Ex. 300" />
                {errors.objectifValeur ? <span className="field-error">{errors.objectifValeur}</span> : null}
              </div>
            )}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Période de campagne</legend>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="d1">Date de début</label>
                <input id="d1" type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} aria-invalid={!!errors.dateDebut} />
                {errors.dateDebut ? <span className="field-error">{errors.dateDebut}</span> : null}
              </div>
              <div className="field">
                <label htmlFor="d2">Date de fin</label>
                <input id="d2" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} aria-invalid={!!errors.dateFin} />
                {errors.dateFin ? <span className="field-error">{errors.dateFin}</span> : null}
              </div>
            </div>
          </fieldset>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            Voir la campagne idéale <IconArrowRight />
          </button>
          {submitError ? (
            <p className="field-error" style={{ marginTop: 12 }}>
              {submitError}
            </p>
          ) : null}
        </form>
      ) : null}

      <div ref={resultRef}>
        {loading ? (
          <div aria-live="polite">
            <h2>Calcul de la campagne idéale…</h2>
            <div className="reco">
              <div className="skel skel-answer" />
              <div className="skel skel-row" />
            </div>
          </div>
        ) : null}

        {reco && !loading ? (
          <section className="reveal" aria-live="polite">
            <div className="demande-summary">
              <div>
                <span className="ds-name">{nomEntreprise}</span>
                <span className="ds-meta">
                  {OBJECTIF_LABEL[objectif]} · {contrainteResume}
                  {dateDebut && dateFin ? ` · ${formatPeriode(dateDebut, dateFin)}` : ""}
                </span>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={modifier}>
                <IconArrowLeft /> Modifier
              </button>
            </div>

            <ResultatReco reco={reco} />

            {reco.statut !== "infaisable" ? (
              <ResultatCta payload={{ kind: "auto", campagne: buildInput() }} budgetTotal={reco.budgetTotal} />
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}

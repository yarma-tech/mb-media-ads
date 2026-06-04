"use client";

import { type ComponentType, useEffect, useRef, useState } from "react";
import {
  type Cible,
  CIBLE_LABEL,
  CIBLES,
  MODEL_TYPE_DESC,
  MODEL_TYPE_LABEL,
  MODEL_TYPES,
  type ModelType,
  OBJECTIF_DESC,
  OBJECTIF_LABEL,
  OBJECTIFS,
  type ObjectifPrincipal,
  type Plateforme,
  TYPES_PUB,
  type TypePub,
} from "@/lib/enums";
import { formatPeriode } from "@/lib/format";
import type { Catalogue, ConfigManuelle, Recommandation } from "@/lib/types";
import { tarif } from "../actions";
import { IconArrowLeft, IconArrowRight, IconEye, IconShoppingBag } from "./icons";
import { ResultatCta } from "./result-cta";
import { ResultatReco } from "./resultat-reco";

type Errors = Partial<Record<string, string>>;

const OBJECTIF_ICON: Record<ObjectifPrincipal, ComponentType<{ className?: string }>> = {
  notoriete: IconEye,
  conversion: IconShoppingBag,
};

export function FormulaireManuel({ catalogue }: { catalogue: Catalogue }) {
  const [plateforme, setPlateforme] = useState<Plateforme | "">("");
  const [typePub, setTypePub] = useState<TypePub | "">("");
  const [cible, setCible] = useState<Cible | "">("");
  const [objectif, setObjectif] = useState<ObjectifPrincipal>("notoriete");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [modelType, setModelType] = useState<ModelType>("rf");

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [reco, setReco] = useState<Recommandation | null>(null);
  const [lastConfig, setLastConfig] = useState<ConfigManuelle | null>(null);
  const [submitError, setSubmitError] = useState("");

  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ((reco || loading) && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [reco, loading]);

  function validate(): Errors {
    const e: Errors = {};
    if (!plateforme) e.plateforme = "Requis";
    if (!typePub) e.typePub = "Requis";
    if (!cible) e.cible = "Requis";
    if (!dateDebut) e.dateDebut = "Requis";
    if (!dateFin) e.dateFin = "Requis";
    if (dateDebut && dateFin && dateFin < dateDebut) e.dateFin = "La fin doit suivre le début";
    return e;
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
      const config: ConfigManuelle = {
        plateforme: plateforme as Plateforme,
        typePub: typePub as TypePub,
        cible: cible as Cible,
        objectifPrincipal: objectif,
        dateDebut,
        dateFin,
        modelType,
      };
      setLastConfig(config);
      setReco(await tarif(config));
    } catch {
      setSubmitError("Impossible de calculer le tarif pour le moment. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  function modifier() {
    setReco(null);
    setSubmitError("");
  }

  const showForm = !reco && !loading;

  return (
    <>
      {showForm ? (
        <form className="panel form-card" onSubmit={onSubmit} noValidate>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Votre placement</legend>
            <div className="field">
              <label htmlFor="m-plat">Plateforme</label>
              <select
                id="m-plat"
                value={plateforme}
                onChange={(e) => setPlateforme(e.target.value as Plateforme)}
                aria-invalid={!!errors.plateforme}
              >
                <option value="">Sélectionner…</option>
                {catalogue.plateformes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nom}
                  </option>
                ))}
              </select>
              {errors.plateforme ? <span className="field-error">{errors.plateforme}</span> : null}
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="m-type">Type de publicité</label>
                <select id="m-type" value={typePub} onChange={(e) => setTypePub(e.target.value as TypePub)} aria-invalid={!!errors.typePub}>
                  <option value="">Sélectionner…</option>
                  {TYPES_PUB.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {errors.typePub ? <span className="field-error">{errors.typePub}</span> : null}
              </div>
              <div className="field">
                <label htmlFor="m-cible">Cible</label>
                <select id="m-cible" value={cible} onChange={(e) => setCible(e.target.value as Cible)} aria-invalid={!!errors.cible}>
                  <option value="">Sélectionner…</option>
                  {CIBLES.map((c) => (
                    <option key={c} value={c}>
                      {CIBLE_LABEL[c]}
                    </option>
                  ))}
                </select>
                {errors.cible ? <span className="field-error">{errors.cible}</span> : null}
              </div>
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Votre objectif</legend>
            <div className="segmented">
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
            <legend className="fieldset-legend">Période</legend>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="m-d1">Date de début</label>
                <input id="m-d1" type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} aria-invalid={!!errors.dateDebut} />
                {errors.dateDebut ? <span className="field-error">{errors.dateDebut}</span> : null}
              </div>
              <div className="field">
                <label htmlFor="m-d2">Date de fin</label>
                <input id="m-d2" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} aria-invalid={!!errors.dateFin} />
                {errors.dateFin ? <span className="field-error">{errors.dateFin}</span> : null}
              </div>
            </div>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Modèle d'estimation</legend>
            <div className="segmented">
              {MODEL_TYPES.map((mt) => (
                <button type="button" key={mt} aria-pressed={modelType === mt} onClick={() => setModelType(mt)}>
                  <span className="seg-title">{MODEL_TYPE_LABEL[mt]}</span>
                  <span className="seg-desc">{MODEL_TYPE_DESC[mt]}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            Voir mon tarif <IconArrowRight />
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
            <h2>Calcul du tarif…</h2>
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
                <span className="ds-name">{plateforme}</span>
                <span className="ds-meta">
                  {OBJECTIF_LABEL[objectif]}
                  {dateDebut && dateFin ? ` · ${formatPeriode(dateDebut, dateFin)}` : ""}
                </span>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={modifier}>
                <IconArrowLeft /> Modifier
              </button>
            </div>

            <ResultatReco reco={reco} />

            {reco.statut !== "infaisable" && lastConfig ? (
              <ResultatCta payload={{ kind: "manuel", config: lastConfig }} budgetTotal={reco.budgetTotal} />
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}

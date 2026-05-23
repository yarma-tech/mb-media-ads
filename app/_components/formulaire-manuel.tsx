"use client";

import { type ComponentType, useEffect, useRef, useState } from "react";
import {
  type Cible,
  CIBLE_LABEL,
  CIBLES,
  type MediaId,
  OBJECTIF_DESC,
  OBJECTIF_LABEL,
  OBJECTIFS,
  type ObjectifPrincipal,
  type Plateforme,
  TYPES_PUB,
  type TypePub,
} from "@/lib/enums";
import { formatPeriode } from "@/lib/format";
import { dureeMois } from "@/lib/saison";
import type { Catalogue, ConfigManuelle, Recommandation } from "@/lib/types";
import { tarif } from "../actions";
import { IconArrowLeft, IconArrowRight, IconEye, IconShoppingBag, IconTarget, IconUserPlus } from "./icons";
import { ResultatCta } from "./result-cta";
import { ResultatReco } from "./resultat-reco";

type Errors = Partial<Record<string, string>>;

const OBJECTIF_ICON: Record<ObjectifPrincipal, ComponentType<{ className?: string }>> = {
  notoriete: IconEye,
  lead: IconUserPlus,
  vente: IconShoppingBag,
};

export function FormulaireManuel({ catalogue }: { catalogue: Catalogue }) {
  const [mediaId, setMediaId] = useState<MediaId | "">("");
  const [programmeId, setProgrammeId] = useState("");
  const [plateforme, setPlateforme] = useState<Plateforme | "">("");
  const [typePub, setTypePub] = useState<TypePub | "">("");
  const [cible, setCible] = useState<Cible | "">("");
  const [objectif, setObjectif] = useState<ObjectifPrincipal>("notoriete");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [insertions, setInsertions] = useState("");
  const [insTouched, setInsTouched] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [reco, setReco] = useState<Recommandation | null>(null);
  const [lastConfig, setLastConfig] = useState<ConfigManuelle | null>(null);
  const [submitError, setSubmitError] = useState("");

  const programmes = catalogue.programmes.filter((p) => p.mediaId === mediaId);
  const prog = catalogue.programmes.find((p) => p.id === programmeId);
  const plateformes = prog?.plateformes ?? [];

  // Suggère un nombre de diffusions = cadence × durée, tant que l'utilisateur ne l'a pas édité.
  useEffect(() => {
    if (insTouched || !prog || !dateDebut || !dateFin) return;
    const months = dureeMois(dateDebut, dateFin);
    setInsertions(String(Math.max(1, Math.round(prog.cadenceParMois * months))));
  }, [prog, dateDebut, dateFin, insTouched]);

  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ((reco || loading) && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [reco, loading]);

  function onMedia(v: string) {
    setMediaId(v as MediaId);
    setProgrammeId("");
    setPlateforme("");
    setInsTouched(false);
  }
  function onProgramme(v: string) {
    setProgrammeId(v);
    setPlateforme("");
    setInsTouched(false);
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!mediaId) e.media = "Requis";
    if (!programmeId) e.programme = "Requis";
    if (!plateforme) e.plateforme = "Requis";
    if (!typePub) e.typePub = "Requis";
    if (!cible) e.cible = "Requis";
    if (!dateDebut) e.dateDebut = "Requis";
    if (!dateFin) e.dateFin = "Requis";
    if (dateDebut && dateFin && dateFin < dateDebut) e.dateFin = "La fin doit suivre le début";
    if (!insertions || Number(insertions) < 1) e.insertions = "Au moins 1 diffusion";
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
        mediaId: mediaId as MediaId,
        programmeId,
        plateforme: plateforme as Plateforme,
        typePub: typePub as TypePub,
        cible: cible as Cible,
        objectifPrincipal: objectif,
        dateDebut,
        dateFin,
        insertions: Number(insertions),
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
  const mediaNom = catalogue.medias.find((m) => m.id === mediaId)?.nom ?? "";

  return (
    <>
      {showForm ? (
        <form className="panel form-card" onSubmit={onSubmit} noValidate>
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Votre placement</legend>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="m-media">Média</label>
                <select id="m-media" value={mediaId} onChange={(e) => onMedia(e.target.value)} aria-invalid={!!errors.media}>
                  <option value="">Sélectionner…</option>
                  {catalogue.medias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nom}
                    </option>
                  ))}
                </select>
                {errors.media ? <span className="field-error">{errors.media}</span> : null}
              </div>
              <div className="field">
                <label htmlFor="m-prog">Programme</label>
                <select
                  id="m-prog"
                  value={programmeId}
                  onChange={(e) => onProgramme(e.target.value)}
                  disabled={!mediaId}
                  aria-invalid={!!errors.programme}
                >
                  <option value="">{mediaId ? "Sélectionner…" : "Choisir un média d'abord"}</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom}
                    </option>
                  ))}
                </select>
                {errors.programme ? <span className="field-error">{errors.programme}</span> : null}
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="m-plat">Réseau social</label>
                <select
                  id="m-plat"
                  value={plateforme}
                  onChange={(e) => setPlateforme(e.target.value as Plateforme)}
                  disabled={!programmeId}
                  aria-invalid={!!errors.plateforme}
                >
                  <option value="">{programmeId ? "Sélectionner…" : "Choisir un programme d'abord"}</option>
                  {plateformes.map((pl) => (
                    <option key={pl} value={pl}>
                      {pl}
                    </option>
                  ))}
                </select>
                {errors.plateforme ? <span className="field-error">{errors.plateforme}</span> : null}
              </div>
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
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Votre objectif</legend>
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
            <legend className="fieldset-legend">Période & volume</legend>
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
            <div className="field">
              <label htmlFor="m-ins">Nombre de diffusions</label>
              <input
                id="m-ins"
                type="number"
                min="1"
                inputMode="numeric"
                value={insertions}
                onChange={(e) => {
                  setInsertions(e.target.value);
                  setInsTouched(true);
                }}
                aria-invalid={!!errors.insertions}
                placeholder="Ex. 12"
              />
              <span className="hint">Suggestion basée sur la cadence du programme sur la période. Ajustable.</span>
              {errors.insertions ? <span className="field-error">{errors.insertions}</span> : null}
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
                <span className="ds-name">
                  {mediaNom} · {prog?.nom}
                </span>
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

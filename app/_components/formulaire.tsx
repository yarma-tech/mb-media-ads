"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  type ObjectifPrincipal,
  OBJECTIF_DESC,
  OBJECTIF_LABEL,
  OBJECTIFS,
  type Secteur,
  SECTEURS,
  type TypeEntreprise,
  TYPES_ENTREPRISE,
} from "@/lib/enums";
import { eur, formatPeriode } from "@/lib/format";
import type { DemandeInput, Recommandation } from "@/lib/types";
import { recommander, envoyerDemande } from "../actions";
import { IconArrowRight, IconCheck, IconSend } from "./icons";
import { ResultatReco } from "./resultat-reco";

type Errors = Partial<Record<string, string>>;

function goalLabel(obj: ObjectifPrincipal): string {
  if (obj === "notoriete") return "Couverture efficace visée (milliers de personnes)";
  if (obj === "lead") return "Nombre de leads (inscriptions) visés";
  return "Nombre de ventes visées";
}

export function Formulaire() {
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [nomContact, setNomContact] = useState("");
  const [secteur, setSecteur] = useState<Secteur | "">("");
  const [typeEntreprise, setTypeEntreprise] = useState<TypeEntreprise | "">("");
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
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);

  const resultRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if ((reco || loading) && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [reco, loading]);

  function validate(): Errors {
    const e: Errors = {};
    if (!nomEntreprise.trim()) e.nomEntreprise = "Requis";
    if (!nomContact.trim()) e.nomContact = "Requis";
    if (!secteur) e.secteur = "Choisissez un secteur";
    if (!typeEntreprise) e.typeEntreprise = "Choisissez un type";
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

  function buildInput(): DemandeInput {
    return {
      nomEntreprise: nomEntreprise.trim(),
      nomContact: nomContact.trim(),
      secteur: secteur as Secteur,
      typeEntreprise: typeEntreprise as TypeEntreprise,
      dateDebut,
      dateFin,
      objectifPrincipal: objectif,
      mode,
      budget: mode === "budget" ? Number(budget) : undefined,
      objectifValeur: mode === "goal" ? Number(objectifValeur) : undefined,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    setReco(null);
    setSentId(null);
    setSubmitError("");
    try {
      setReco(await recommander(buildInput()));
    } catch {
      setSubmitError("Impossible de calculer la campagne pour le moment. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  async function onEnvoyer() {
    setSending(true);
    try {
      const { id } = await envoyerDemande(buildInput());
      setSentId(id);
    } catch {
      setSubmitError("L'envoi a échoué. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <form className="panel" onSubmit={onSubmit} noValidate>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Votre identité</legend>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="ent">Nom de l'entreprise / structure</label>
              <input id="ent" value={nomEntreprise} onChange={(e) => setNomEntreprise(e.target.value)} aria-invalid={!!errors.nomEntreprise} placeholder="Ex. Gwada Fresh" />
              {errors.nomEntreprise ? <span className="field-error">{errors.nomEntreprise}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="contact">Nom du contact</label>
              <input id="contact" value={nomContact} onChange={(e) => setNomContact(e.target.value)} aria-invalid={!!errors.nomContact} placeholder="Ex. Marie Lubin" />
              {errors.nomContact ? <span className="field-error">{errors.nomContact}</span> : null}
            </div>
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Votre profil</legend>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="secteur">Secteur d'activité</label>
              <select id="secteur" value={secteur} onChange={(e) => setSecteur(e.target.value as Secteur)} aria-invalid={!!errors.secteur}>
                <option value="">Sélectionner…</option>
                {SECTEURS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.secteur ? <span className="field-error">{errors.secteur}</span> : null}
            </div>
            <div className="field">
              <label htmlFor="type">Type de structure</label>
              <select id="type" value={typeEntreprise} onChange={(e) => setTypeEntreprise(e.target.value as TypeEntreprise)} aria-invalid={!!errors.typeEntreprise}>
                <option value="">Sélectionner…</option>
                {TYPES_ENTREPRISE.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.typeEntreprise ? <span className="field-error">{errors.typeEntreprise}</span> : null}
            </div>
          </div>
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

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Objectif principal</legend>
          <div className="segmented cols-3">
            {OBJECTIFS.map((o) => (
              <button type="button" key={o} aria-pressed={objectif === o} onClick={() => setObjectif(o)}>
                <span className="seg-title">{OBJECTIF_LABEL[o]}</span>
                <span className="seg-desc">{OBJECTIF_DESC[o]}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Votre contrainte</legend>
          <div className="segmented" style={{ marginBottom: 16 }}>
            <button type="button" aria-pressed={mode === "budget"} onClick={() => setMode("budget")}>
              <span className="seg-title">J'ai un budget</span>
              <span className="seg-desc">On maximise le résultat</span>
            </button>
            <button type="button" aria-pressed={mode === "goal"} onClick={() => setMode("goal")}>
              <span className="seg-title">J'ai un objectif chiffré</span>
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

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Calcul en cours…" : "Voir la campagne idéale"}
          {!loading ? <IconArrowRight /> : null}
        </button>
        {submitError ? (
          <p className="field-error" style={{ marginTop: 12 }}>{submitError}</p>
        ) : null}
      </form>

      <div ref={resultRef}>
        {loading ? (
          <div className="section-gap" aria-live="polite">
            <h2>Calcul de la campagne idéale…</h2>
            <div className="reco">
              <div className="skel skel-answer" />
              <div className="skel skel-row" />
            </div>
          </div>
        ) : null}

        {reco && !loading ? (
          <section className="section-gap reveal" aria-live="polite">
            <h2>Votre campagne idéale</h2>
            <p className="muted" style={{ marginTop: -6, marginBottom: 18 }}>
              {OBJECTIF_LABEL[objectif]} ·{" "}
              {mode === "budget" ? `budget ${eur(Number(budget))}` : `objectif ${objectifValeur}`} ·{" "}
              {dateDebut && dateFin ? formatPeriode(dateDebut, dateFin) : null}
            </p>

            <ResultatReco reco={reco} />

            {reco.statut !== "infaisable" ? (
              <div className="section-gap">
                {sentId ? (
                  <>
                    <div className="notice notice-accent" style={{ marginBottom: 16 }}>
                      <IconCheck />
                      <span>
                        Demande envoyée (simulation). MB Média revient vers vous après étude.
                      </span>
                    </div>
                    <div className="email-sim">
                      <div className="e-meta">À : {nomContact} · de : MB Média &lt;contact@mbmedia.fr&gt;</div>
                      <div className="e-subject">Bien reçu : votre demande de campagne</div>
                      <div className="e-body">
                        Bonjour {nomContact}, nous avons bien reçu votre demande pour {nomEntreprise}.
                        Notre équipe étudie la composition proposée et revient vers vous avec une
                        convention et un lien de paiement.
                      </div>
                    </div>
                    <div className="email-sim">
                      <div className="e-meta">À : MB Média · de : MB Média Ads</div>
                      <div className="e-subject">Nouvelle demande de partenariat — {nomEntreprise}</div>
                      <div className="e-body">
                        {nomEntreprise} ({typeEntreprise}, {secteur}) vise un objectif{" "}
                        {OBJECTIF_LABEL[objectif].toLowerCase()}. Budget total estimé{" "}
                        {eur(reco.budgetTotal)}, commission {eur(reco.commission)}. À traiter dans l'espace admin.
                      </div>
                    </div>
                    <p className="muted" style={{ fontSize: 13, margin: "12px 0" }}>
                      Référence de la demande : <span className="mono">{sentId.slice(0, 8)}</span>
                    </p>
                    <Link className="btn btn-ghost btn-sm" href={`/resultat/${sentId}`}>
                      Voir ma demande <IconArrowRight />
                    </Link>
                  </>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={onEnvoyer} disabled={sending}>
                    {sending ? "Envoi…" : "Envoyer ma demande à MB Média"}
                    {!sending ? <IconSend /> : null}
                  </button>
                )}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </>
  );
}

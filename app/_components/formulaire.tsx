"use client";

import Link from "next/link";
import { type ComponentType, useEffect, useRef, useState } from "react";
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
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconEye,
  IconSend,
  IconShoppingBag,
  IconTarget,
  IconUserPlus,
  IconWallet,
} from "./icons";
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

  const [step, setStep] = useState<1 | 2>(1);
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

  function validateStep1(): Errors {
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
  function validateStep2(): Errors {
    const e: Errors = {};
    if (!nomEntreprise.trim()) e.nomEntreprise = "Requis";
    if (!nomContact.trim()) e.nomContact = "Requis";
    if (!secteur) e.secteur = "Choisissez un secteur";
    if (!typeEntreprise) e.typeEntreprise = "Choisissez un type";
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

  function onContinuer() {
    const e = validateStep1();
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(2);
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e1 = validateStep1();
    const e2 = validateStep2();
    setErrors({ ...e1, ...e2 });
    if (Object.keys(e1).length > 0) {
      setStep(1);
      return;
    }
    if (Object.keys(e2).length > 0) return;
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

  function modifier() {
    setReco(null);
    setSentId(null);
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
          <ol className="stepper" aria-label="Étapes de la demande">
            <li className={step === 1 ? "is-active" : "is-done"}>
              <span className="step-num" aria-hidden>
                {step > 1 ? <IconCheck /> : "1"}
              </span>
              <span className="step-label">Votre projet</span>
            </li>
            <li className={step === 2 ? "is-active" : ""}>
              <span className="step-num" aria-hidden>
                2
              </span>
              <span className="step-label">Vos coordonnées</span>
            </li>
          </ol>

          {step === 1 ? (
            <>
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

              <button type="button" className="btn btn-primary btn-block" onClick={onContinuer}>
                Continuer <IconArrowRight />
              </button>
            </>
          ) : (
            <>
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

              <div className="form-nav">
                <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>
                  <IconArrowLeft /> Précédent
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  Voir la campagne idéale <IconArrowRight />
                </button>
              </div>
            </>
          )}
          {submitError ? <p className="field-error" style={{ marginTop: 12 }}>{submitError}</p> : null}
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
              <div className="section-gap">
                {sentId ? (
                  <>
                    <div className="notice notice-accent" style={{ marginBottom: 16 }}>
                      <IconCheck />
                      <span>Demande envoyée (simulation). MB Média revient vers vous après étude.</span>
                    </div>
                    <div className="email-sim">
                      <div className="e-meta">À : {nomContact} · de : MB Média &lt;contact@mbmedia.fr&gt;</div>
                      <div className="e-subject">Bien reçu : votre demande de campagne</div>
                      <div className="e-body">
                        Bonjour {nomContact}, nous avons bien reçu votre demande pour {nomEntreprise}. Notre équipe étudie la
                        composition proposée et revient vers vous avec une convention et un lien de paiement.
                      </div>
                    </div>
                    <div className="email-sim">
                      <div className="e-meta">À : MB Média · de : MB Média Ads</div>
                      <div className="e-subject">Nouvelle demande de partenariat : {nomEntreprise}</div>
                      <div className="e-body">
                        {nomEntreprise} ({typeEntreprise}, {secteur}) vise un objectif {OBJECTIF_LABEL[objectif].toLowerCase()}.
                        Budget total estimé {eur(reco.budgetTotal)}, commission {eur(reco.commission)}. À traiter dans l'espace
                        admin.
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

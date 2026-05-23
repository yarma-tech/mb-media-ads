"use client";

import Link from "next/link";
import { useState } from "react";
import { eur } from "@/lib/format";
import type { PaiementPayload } from "@/lib/types";
import { creerDemandeExpert, payer } from "../actions";
import { IconArrowRight, IconCheck, IconSend } from "./icons";

// Deux voies de sortie communes aux modes manuel et auto : payer (Stripe) ou
// parler à un expert (pipeline admin).
export function ResultatCta({ payload, budgetTotal }: { payload: PaiementPayload; budgetTotal: number }) {
  const [paying, setPaying] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onPayer() {
    setPaying(true);
    setError("");
    try {
      const r = await payer(payload);
      if ("url" in r) {
        window.location.href = r.url;
        return; // redirection vers Stripe en cours
      }
      setError(r.error);
    } catch {
      setError("Le paiement a échoué. Réessayez.");
    }
    setPaying(false);
  }

  async function onExpert() {
    setSending(true);
    setError("");
    try {
      const { id } = await creerDemandeExpert(payload);
      setSentId(id);
    } catch {
      setError("L'envoi a échoué. Réessayez.");
    } finally {
      setSending(false);
    }
  }

  if (sentId) {
    return (
      <div className="section-gap">
        <div className="notice notice-accent" style={{ marginBottom: 16 }}>
          <IconCheck />
          <span>Demande envoyée. Un expert MB Média revient vers vous après étude.</span>
        </div>
        <p className="muted" style={{ fontSize: 13, margin: "12px 0" }}>
          Référence : <span className="mono">{sentId.slice(0, 8)}</span>
        </p>
        <Link className="btn btn-ghost btn-sm" href={`/resultat/${sentId}`}>
          Voir ma demande <IconArrowRight />
        </Link>
      </div>
    );
  }

  return (
    <div className="section-gap">
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={onPayer} disabled={paying || sending}>
          {paying ? "Redirection…" : `Payer ${eur(budgetTotal)}`}
          {!paying ? <IconArrowRight /> : null}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onExpert} disabled={paying || sending}>
          {sending ? "Envoi…" : "Parler à un expert"}
          {!sending ? <IconSend /> : null}
        </button>
      </div>
      {error ? (
        <p className="field-error" style={{ marginTop: 12 }}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

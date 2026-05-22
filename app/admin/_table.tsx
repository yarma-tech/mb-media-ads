"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { OBJECTIF_LABEL } from "@/lib/enums";
import { eur, num } from "@/lib/format";
import type { Demande, DemandeInput } from "@/lib/types";
import { changerEtat } from "../actions";
import { EtatBadge } from "../_components/etat-badge";
import { IconArrowRight, IconCheck, IconCross, IconDoc } from "../_components/icons";

function contrainte(input: DemandeInput): string {
  if (input.mode === "budget") return `Budget ${eur(input.budget ?? 0)}`;
  const unite = input.objectifPrincipal === "notoriete" ? "K couv." : input.objectifPrincipal === "lead" ? "leads" : "ventes";
  return `Objectif ${num(input.objectifValeur ?? 0)} ${unite}`;
}

function niveauLead(score: number): string {
  if (score < 0.4) return "faible";
  if (score < 0.6) return "moyen";
  return "élevé";
}

const HEAD = (
  <thead>
    <tr>
      <th>Partenaire</th>
      <th>Objectif</th>
      <th>Contrainte</th>
      <th>Lead-score</th>
      <th>État</th>
      <th style={{ textAlign: "right" }}>Action</th>
    </tr>
  </thead>
);

export function AdminTable({ demandes }: { demandes: Demande[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmRefus, setConfirmRefus] = useState<string | null>(null);

  function act(id: string, etat: Parameters<typeof changerEtat>[1]) {
    setConfirmRefus(null);
    startTransition(async () => {
      await changerEtat(id, etat);
      router.refresh();
    });
  }

  const aTraiter = demandes.filter((d) => d.etat === "soumise").sort((a, b) => b.leadScore - a.leadScore);
  const traitees = demandes.filter((d) => d.etat !== "soumise");

  function row(d: Demande) {
    const score = Math.round(d.leadScore * 100);
    return (
      <tr key={d.id}>
        <td>
          <Link href={`/resultat/${d.id}`} style={{ fontWeight: 600 }}>
            {d.input.nomEntreprise}
          </Link>
          <div className="muted" style={{ fontSize: 12 }}>
            {d.input.nomContact} · {d.input.typeEntreprise} · {d.input.secteur}
          </div>
        </td>
        <td>{OBJECTIF_LABEL[d.input.objectifPrincipal]}</td>
        <td className="num">{contrainte(d.input)}</td>
        <td>
          <span className="score">
            <span className="score-track" role="img" aria-label={`Lead-score ${score} % (${niveauLead(d.leadScore)})`}>
              <span style={{ width: `${score}%` }} />
            </span>
            {score} % <span className="score-niveau">{niveauLead(d.leadScore)}</span>
          </span>
        </td>
        <td>
          <EtatBadge etat={d.etat} />
        </td>
        <td>
          <div className="actions-cell">
            {d.etat === "soumise" ? (
              confirmRefus === d.id ? (
                <>
                  <button className="btn btn-danger btn-sm" disabled={pending} onClick={() => act(d.id, "refusee")}>
                    Confirmer le refus
                  </button>
                  <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => setConfirmRefus(null)}>
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => act(d.id, "acceptee")}>
                    <IconCheck /> Accepter
                  </button>
                  <button className="btn btn-danger btn-sm" disabled={pending} onClick={() => setConfirmRefus(d.id)}>
                    <IconCross /> Refuser
                  </button>
                </>
              )
            ) : d.etat === "acceptee" ? (
              <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => act(d.id, "convention_envoyee")}>
                <IconDoc /> Envoyer convention
              </button>
            ) : d.etat === "convention_envoyee" ? (
              <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => act(d.id, "payee")}>
                <IconCheck /> Marquer payée
              </button>
            ) : (
              <Link href={`/resultat/${d.id}`} className="btn btn-ghost btn-sm">
                Détail <IconArrowRight />
              </Link>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <div aria-busy={pending}>
      {aTraiter.length > 0 ? (
        <section className="admin-section">
          <h2>
            À traiter <span className="count">({aTraiter.length})</span>
          </h2>
          <div className="table-wrap">
            <table>
              {HEAD}
              <tbody>{aTraiter.map(row)}</tbody>
            </table>
          </div>
        </section>
      ) : null}

      {traitees.length > 0 ? (
        <section className="admin-section">
          <h2>
            Traitées <span className="count">({traitees.length})</span>
          </h2>
          <div className="table-wrap">
            <table>
              {HEAD}
              <tbody>{traitees.map(row)}</tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

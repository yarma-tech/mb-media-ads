"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { OBJECTIF_LABEL } from "@/lib/enums";
import { eur, num } from "@/lib/format";
import type { Demande, DemandeInput } from "@/lib/types";
import { changerEtat } from "../actions";
import { EtatBadge } from "../_components/etat-badge";
import { IconArrowRight } from "../_components/icons";

function contrainte(input: DemandeInput): string {
  if (input.mode === "budget") return `Budget ${eur(input.budget ?? 0)}`;
  const unite = input.objectifPrincipal === "notoriete" ? "K couv." : input.objectifPrincipal === "lead" ? "leads" : "ventes";
  return `Objectif ${num(input.objectifValeur ?? 0)} ${unite}`;
}

export function AdminTable({ demandes }: { demandes: Demande[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(id: string, etat: Parameters<typeof changerEtat>[1]) {
    startTransition(async () => {
      await changerEtat(id, etat);
      router.refresh();
    });
  }

  return (
    <div className="table-wrap" aria-busy={pending}>
      <table>
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
        <tbody>
          {demandes.map((d) => {
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
                    <span className="score-track" role="img" aria-label={`Lead-score ${score} %`}>
                      <span style={{ width: `${score}%` }} />
                    </span>
                    {score} %
                  </span>
                </td>
                <td>
                  <EtatBadge etat={d.etat} />
                </td>
                <td>
                  <div className="actions-cell">
                    {d.etat === "soumise" ? (
                      <>
                        <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => act(d.id, "acceptee")}>
                          Accepter
                        </button>
                        <button className="btn btn-danger btn-sm" disabled={pending} onClick={() => act(d.id, "refusee")}>
                          Refuser
                        </button>
                      </>
                    ) : d.etat === "acceptee" ? (
                      <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => act(d.id, "convention_envoyee")}>
                        Envoyer convention
                      </button>
                    ) : d.etat === "convention_envoyee" ? (
                      <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => act(d.id, "payee")}>
                        Marquer payée
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
          })}
        </tbody>
      </table>
    </div>
  );
}

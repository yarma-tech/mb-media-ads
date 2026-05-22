import { notFound } from "next/navigation";
import { getDemande } from "@/lib/demandes";
import { OBJECTIF_LABEL } from "@/lib/enums";
import { eur, formatPeriode } from "@/lib/format";
import { EtatBadge } from "../../_components/etat-badge";
import { ResultatReco } from "../../_components/resultat-reco";

export const dynamic = "force-dynamic";

export default async function ResultatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demande = await getDemande(id);
  if (!demande) notFound();

  const { input, recommandation: reco, etat } = demande;
  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="eyebrow" style={{ margin: 0 }}>
          Demande {id.slice(0, 8)}
        </span>
        <EtatBadge etat={etat} />
      </div>
      <h1>Campagne idéale : {input.nomEntreprise}</h1>
      <p className="subtitle">
        {OBJECTIF_LABEL[input.objectifPrincipal]} ·{" "}
        {input.mode === "budget" ? `budget ${eur(input.budget ?? 0)}` : `objectif ${input.objectifValeur}`} ·{" "}
        {formatPeriode(input.dateDebut, input.dateFin)}
      </p>
      <ResultatReco reco={reco} />
    </>
  );
}

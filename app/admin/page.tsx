import { listDemandes } from "@/lib/demandes";
import { eur } from "@/lib/format";
import { AdminTable } from "./_table";

// État en mémoire / Supabase : toujours recalculer.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const demandes = await listDemandes();
  const aTraiter = demandes.filter((d) => d.etat === "soumise").length;
  const enCours = demandes.filter((d) => d.etat === "acceptee" || d.etat === "convention_envoyee").length;
  const payees = demandes.filter((d) => d.etat === "payee").length;
  const commission = demandes
    .filter((d) => d.etat !== "refusee")
    .reduce((s, d) => s + d.recommandation.commission, 0);

  return (
    <>
      <p className="eyebrow">Espace MB Média</p>
      <h1>Demandes de partenariat</h1>
      <p className="subtitle">File priorisée par lead-score. Acceptez, refusez, envoyez la convention.</p>
      {demandes.length > 0 ? (
        <>
          <div className="pipeline">
            <div className="pipeline-stat">
              <div className="ps-value accent">{aTraiter}</div>
              <div className="ps-label">À traiter</div>
            </div>
            <div className="pipeline-stat">
              <div className="ps-value">{enCours}</div>
              <div className="ps-label">En cours</div>
            </div>
            <div className="pipeline-stat">
              <div className="ps-value">{payees}</div>
              <div className="ps-label">Payées</div>
            </div>
            <div className="pipeline-stat">
              <div className="ps-value mono">{eur(commission)}</div>
              <div className="ps-label">Commission potentielle</div>
            </div>
          </div>
          <AdminTable demandes={demandes} />
        </>
      ) : (
        <div className="panel">
          <div className="empty">
            <h3>Aucune demande pour l'instant</h3>
            <p>Les demandes soumises via le formulaire partenaire apparaîtront ici.</p>
          </div>
        </div>
      )}
    </>
  );
}

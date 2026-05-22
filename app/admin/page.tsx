import { listDemandes } from "@/lib/demandes";
import { AdminTable } from "./_table";

// État en mémoire / Supabase : toujours recalculer.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const demandes = await listDemandes();
  return (
    <>
      <p className="eyebrow">Espace MB Média</p>
      <h1>Demandes de partenariat</h1>
      <p className="subtitle">
        Triées par lead-score (propension à convertir, prédite). Acceptez ou refusez, puis envoyez la
        convention et le lien de paiement.
      </p>
      {demandes.length > 0 ? (
        <AdminTable demandes={demandes} />
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

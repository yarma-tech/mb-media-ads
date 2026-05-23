import Link from "next/link";
import { IconCheck } from "../../_components/icons";

export const dynamic = "force-dynamic";

// Page de retour après un paiement Stripe réussi. La confirmation définitive (état
// "payee") est posée par le webhook, de façon asynchrone — on affiche un succès générique.
export default async function MerciPage({
  searchParams,
}: {
  searchParams: Promise<{ demande?: string }>;
}) {
  const sp = await searchParams;
  const ref = sp.demande?.slice(0, 8);
  return (
    <div className="auth">
      <p className="eyebrow">Paiement confirmé</p>
      <h1 className="auth-title">Merci !</h1>
      <p className="subtitle">
        Votre campagne est réservée. MB Média lance la production et vous tient informé par email.
      </p>
      <div className="panel">
        <div className="notice notice-accent" style={{ marginBottom: 16 }}>
          <IconCheck />
          <span>Paiement reçu. Votre campagne est confirmée.</span>
        </div>
        {ref ? (
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Référence : <span className="mono">{ref}</span>
          </p>
        ) : null}
        <Link className="btn btn-primary" href="/campagne">
          Lancer une autre campagne
        </Link>
      </div>
    </div>
  );
}

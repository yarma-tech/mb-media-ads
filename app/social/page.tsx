import Link from "next/link";
import { redirect } from "next/navigation";
import { listPlans } from "@/lib/social-ads/db";
import { PLAN_STATUT_LABEL } from "@/lib/social-ads/types";
import { supabaseConfigured } from "@/lib/supabase";
import { getUser } from "@/lib/supabase-server";
import { createPlanAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function SocialPlansPage() {
  if (!supabaseConfigured) {
    return (
      <>
        <h1>Social Ads</h1>
        <p className="subtitle">Configurez Supabase (URL + clé anon) pour activer ce module.</p>
      </>
    );
  }
  const user = await getUser();
  if (!user) redirect("/connexion?next=/social");

  const plans = await listPlans();

  return (
    <>
      <p className="eyebrow">Aperçu & validation · Social Ads</p>
      <h1>Vos plans d’annonces</h1>
      <p className="subtitle">
        Composez vos annonces social, partagez un lien, et laissez votre client valider et commenter.
      </p>

      <form action={createPlanAction} className="sap-newplan">
        <input name="nom" placeholder="Nom du plan (ex. Campagne Rentrée)" required />
        <input name="client_nom" placeholder="Client / marque (optionnel)" />
        <button type="submit" className="btn btn-primary">
          Créer un plan
        </button>
      </form>

      {plans.length === 0 ? (
        <p className="sap-empty-hint">Aucun plan pour le moment. Créez le premier ci-dessus.</p>
      ) : (
        <ul className="sap-planlist">
          {plans.map((p) => (
            <li key={p.id}>
              <Link href={`/social/${p.id}`} className="sap-plan-item">
                <div>
                  <strong>{p.nom}</strong>
                  {p.client_nom ? <span className="sap-sub"> · {p.client_nom}</span> : null}
                </div>
                <span className={`sap-statut sap-statut-${p.statut}`}>{PLAN_STATUT_LABEL[p.statut]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

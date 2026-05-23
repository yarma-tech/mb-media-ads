import Link from "next/link";
import { getUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUser();
  return (
    <>
      <p className="eyebrow">Agence média multi-média · MB Média</p>
      <h1>Votre campagne idéale, au meilleur tarif.</h1>
      <p className="subtitle">
        Définissez votre campagne, ou laissez notre moteur la composer selon votre budget. Tarif
        instantané, paiement en ligne.
      </p>
      <div className="row">
        {user ? (
          <Link href="/campagne" className="btn btn-primary">
            Lancer une campagne
          </Link>
        ) : (
          <>
            <Link href="/inscription" className="btn btn-primary">
              Créer un compte
            </Link>
            <Link href="/connexion" className="btn btn-ghost">
              Se connecter
            </Link>
          </>
        )}
      </div>
    </>
  );
}

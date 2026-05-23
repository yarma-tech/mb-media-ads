import { loadCatalogue } from "@/lib/catalog";
import { getProfile } from "@/lib/supabase-server";
import { CampagneFlow } from "./_flow";

export const dynamic = "force-dynamic";

// Accès protégé par le proxy (session requise). Step 0 : choix manuel / auto.
export default async function CampagnePage() {
  const [catalogue, profile] = await Promise.all([loadCatalogue(), getProfile()]);
  return (
    <>
      <p className="eyebrow">Nouvelle campagne</p>
      <h1>Votre campagne, votre tarif.</h1>
      <p className="subtitle">
        Définissez vous-même votre campagne et obtenez le tarif, ou laissez le moteur la composer
        selon votre budget.
      </p>
      <CampagneFlow catalogue={catalogue} nomEntreprise={profile?.nom_entreprise ?? "Votre campagne"} />
    </>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/supabase-server";
import { getBrandSettings } from "@/lib/social-ads/db";
import BrandSettingsForm from "../_components/BrandSettings";
export const dynamic = "force-dynamic";
export default async function BrandPage() {
  if (!(await getUser())) redirect("/connexion?next=/social/parametrage");
  return (
    <>
      <Link href="/social">← Plans d’annonces</Link>
      <h1>Paramétrage de la marque</h1>
      <p className="subtitle">
        Votre identité, appliquée aux nouvelles annonces.
      </p>
      <BrandSettingsForm initial={await getBrandSettings()} />
    </>
  );
}

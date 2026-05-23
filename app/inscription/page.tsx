import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import { SignUpForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function InscriptionPage() {
  if (await getUser()) redirect("/campagne");

  return (
    <div className="auth">
      <p className="eyebrow">Espace annonceur</p>
      <h1 className="auth-title">Créer un compte</h1>
      <p className="subtitle">Quelques infos sur votre entreprise, et lancez votre première campagne.</p>
      <SignUpForm />
    </div>
  );
}

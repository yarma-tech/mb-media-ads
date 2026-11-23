import { redirect } from "next/navigation";
import { getUser } from "@/lib/shared/supabase-server";
import { SignUpForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function InscriptionPage() {
  if (await getUser()) redirect("/social");

  return (
    <div className="auth">
      <p className="eyebrow">Espace annonceur</p>
      <h1 className="auth-title">Créer un compte</h1>
      <p className="subtitle">Quelques infos sur votre entreprise, et accédez à vos outils MB Média.</p>
      <SignUpForm />
    </div>
  );
}

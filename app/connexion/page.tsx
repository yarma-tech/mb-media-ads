import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase-server";
import { SignInForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/campagne";
  if (await getUser()) redirect(next.startsWith("/") ? next : "/campagne");

  return (
    <div className="auth">
      <p className="eyebrow">Espace annonceur</p>
      <h1 className="auth-title">Connexion</h1>
      <p className="subtitle">Accédez à vos campagnes MB Média.</p>
      <SignInForm next={next} />
    </div>
  );
}

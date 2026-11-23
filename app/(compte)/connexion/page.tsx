import { redirect } from "next/navigation";
import { getUser } from "@/lib/shared/supabase-server";
import { SignInForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/social";
  if (await getUser()) redirect(next.startsWith("/") ? next : "/social");

  return (
    <div className="auth">
      <p className="eyebrow">Espace annonceur</p>
      <h1 className="auth-title">Connexion</h1>
      <p className="subtitle">Accédez à vos outils MB Média.</p>
      <SignInForm next={next} />
    </div>
  );
}

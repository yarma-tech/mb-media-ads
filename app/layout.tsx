import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/lib/auth-actions";
import { getProfile, getUser } from "@/lib/supabase-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "MB Média Ads : la campagne idéale",
  description:
    "Plateforme d'agence média multi-média opérée par MB Média. Décrivez votre projet, obtenez la campagne idéale.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);

  return (
    <html lang="fr">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              MB Média<span> Ads</span>
            </Link>
            <nav className="topbar-nav">
              {user ? (
                <>
                  <Link href="/campagne">Lancer une campagne</Link>
                  {profile?.is_admin ? <Link href="/admin">Espace MB Média</Link> : null}
                  <form action={signOutAction}>
                    <button className="navlink" type="submit">
                      Se déconnecter
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/connexion">Se connecter</Link>
              )}
            </nav>
          </div>
        </header>
        <main className="page">{children}</main>
        <footer className="footer">
          Opéré par <strong>MB Média</strong>. Prototype : les valeurs affichées sont illustratives, jamais des garanties.
        </footer>
      </body>
    </html>
  );
}

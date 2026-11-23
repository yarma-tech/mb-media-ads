import type { Metadata } from "next";
import Link from "next/link";
import { signOutAction } from "@/lib/shared/auth-actions";
import { getUser } from "@/lib/shared/supabase-server";
import "./globals.css";

export const metadata: Metadata = {
  title: "MB Média",
  description:
    "Outils MB Média : Studio campagnes, Social Ads, Decks.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

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
                  <Link href="/social">Social Ads</Link>
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
          Opéré par <strong>MB Média</strong>.
        </footer>
      </body>
    </html>
  );
}

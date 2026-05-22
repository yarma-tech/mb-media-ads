import type { Metadata } from "next";
import Link from "next/link";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MB Média Ads : la campagne idéale",
  description:
    "Plateforme d'agence média multi-média opérée par MB Média. Décrivez votre projet, obtenez la campagne idéale.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={hanken.variable}>
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link href="/" className="brand">
              MB Média<span> Ads</span>
            </Link>
            <nav className="topbar-nav">
              <Link href="/">Demander une campagne</Link>
              <Link href="/admin">Espace MB Média</Link>
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

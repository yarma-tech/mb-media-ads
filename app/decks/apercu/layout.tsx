import { Rubik } from "next/font/google";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-deck",
});

export default function DeckLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={rubik.variable}>{children}</div>;
}

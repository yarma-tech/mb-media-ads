import DeckPreview from "../apercu/_components/DeckPreview";
import { Rubik } from "next/font/google";
const rubik = Rubik({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-deck",
});
export default function Page() {
  return (
    <div className={rubik.variable}>
      <DeckPreview />
    </div>
  );
}

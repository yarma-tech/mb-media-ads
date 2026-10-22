import type { Metadata } from "next";
import StudioShell from "./_components/StudioShell";
import { StudioProvider } from "./_components/StudioProvider";

export const metadata: Metadata = {
  title: "Campaign studio | MB Média",
  description:
    "Validation, campagnes on air et statistiques. Démonstration interactive.",
  robots: { index: false, follow: false },
};
export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudioProvider>
      <StudioShell>{children}</StudioShell>
    </StudioProvider>
  );
}

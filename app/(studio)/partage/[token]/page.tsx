import type { Metadata } from "next";
import PublicCampaign from "./PublicCampaign";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Présentation de campagne",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return <PublicCampaign token={(await params).token} />;
}

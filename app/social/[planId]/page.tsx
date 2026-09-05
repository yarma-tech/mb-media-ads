import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import PlanEditor from "@/app/social/_components/PlanEditor";
import { getPlanForOwner } from "@/lib/social-ads/db";
import { supabaseConfigured } from "@/lib/supabase";
import { getUser } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

async function baseUrlFromHeaders(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export default async function PlanEditorPage({ params }: { params: Promise<{ planId: string }> }) {
  if (!supabaseConfigured) redirect("/social");
  const user = await getUser();
  if (!user) redirect("/connexion");

  const { planId } = await params;
  const detail = await getPlanForOwner(planId);
  if (!detail) notFound();

  const baseUrl = await baseUrlFromHeaders();

  return (
    <>
      <p className="eyebrow">
        <Link href="/social">← Vos plans</Link>
      </p>
      <h1>{detail.plan.nom}</h1>
      {detail.plan.client_nom ? <p className="subtitle">Client : {detail.plan.client_nom}</p> : null}

      <PlanEditor
        plan={detail.plan}
        initialAds={detail.ads}
        initialToken={detail.share?.token ?? null}
        comments={detail.comments}
        approvals={detail.approvals}
        baseUrl={baseUrl}
      />
    </>
  );
}

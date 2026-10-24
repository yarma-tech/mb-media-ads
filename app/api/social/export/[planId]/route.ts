import { getPlanForOwner } from "@/lib/social-ads/db";
import { getUser } from "@/lib/supabase-server";
import { exportPlanText } from "@/lib/social-ads/export";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> },
) {
  if (!(await getUser()))
    return new Response("Authentification requise", { status: 401 });
  const { planId } = await params;
  const data = await getPlanForOwner(planId);
  if (!data) return new Response("Plan inaccessible", { status: 404 });
  const filename =
    data.plan.nom
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 80) || "annonces";
  return new Response(
    exportPlanText(data.plan, data.ads, data.approvals, new Date()),
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.txt"`,
        "Cache-Control": "private, no-store",
      },
    },
  );
}

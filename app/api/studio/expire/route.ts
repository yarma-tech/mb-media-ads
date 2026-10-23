import { expireCampaigns } from "@/lib/campaign-studio/workspace/server";
import { timingSafeEqual } from "node:crypto";
export async function POST(request: Request) {
  const actual = request.headers.get("authorization") ?? "",
    expected = "Bearer " + (process.env.STUDIO_CRON_SECRET ?? "");
  if (
    !process.env.STUDIO_CRON_SECRET ||
    actual.length !== expected.length ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))
  )
    return Response.json({ error: "Non autorisé" }, { status: 401 });
  await expireCampaigns();
  return Response.json({ ok: true });
}

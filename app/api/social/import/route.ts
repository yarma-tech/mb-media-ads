import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase-server";
import { parseCampaignWorkbook } from "@/lib/social-ads/import";
import { persistImportedPlan } from "@/lib/social-ads/db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!(await getUser()))
    return NextResponse.json(
      { error: "Authentification requise." },
      { status: 401 },
    );
  const form = await request.formData();
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    !/\.xlsx$/i.test(file.name) ||
    file.size > 10 * 1024 * 1024
  )
    return NextResponse.json(
      { error: "Classeur .xlsx requis, maximum 10 Mo." },
      { status: 400 },
    );
  try {
    const result = await parseCampaignWorkbook(
      new Uint8Array(await file.arrayBuffer()),
      file.name,
    );
    if (form.get("mode") !== "create") return NextResponse.json(result);
    if (!result.ads.length || result.ads.length > 500)
      return NextResponse.json(
        { error: "Import vide ou supérieur à 500 annonces.", ...result },
        { status: 422 },
      );
    const planId = await persistImportedPlan(result);
    if (!planId)
      return NextResponse.json(
        { error: "Import non enregistré. Vérifiez la migration et réessayez." },
        { status: 500 },
      );
    return NextResponse.json({ ...result, planId });
  } catch {
    return NextResponse.json(
      { error: "Classeur illisible ou endommagé." },
      { status: 400 },
    );
  }
}

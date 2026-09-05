import { NextResponse } from "next/server";
import { copyConfigured, genererCopy } from "@/lib/social-ads/copy";
import { FORMATS, PLATEFORMES, type Format, type Plateforme } from "@/lib/social-ads/types";
import { getUser } from "@/lib/supabase-server";

// Génération de copy marketing par LLM. Réservée aux partenaires connectés.
export async function POST(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  if (!copyConfigured()) {
    return NextResponse.json(
      { error: "Assistant IA non configuré (ANTHROPIC_API_KEY manquante)." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const plateforme = body.plateforme as Plateforme;
  const format = body.format as Format;
  if (!PLATEFORMES.includes(plateforme) || !FORMATS.includes(format)) {
    return NextResponse.json({ error: "Plateforme ou format invalide." }, { status: 400 });
  }
  const brief = String(body.brief ?? "").trim();
  if (!brief) return NextResponse.json({ error: "Brief requis." }, { status: 400 });

  try {
    const variations = await genererCopy({
      plateforme,
      format,
      objectif: String(body.objectif ?? "Notoriété"),
      brief,
      marque: body.marque ? String(body.marque) : undefined,
      ton: body.ton ? String(body.ton) : undefined,
      nbVariations: typeof body.nbVariations === "number" ? body.nbVariations : 3,
    });
    return NextResponse.json({ variations });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur de génération.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import {
  authenticate,
  state,
  StudioError,
} from "@/lib/campaign-studio/workspace/server";
export async function GET(request: Request) {
  try {
    return Response.json(await state(await authenticate(request)), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: e instanceof StudioError ? e.status : 500 },
    );
  }
}

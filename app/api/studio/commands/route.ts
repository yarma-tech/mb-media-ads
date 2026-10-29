import {
  authenticate,
  execute,
  StudioError,
} from "@/lib/campaign-studio/workspace/server";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length")) > 1000000)
      return Response.json(
        { error: "Requête trop volumineuse." },
        { status: 413 },
      );
    const origin = request.headers.get("origin");
    if (
      origin &&
      origin !== new URL(process.env.STUDIO_URL ?? request.url).origin
    )
      throw new StudioError("Origine interdite.", 403);
    const actor = await authenticate(request);
    return Response.json(await execute(await request.json(), actor), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Erreur serveur" },
      { status: e instanceof StudioError ? e.status : 400 },
    );
  }
}

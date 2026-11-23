import {
  publicPresentation,
  PUBLIC_HEADERS,
} from "@/lib/campaign-studio/workspace/share";
import { StudioError } from "@/lib/campaign-studio/workspace/server";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    return Response.json(await publicPresentation((await params).token), {
      headers: PUBLIC_HEADERS,
    });
  } catch (error) {
    return Response.json(
      { error: "Présentation indisponible. Ce lien a peut-être été révoqué." },
      {
        status: error instanceof StudioError ? error.status : 503,
        headers: PUBLIC_HEADERS,
      },
    );
  }
}

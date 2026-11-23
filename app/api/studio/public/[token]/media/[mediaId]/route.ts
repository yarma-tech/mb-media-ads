import {
  publicMedia,
  PUBLIC_HEADERS,
} from "@/lib/campaign-studio/workspace/share";
import { StudioError } from "@/lib/campaign-studio/workspace/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; mediaId: string }> },
) {
  try {
    const { token, mediaId } = await params;
    return await publicMedia(token, mediaId, request);
  } catch (error) {
    return new Response(null, {
      status: error instanceof StudioError ? error.status : 503,
      headers: PUBLIC_HEADERS,
    });
  }
}
export const HEAD = GET;

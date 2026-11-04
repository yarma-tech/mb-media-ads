import {
  publicLogo,
  PUBLIC_HEADERS,
} from "@/lib/campaign-studio/workspace/share";
import { StudioError } from "@/lib/campaign-studio/workspace/server";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string; brandId: string }> },
) {
  try {
    const { token, brandId } = await params;
    return await publicLogo(token, brandId);
  } catch (error) {
    return new Response(null, {
      status: error instanceof StudioError ? error.status : 503,
      headers: PUBLIC_HEADERS,
    });
  }
}

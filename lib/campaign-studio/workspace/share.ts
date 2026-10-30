import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { database, readCampaign, StudioError } from "./server";
import { currentAds } from "./presentation";
import type { Actor, Brand, Campaign } from "./types";
import type { PublicPresentation } from "./share-types";
export const PUBLIC_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
};
export const shareHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function changeShare(
  actor: Actor,
  campaignId: string,
  action: "create" | "revoke",
) {
  if (actor.kind !== "human" || actor.role !== "validator")
    throw new StudioError("Action réservée au Validateur humain.", 403);
  await readCampaign(campaignId);
  const db = database(),
    now = new Date().toISOString();
  if (action === "revoke") {
    const { error } = await db
      .from("studio_share_links")
      .update({ status: "revoked", revoked_at: now, revoked_by: actor.id })
      .eq("campaign_id", campaignId);
    if (error) throw error;
    return { revoked: true };
  }
  const token = randomBytes(32).toString("base64url");
  const { error } = await db.from("studio_share_links").upsert(
    {
      campaign_id: campaignId,
      token_hash: shareHash(token),
      status: "active",
      created_by: actor.id,
      created_at: now,
      revoked_at: null,
      revoked_by: null,
    },
    { onConflict: "campaign_id" },
  );
  if (error) throw error;
  return { sharePath: `/partage/${token}` };
}
export async function sharedCampaign(token: string): Promise<Campaign> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token))
    throw new StudioError("Lien indisponible.", 404);
  const { data, error } = await database()
    .from("studio_share_links")
    .select("campaign_id")
    .eq("token_hash", shareHash(token))
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new StudioError("Présentation indisponible.", 503);
  if (!data) throw new StudioError("Lien indisponible.", 404);
  return readCampaign(data.campaign_id);
}
function brandView(brand: Brand): Brand {
  // External logos are not proxied: only HTTPS URLs are accepted, never storage signed URLs.
  const logo =
    /^https:\/\//.test(brand.logo) && !brand.logo.includes("/storage/v1/")
      ? brand.logo
      : "";
  return { id: brand.id, name: brand.name, website: brand.website, logo };
}
export function presentationView(
  campaign: Campaign,
  brands: Brand[],
  token: string,
): PublicPresentation {
  const ads = currentAds(campaign).map((ad) => ({
    id: ad.id,
    channel: ad.channel,
    format: ad.format,
    copy: ad.copy,
    headline: ad.headline,
    headlines: ad.headlines,
    descriptions: ad.descriptions,
    cta: ad.cta,
    url: ad.url,
    mediaId: ad.mediaId,
    path1: ad.path1,
    path2: ad.path2,
    theme: ad.theme,
    ...(ad.brandSnapshot ? { brandSnapshot: brandView(ad.brandSnapshot) } : {}),
  }));
  const media = campaign.media
    .filter((m) => m.state === "ready" && ads.some((a) => a.mediaId === m.id))
    .map(({ id, name, state, mime, width, height, duration }) => ({
      id,
      name,
      state,
      mime,
      width,
      height,
      duration,
    }));
  return {
    campaign: {
      name: campaign.name,
      brandId: campaign.brandId,
      defaultUrl: campaign.defaultUrl,
      ads,
      media,
    },
    brands: brands.filter((b) => b.id === campaign.brandId).map(brandView),
    thumbnailUrls: Object.fromEntries(
      campaign.media
        .filter(
          (m) =>
            m.thumbnailPath && media.some((visible) => visible.id === m.id),
        )
        .map((m) => [
          m.id,
          `/api/studio/public/${token}/media/${m.id}?thumbnail=1`,
        ]),
    ),
    mediaUrls: Object.fromEntries(
      media.map((m) => [m.id, `/api/studio/public/${token}/media/${m.id}`]),
    ),
  };
}
export async function publicPresentation(token: string) {
  const campaign = await sharedCampaign(token);
  const { data, error } = campaign.brandId
    ? await database()
        .from("studio_brands")
        .select("id,name,logo,website")
        .eq("id", campaign.brandId)
    : { data: [], error: null };
  if (error) throw error;
  return presentationView(campaign, data ?? [], token);
}
export async function publicMedia(
  token: string,
  mediaId: string,
  request: Request,
) {
  const campaign = await sharedCampaign(token);
  const media = campaign.media.find(
    (m) => m.id === mediaId && m.state === "ready",
  );
  if (
    !media ||
    !currentAds(campaign).some((a) => a.mediaId === mediaId) ||
    !media.path.startsWith(`${campaign.id}/`) ||
    media.path.split("/").some((p) => p === ".." || p === ".")
  )
    throw new StudioError("Média indisponible.", 404);
  const thumbnail = new URL(request.url).searchParams.get("thumbnail") === "1";
  const path = thumbnail ? media.thumbnailPath : media.path;
  if (
    !path ||
    !path.startsWith(`${campaign.id}/`) ||
    path.includes("\\") ||
    path.split("/").some((p) => !p || p === ".." || p === ".")
  )
    throw new StudioError("Média indisponible.", 404);
  const range = request.headers.get("range");
  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range))
    return new Response(null, { status: 416, headers: PUBLIC_HEADERS });
  const { data, error } = await database()
    .storage.from("studio-media")
    .createSignedUrl(path, 60);
  if (error || !data?.signedUrl)
    throw new StudioError("Média indisponible.", 503);
  const upstream = await fetch(data.signedUrl, {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    headers: range ? { Range: range } : {},
    cache: "no-store",
    redirect: "error",
    signal: request.signal,
  });
  if (![200, 206, 416].includes(upstream.status)) {
    await upstream.body?.cancel();
    throw new StudioError("Média indisponible.", 503);
  }
  const headers = new Headers(PUBLIC_HEADERS);
  for (const name of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (
    thumbnail &&
    upstream.status !== 416 &&
    !/^image\/jpeg(;|$)/i.test(headers.get("content-type") ?? "")
  ) {
    await upstream.body?.cancel();
    throw new StudioError("Miniature indisponible.", 415);
  }
  // Never render an uploaded active document under the app origin.
  if (
    upstream.status !== 416 &&
    !/^(image\/(png|jpeg|webp|gif|avif)|video\/(mp4|webm|quicktime))(;|$)/i.test(
      headers.get("content-type") ?? "",
    )
  ) {
    await upstream.body?.cancel();
    throw new StudioError("Type de média non pris en charge.", 415);
  }
  return new Response(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}

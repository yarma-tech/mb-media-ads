// The free hosted recipe is capped at 50 Mo. Local/paid environments keep 200 Mo.
export const MEDIA_LIMIT_MB =
  process.env.NEXT_PUBLIC_STUDIO_UPLOAD_LIMIT_MB === "50" ? 50 : 200;
export const MEDIA_LIMIT_BYTES = MEDIA_LIMIT_MB * 1_000_000;

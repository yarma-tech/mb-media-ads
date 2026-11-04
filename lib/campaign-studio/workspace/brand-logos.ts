import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import type { Brand, Campaign } from "./types";

export const storedLogo = (value: string) =>
  /^brand-logos\/[0-9a-f-]{36}\.png$/.test(value);
export async function logoImage(value: string): Promise<Buffer> {
  if (
    !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(value) ||
    value.length > 750000
  )
    throw new Error("Logo invalide. Importez une image de nouveau.");
  try {
    return await sharp(Buffer.from(value.split(",")[1], "base64"), {
      limitInputPixels: 512 * 512,
    })
      .resize({
        width: 512,
        height: 512,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
  } catch {
    throw new Error("Logo invalide. Importez une image de nouveau.");
  }
}
export async function brandViews(
  db: SupabaseClient,
  brands: Brand[],
): Promise<Brand[]> {
  const paths = [
    ...new Set(brands.filter((b) => storedLogo(b.logo)).map((b) => b.logo)),
  ];
  if (!paths.length) return brands;
  const { data, error } = await db.storage
    .from("studio-media")
    .createSignedUrls(paths, 3600);
  if (error) throw error;
  const urls = new Map(data?.map((item) => [item.path, item.signedUrl]));
  return brands.map((b) =>
    storedLogo(b.logo) ? { ...b, logo: urls.get(b.logo) || "" } : b,
  );
}
export async function campaignLogoView(
  db: SupabaseClient,
  campaign: Campaign,
): Promise<Campaign> {
  const brands = campaign.ads.flatMap((a) =>
    a.brandSnapshot ? [a.brandSnapshot] : [],
  );
  if (!brands.some((b) => storedLogo(b.logo))) return campaign;
  const views = await brandViews(db, brands);
  const resolved = new Map(brands.map((brand, i) => [brand, views[i]]));
  return {
    ...campaign,
    ads: campaign.ads.map((a) =>
      a.brandSnapshot
        ? { ...a, brandSnapshot: resolved.get(a.brandSnapshot)! }
        : a,
    ),
  };
}

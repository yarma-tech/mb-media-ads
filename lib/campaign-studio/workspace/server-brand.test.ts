import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  signed: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({ insert: mocks.insert }),
    storage: {
      from: () => ({
        upload: mocks.upload,
        remove: mocks.remove,
        createSignedUrls: mocks.signed,
      }),
    },
  }),
}));
import { execute } from "./server";
const actor = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Créateur",
  kind: "human",
  role: "preparer",
} as const;
const command = { type: "create_brand", name: "Marque", logo: "", website: "" };
beforeEach(() => {
  vi.stubEnv("STUDIO_CONNECTED", "true");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://studio.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only");
  vi.clearAllMocks();
  mocks.insert.mockResolvedValue({ error: null });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.signed.mockImplementation(async (paths: string[]) => ({
    data: paths.map((path) => ({
      path,
      signedUrl: "https://studio.test/signed-logo.png",
    })),
    error: null,
  }));
});
afterEach(() => vi.unstubAllEnvs());
async function logoUpload() {
  return (
    "data:image/png;base64," +
    (
      await sharp({
        create: {
          width: 32,
          height: 16,
          channels: 4,
          background: { r: 0, g: 50, b: 20, alpha: 0.5 },
        },
      })
        .png()
        .toBuffer()
    ).toString("base64")
  );
}
describe("import du logo de marque", () => {
  it("stocke une image vérifiée, conserve son chemin et retourne un aperçu signé", async () => {
    const result = await execute(
      { ...command, logoUpload: await logoUpload() },
      actor,
    );
    const brand = mocks.insert.mock.calls[0][0];
    expect(brand.logo).toMatch(/^brand-logos\/[0-9a-f-]{36}\.png$/);
    expect(mocks.upload).toHaveBeenCalledWith(brand.logo, expect.any(Buffer), {
      contentType: "image/png",
      upsert: false,
    });
    expect((result as { brand: { logo: string } }).brand.logo).toBe(
      "https://studio.test/signed-logo.png",
    );
    const image = await sharp(mocks.upload.mock.calls[0][1]).metadata();
    expect(image).toMatchObject({
      format: "png",
      width: 32,
      height: 16,
      hasAlpha: true,
    });
  });
  it("refuse un faux fichier image avant tout stockage", async () => {
    await expect(
      execute(
        { ...command, logoUpload: "data:image/png;base64,aGVsbG8=" },
        actor,
      ),
    ).rejects.toThrow("Logo invalide");
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("retire le logo si la création de marque échoue", async () => {
    mocks.insert.mockResolvedValue({ error: new Error("insert failed") });
    await expect(
      execute({ ...command, logoUpload: await logoUpload() }, actor),
    ).rejects.toThrow("insert failed");
    expect(mocks.remove).toHaveBeenCalledWith([mocks.upload.mock.calls[0][0]]);
  });
  it("autorise toujours une marque sans logo", async () => {
    await execute(command, actor);
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ logo: "" }),
    );
  });
});

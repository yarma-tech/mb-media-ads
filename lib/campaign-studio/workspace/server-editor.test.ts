import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { createCampaign, addAd } from "./workflow";
import type { Actor, Campaign } from "./types";
const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => mocks }));
import { execute } from "./server";
const actor: Actor = {
  kind: "human",
  id: crypto.randomUUID(),
  name: "Préparateur",
  role: "preparer",
};
let campaign: Campaign, locked: boolean;
beforeEach(() => {
  vi.stubEnv("STUDIO_CONNECTED", "true");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://studio.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only");
  vi.clearAllMocks();
  locked = false;
  campaign = addAd(
    createCampaign("Recette", actor, new Date().toISOString()),
    "google",
    "search",
    actor,
    new Date().toISOString(),
  );
  mocks.from.mockImplementation((table: string) => {
    const query = {
      select: () => query,
      eq: () => query,
      in: () => query,
      gt: () => query,
      neq: () => query,
      single: async () => ({
        data: { document: structuredClone(campaign) },
        error: null,
      }),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({
          data:
            table === "studio_locks" && locked ? [{ owner_id: "other" }] : [],
          error: null,
        }).then(resolve),
    };
    return query;
  });
  mocks.rpc.mockImplementation(async (_name, args) => {
    if (args.p_revision !== campaign.revision)
      return { data: false, error: null };
    campaign = structuredClone(args.p_document);
    return { data: true, error: null };
  });
});
afterEach(() => vi.unstubAllEnvs());
it("suppression API refuse le verrou d’un autre éditeur sans commit", async () => {
  locked = true;
  await expect(
    execute(
      {
        type: "delete_ads",
        campaignId: campaign.id,
        revision: campaign.revision,
        adIds: [campaign.ads[0].id],
      },
      actor,
    ),
  ).rejects.toThrow("autre personne");
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(campaign.ads).toHaveLength(1);
});
it("suppression API protège les versions diffusées et applique le contrôle de révision", async () => {
  campaign.ads[0].status = "on_air";
  const cmd = {
    type: "delete_ads",
    campaignId: campaign.id,
    revision: campaign.revision,
    adIds: [campaign.ads[0].id],
  };
  await expect(execute(cmd, actor)).rejects.toThrow("historique");
  expect(mocks.rpc).not.toHaveBeenCalled();
  campaign.ads[0].status = "pending";
  await expect(execute({ ...cmd, revision: 0 }, actor)).rejects.toThrow(
    "autre personne",
  );
  await execute(cmd, actor);
  expect(campaign.ads).toHaveLength(0);
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
});
it("import API atomique : mauvais format refuse le fichier entier, bonne ligne crée un brouillon", async () => {
  const cmd = {
    type: "import_ads",
    campaignId: campaign.id,
    revision: campaign.revision,
    channel: "google",
    rows: [
      { format: "search", name: "Annonce une" },
      { format: "square", name: "Annonce deux" },
    ],
  };
  await expect(execute(cmd, actor)).rejects.toThrow("Format inconnu");
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(campaign.ads).toHaveLength(1);
  await execute({ ...cmd, rows: [cmd.rows[0]] }, actor);
  expect(campaign.ads).toHaveLength(2);
  expect(campaign.ads[1].status).toBe("draft");
});

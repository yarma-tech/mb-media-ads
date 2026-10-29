import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor, Campaign } from "./types";
import { createCampaign } from "./workflow";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  storageFrom: vi.fn(),
  remove: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: mocks.from,
    storage: { from: mocks.storageFrom },
    rpc: mocks.rpc,
  }),
}));
import { execute } from "./server";

const owner: Actor = {
  kind: "human",
  id: "01a15f9e-3dc8-7e91-a8f7-0e54f397a251",
  name: "Créateur",
  role: "preparer",
};
const validator: Actor = {
  ...owner,
  id: "01a15f9e-3dc8-7e91-a8f7-0e54f397a252",
  role: "validator",
};
let campaign: Campaign | null;
let deleteError: Error | null;
let conflict: boolean;
let deleted: boolean;
const now = "2026-10-29T12:00:00.000Z";
const command = () => ({
  type: "delete_campaign",
  campaignId: campaign!.id,
  revision: campaign!.revision,
  confirmationName: campaign!.name,
});

beforeEach(() => {
  vi.stubEnv("STUDIO_CONNECTED", "true");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://studio.test");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only");
  vi.clearAllMocks();
  campaign = createCampaign("Campagne à supprimer", owner, now);
  campaign.media = ["m1", "m2"].map((id) => ({
    id,
    path: `${campaign!.id}/${id}`,
    name: `${id}.png`,
    channel: "facebook",
    mime: "image/png",
    bytes: 5,
    width: 1080,
    height: 1080,
    duration: null,
    state: "ready",
    errors: [],
  }));
  deleteError = null;
  conflict = false;
  deleted = false;
  mocks.from.mockImplementation((table: string) => {
    if (table !== "studio_campaigns")
      throw new Error(`Unexpected table: ${table}`);
    let deleting = false;
    const filters = new Map<string, unknown>();
    const query = {
      select: vi.fn(() => query),
      delete: vi.fn(() => {
        deleting = true;
        return query;
      }),
      eq: vi.fn((field: string, value: unknown) => {
        filters.set(field, value);
        return query;
      }),
      maybeSingle: vi.fn(async () => {
        if (!deleting)
          return {
            data: campaign ? { document: structuredClone(campaign) } : null,
            error: null,
          };
        if (deleteError) return { data: null, error: deleteError };
        if (
          conflict ||
          !campaign ||
          filters.get("id") !== campaign.id ||
          filters.get("revision") !== campaign.revision
        )
          return { data: null, error: null };
        deleted = true;
        const document = structuredClone(campaign);
        campaign = null;
        return { data: { document }, error: null };
      }),
    };
    return query;
  });
  mocks.storageFrom.mockReturnValue({ remove: mocks.remove });
  mocks.remove.mockResolvedValue({ error: null });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("suppression des campagnes côté serveur", () => {
  it.each([owner, validator])(
    "autorise $role et nettoie seulement les médias après suppression DB",
    async (actor) => {
      const cmd = command();
      const paths = campaign!.media.map((m) => m.path);
      mocks.remove.mockImplementation(async () => {
        expect(deleted).toBe(true);
        return { error: null };
      });
      await expect(execute(cmd, actor)).resolves.toEqual({
        deletedCampaignId: cmd.campaignId,
      });
      expect(mocks.storageFrom).toHaveBeenCalledWith("studio-media");
      expect(mocks.remove).toHaveBeenCalledWith(paths);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it.each([
    { ...owner, id: validator.id },
    { ...owner, kind: "agent" as const, role: "preparer" as const },
  ])("refuse les acteurs non autorisés", async (actor) => {
    await expect(execute(command(), actor)).rejects.toMatchObject({
      status: 403,
    });
    expect(deleted).toBe(false);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("refuse un nom différent et une confirmation périmée sans toucher aux médias", async () => {
    await expect(
      execute({ ...command(), confirmationName: "Autre campagne" }, owner),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      execute({ ...command(), revision: 99 }, owner),
    ).rejects.toMatchObject({ status: 409 });
    expect(deleted).toBe(false);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("protège aussi la concurrence après lecture, avec CAS au DELETE", async () => {
    conflict = true;
    await expect(execute(command(), owner)).rejects.toMatchObject({
      status: 409,
    });
    expect(deleted).toBe(false);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("ne nettoie aucun fichier quand la suppression DB échoue", async () => {
    deleteError = new Error("Database unavailable");
    await expect(execute(command(), owner)).rejects.toThrow();
    expect(deleted).toBe(false);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("rend une répétition inoffensive quand la campagne n’existe plus", async () => {
    const cmd = command();
    await execute(cmd, owner);
    await expect(execute(cmd, owner)).resolves.toEqual({
      deletedCampaignId: cmd.campaignId,
    });
    expect(mocks.remove).toHaveBeenCalledTimes(1);
  });
  it("reprend le nettoyage Storage une fois sans répéter la suppression DB", async () => {
    const cmd = command();
    mocks.remove
      .mockResolvedValueOnce({ error: new Error("Temporary") })
      .mockResolvedValueOnce({ error: null });
    await expect(execute(cmd, owner)).resolves.toEqual({
      deletedCampaignId: cmd.campaignId,
    });
    expect(mocks.remove).toHaveBeenCalledTimes(2);
  });
  it("signale un nettoyage incomplet sans prétendre que la suppression a échoué", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const cmd = command();
    const paths = campaign!.media.map((m) => m.path);
    mocks.remove.mockRejectedValue(new Error("Storage unavailable"));
    await expect(execute(cmd, owner)).resolves.toMatchObject({
      deletedCampaignId: cmd.campaignId,
      warning: expect.stringContaining("médias"),
    });
    expect(deleted).toBe(true);
    expect(mocks.remove).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ campaignId: cmd.campaignId, paths }),
    );
  });
  it("ne supprime jamais un chemin extérieur à la campagne", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const ownPaths = campaign!.media.map((m) => m.path);
    for (const path of [
      "another-campaign/private-file",
      `${campaign!.id}/../foreign`,
      `${campaign!.id}//empty`,
      `${campaign!.id}/`,
    ])
      campaign!.media.push({ ...campaign!.media[0], id: "foreign", path });
    await execute(command(), owner);
    expect(mocks.remove).toHaveBeenCalledWith(ownPaths);
  });
  it("nettoie en lots de 1000 chemins maximum", async () => {
    campaign!.media = Array.from({ length: 1001 }, (_, i) => ({
      ...campaign!.media[0],
      id: String(i),
      path: `${campaign!.id}/${i}`,
    }));
    await execute(command(), owner);
    expect(mocks.remove.mock.calls.map((call) => call[0].length)).toEqual([
      1000, 1,
    ]);
  });
});

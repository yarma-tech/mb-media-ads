import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCampaign, addAd } from "./workflow";
import type { Actor, Campaign } from "./types";
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  read: vi.fn(),
  signed: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("./server", () => ({
  database: () => ({
    from: mocks.from,
    storage: { from: () => ({ createSignedUrl: mocks.signed }) },
  }),
  readCampaign: mocks.read,
  StudioError: class extends Error {
    constructor(
      message: string,
      public status = 400,
    ) {
      super(message);
    }
  },
}));
import {
  changeShare,
  publicMedia,
  presentationView,
  sharedCampaign,
  shareHash,
} from "./share";
const actor: Actor = {
  id: "00000000-0000-4000-8000-000000000001",
  kind: "human",
  role: "validator",
  name: "Validator",
};
const token = "a".repeat(43);
let campaign: Campaign;
let row: { campaign_id: string } | null;
let query: Record<string, ReturnType<typeof vi.fn>>;
beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  campaign = addAd(
    createCampaign("Leyon", actor, new Date().toISOString()),
    "facebook",
    "square",
    actor,
    new Date().toISOString(),
  );
  campaign.ads[0].comments = [
    { text: "Internal secret", author: "Manager", at: "today" },
  ];
  campaign.ads[0].mediaId = "media-1";
  campaign.media = [
    {
      id: "media-1",
      name: "Illustration",
      path: `${campaign.id}/media-1`,
      mime: "image/png",
      bytes: 200,
      width: 1080,
      height: 1080,
      duration: null,
      channel: "facebook",
      state: "ready",
      errors: [],
    },
  ];
  row = { campaign_id: campaign.id };
  query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => ({ data: row, error: null })),
    upsert: vi.fn(async () => ({ error: null })),
    update: vi.fn(() => query),
    then: vi.fn((resolve) => resolve({ error: null })),
  };
  mocks.from.mockReturnValue(query);
  mocks.read.mockImplementation(async () => campaign);
  mocks.signed.mockResolvedValue({
    data: { signedUrl: "https://storage.test/private?token=SECRET" },
    error: null,
  });
});
describe("public campaign sharing", () => {
  it.each([
    { ...actor, role: "preparer" } as Actor,
    { ...actor, kind: "agent", role: "preparer" } as Actor,
  ])("denies share administration to %j", async (identity) => {
    await expect(
      changeShare(identity, campaign.id, "create"),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      changeShare(identity, campaign.id, "revoke"),
    ).rejects.toMatchObject({ status: 403 });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("stores only a hash and returns a strong token once", async () => {
    const result = await changeShare(actor, campaign.id, "create");
    const raw = String(result.sharePath).split("/").pop()!;
    expect(raw).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const stored = query.upsert.mock.calls[0][0];
    expect(stored.token_hash).toBe(shareHash(raw));
    expect(JSON.stringify(stored)).not.toContain(raw);
  });
  it("revokes a capability and blocks all subsequent reads", async () => {
    await changeShare(actor, campaign.id, "revoke");
    expect(query.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "revoked", revoked_by: actor.id }),
    );
    row = null;
    await expect(sharedCampaign(token)).rejects.toMatchObject({ status: 404 });
    await expect(
      publicMedia(token, "media-1", new Request("https://studio.test")),
    ).rejects.toMatchObject({ status: 404 });
    expect(mocks.signed).not.toHaveBeenCalled();
  });
  it("rejects malformed tokens before database access", async () => {
    await expect(sharedCampaign("short")).rejects.toMatchObject({
      status: 404,
    });
    expect(mocks.from).not.toHaveBeenCalled();
  });
  it("whitelists public fields, excludes comments, paths and identities", () => {
    const result = presentationView(campaign, [], token),
      json = JSON.stringify(result);
    for (const secret of [
      "Internal secret",
      "createdBy",
      "revision",
      "history",
      "comments",
      campaign.media[0].path,
      actor.id,
    ])
      expect(json).not.toContain(secret);
    expect(result.mediaUrls["media-1"]).toBe(
      `/api/studio/public/${token}/media/media-1`,
    );
  });
  it("streams byte ranges without revealing the storage URL", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response("abc", {
          status: 206,
          headers: {
            "content-type": "video/mp4",
            "content-range": "bytes 0-2/10",
            "accept-ranges": "bytes",
            location: "https://storage.test/SECRET",
          },
        }),
      );
    vi.stubGlobal("fetch", fetch);
    const response = await publicMedia(
      token,
      "media-1",
      new Request("https://studio.test", { headers: { Range: "bytes=0-2" } }),
    );
    expect(response.status).toBe(206);
    expect(await response.text()).toBe("abc");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.has("location")).toBe(false);
    expect(fetch.mock.calls[0][1].headers.Range).toBe("bytes=0-2");
  });
  it("rejects unrelated media and unsafe ranges before storage signing", async () => {
    await expect(
      publicMedia(token, "foreign", new Request("https://studio.test")),
    ).rejects.toMatchObject({ status: 404 });
    const response = await publicMedia(
      token,
      "media-1",
      new Request("https://studio.test", {
        headers: { Range: "bytes=0-1,4-8" },
      }),
    );
    expect(response.status).toBe(416);
    expect(mocks.signed).not.toHaveBeenCalled();
  });
  it("refuses active content even if storage metadata is wrong", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("<script/>", {
            headers: { "content-type": "text/html" },
          }),
        ),
    );
    await expect(
      publicMedia(token, "media-1", new Request("https://studio.test")),
    ).rejects.toMatchObject({ status: 415 });
  });
  it("supports HEAD without forwarding a body", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(null, {
          headers: { "content-type": "image/png", "content-length": "100" },
        }),
      );
    vi.stubGlobal("fetch", fetch);
    const response = await publicMedia(
      token,
      "media-1",
      new Request("https://studio.test", { method: "HEAD" }),
    );
    expect(response.body).toBeNull();
    expect(fetch.mock.calls[0][1].method).toBe("HEAD");
  });
});

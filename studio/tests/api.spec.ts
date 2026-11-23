/* eslint-disable @typescript-eslint/no-explicit-any -- API response assertions exercise the runtime boundary. */
import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const api = process.env.STUDIO_TEST_BASE_URL ?? "http://127.0.0.1:3002";
test("autorisations serveur, verrou concurrent et MCP agent", async ({
  request,
}) => {
  const users = JSON.parse(await readFile(".env.studio-users.local", "utf8"));
  const tokens: Record<string, string> = {};
  for (const u of users) {
    const r = await request.post(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:55421"}/auth/v1/token?grant_type=password`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
        data: { email: u.email, password: u.password },
      },
    );
    expect(r.ok()).toBeTruthy();
    tokens[u.role] = (await r.json()).access_token;
  }
  const cmd = async (data: unknown, token = tokens.validator) =>
    request.post(api + "/api/studio/commands", {
      headers: { authorization: "Bearer " + token },
      data,
    });
  expect((await request.get(api + "/api/studio")).status()).toBe(401);
  let r = await cmd({ type: "create_campaign", name: "API recette" });
  expect(r.status()).toBe(200);
  let c = (await r.json()).campaign;
  r = await cmd({
    type: "add",
    campaignId: c.id,
    revision: c.revision,
    channel: "google",
    formats: ["search"],
  });
  c = (await r.json()).campaign;
  const ad = c.ads[0];
  for (const type of ["decide", "publish", "reopen"]) {
    r = await cmd(
      {
        type,
        campaignId: c.id,
        revision: c.revision,
        adId: ad.id,
        status: "approved",
        endDate: "2030-01-01",
      },
      tokens.preparer,
    );
    expect(r.status()).toBe(403);
  }
  const lock = crypto.randomUUID();
  r = await cmd({ type: "lock", campaignId: c.id, adId: ad.id, token: lock });
  expect(r.status()).toBe(200);
  r = await cmd(
    { type: "lock", campaignId: c.id, adId: ad.id, token: crypto.randomUUID() },
    tokens.preparer,
  );
  expect(r.status()).toBe(409);
  r = await cmd(
    {
      type: "edit",
      campaignId: c.id,
      revision: c.revision,
      adId: ad.id,
      fields: { copy: "forgé" },
      source: "configuration",
      lockToken: crypto.randomUUID(),
    },
    tokens.preparer,
  );
  expect(r.status()).toBe(409);
  r = await cmd({
    type: "edit",
    campaignId: c.id,
    revision: c.revision,
    adId: ad.id,
    fields: { copy: "Texte local" },
    source: "configuration",
    lockToken: lock,
  });
  expect(r.status()).toBe(200);
  const edited = (await r.json()).campaign;
  r = await cmd({
    type: "edit",
    campaignId: c.id,
    revision: c.revision,
    adId: ad.id,
    fields: { copy: "Écrasement périmé" },
    source: "configuration",
    lockToken: lock,
  });
  expect(r.status()).toBe(409);
  r = await cmd({ type: "agent", name: "Agent recette" });
  const token = (await r.json()).token;
  r = await cmd(
    {
      type: "decide",
      campaignId: c.id,
      revision: edited.revision,
      adId: ad.id,
      status: "approved",
    },
    token,
  );
  expect(r.status()).toBe(403);
  const mcp = await request.post(api + "/api/studio/mcp", {
    headers: { authorization: "Bearer " + token },
    data: {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "studio_prepare",
        arguments: {
          command: {
            type: "publish",
            campaignId: c.id,
            revision: edited.revision,
            adId: ad.id,
          },
        },
      },
    },
  });
  expect((await mcp.json()).result.isError).toBe(true);
});

test("batch partiel, demande de correction, V2 et fin automatique", async ({
  request,
}) => {
  const users = JSON.parse(await readFile(".env.studio-users.local", "utf8"));
  const login = await request.post(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:55421"}/auth/v1/token?grant_type=password`,
    {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      data: { email: users[0].email, password: users[0].password },
    },
  );
  const token = (await login.json()).access_token;
  let c: any;
  const call = async (command: Record<string, unknown>, status = 200) => {
    const r = await request.post(api + "/api/studio/commands", {
      headers: { authorization: "Bearer " + token },
      data: {
        ...(c ? { campaignId: c.id, revision: c.revision } : {}),
        ...command,
      },
    });
    expect(r.status(), await r.text()).toBe(status);
    const data = await r.json();
    if (data.campaign) c = data.campaign;
    return data;
  };
  const brand = (
    await call({
      type: "create_brand",
      name: "Recette API",
      logo: "",
      website: "https://example.com",
    })
  ).brand;
  await call({ type: "create_campaign", name: "API recette versions" });
  await call({
    type: "campaign",
    fields: { brandId: brand.id, defaultUrl: "https://example.com" },
  });
  await call({ type: "add", channel: "google", formats: ["search", "search"] });
  const [first, second] = c.ads;
  const lock = crypto.randomUUID();
  await call({ type: "lock", adId: first.id, token: lock });
  await call({
    type: "edit",
    adId: first.id,
    fields: { headlines: ["Titre conservé"] },
    source: "configuration",
    lockToken: lock,
  });
  await call({ type: "release", adId: first.id, token: lock });
  await call({
    type: "batch",
    adIds: [first.id, second.id],
    fields: {
      headlines: ["Titre 1", "Titre 2", "Titre 3"],
      descriptions: ["Description 1", "Description 2"],
    },
    replace: false,
  });
  expect(c.ads[0].headlines).toEqual(["Titre conservé"]);
  const submitted = await call({
    type: "submit",
    adIds: [first.id, second.id],
  });
  expect(submitted.skipped).toHaveLength(1);
  expect(c.ads[1].status).toBe("pending");
  await call({
    type: "decide",
    adId: second.id,
    status: "changes_requested",
    comment: "Préciser le message",
  });
  expect(c.ads[1].status).toBe("changes_requested");
  await call({ type: "submit", adIds: [second.id] });
  await call({ type: "decide", adId: second.id, status: "approved" });
  await call({ type: "publish", adId: second.id });
  await call(
    { type: "lock", adId: second.id, token: crypto.randomUUID() },
    400,
  );
  await call({ type: "version", adId: second.id });
  const v2 = c.ads.at(-1);
  expect(v2.version).toBe(2);
  expect(v2.status).toBe("draft");
  await call({ type: "submit", adIds: [v2.id] });
  await call({ type: "decide", adId: v2.id, status: "approved" });
  await call({ type: "publish", adId: v2.id });
  expect(c.ads.find((a: any) => a.id === second.id).stopReason).toBe(
    "replaced",
  );
  expect(c.ads.filter((a: any) => a.status === "on_air")).toHaveLength(1);
  await call({ type: "campaign", fields: { endDate: "2000-01-01" } });
  const r = await request.get(api + "/api/studio", {
    headers: { authorization: "Bearer " + token },
  });
  c = (await r.json()).campaigns.find((x: any) => x.id === c.id);
  expect(c.status).toBe("finished");
  expect(c.ads.find((a: any) => a.id === v2.id).stopReason).toBe(
    "campaign_finished",
  );
  await call({ type: "reopen", endDate: "2099-12-31" });
  expect(c.status).toBe("active");
  expect(c.ads.some((a: any) => a.status === "on_air")).toBe(false);
  await call({ type: "publish", adId: v2.id });
  expect(c.ads.find((a: any) => a.id === v2.id).status).toBe("on_air");
  await call(
    {
      type: "upload",
      channel: "youtube",
      name: "large.mp4",
      mime: "video/mp4",
      bytes: 200000001,
    },
    400,
  );
});

test("vérifier un média ne modifie pas une ligne verrouillée", async ({ request }) => {
  const users = JSON.parse(await readFile(".env.studio-users.local", "utf8"));
  const tokens: Record<string, string> = {};
  for (const u of users) {
    const r = await request.post(`${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:55421"}/auth/v1/token?grant_type=password`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      data: { email: u.email, password: u.password },
    });
    tokens[u.role] = (await r.json()).access_token;
  }
  const cmd = async (data: unknown, token = tokens.validator) => {
    const r = await request.post(api + "/api/studio/commands", { headers: { authorization: "Bearer " + token }, data });
    expect(r.status(), await r.text()).toBe(200);
    return r.json();
  };
  let { campaign: c } = await cmd({ type: "create_campaign", name: "Média verrouillé - recette" });
  ({ campaign: c } = await cmd({ type: "add", campaignId: c.id, revision: c.revision, channel: "facebook", formats: ["square"] }));
  const adId = c.ads[0].id;
  const lock = crypto.randomUUID();
  await cmd({ type: "lock", campaignId: c.id, adId, token: lock });
  const bytes = await readFile("public/deck-demo/cu-generique-square.jpg");
  const upload = await cmd({ type: "upload", campaignId: c.id, revision: c.revision, channel: "facebook", name: "photo.jpg", mime: "image/jpeg", bytes: bytes.length }, tokens.preparer);
  const stored = await request.put(upload.signedUrl, { headers: { "content-type": "image/jpeg" }, data: bytes });
  expect(stored.ok(), await stored.text()).toBeTruthy();
  ({ campaign: c } = await cmd({ type: "verify_media", campaignId: c.id, revision: upload.campaign.revision, mediaId: upload.media.id }, tokens.preparer));
  expect(c.media[0].state).toBe("ready");
  expect(c.ads[0].mediaId).toBeNull();
  await cmd({ type: "release", campaignId: c.id, adId, token: lock });
  const mcp = async (method: string, params = {}) => {
    const r = await request.post(api + "/api/studio/mcp", { headers: { authorization: "Bearer " + tokens.preparer }, data: { jsonrpc: "2.0", id: 1, method, params } });
    expect(r.status()).toBe(200);
    return (await r.json()).result;
  };
  expect((await mcp("initialize")).protocolVersion).toBe("2025-03-26");
  expect((await mcp("tools/list")).tools.map((t: any) => t.name)).toEqual(["studio_read", "studio_prepare"]);
});

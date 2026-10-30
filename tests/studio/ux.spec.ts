import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { createMediaAds } from "../../lib/campaign-studio/workspace/media-batch";
import { CATALOG, CHANNELS } from "../../lib/campaign-studio/workspace/catalog";
import {
  createCampaign,
  addAd,
  duplicateAd,
  moveAd,
  deleteAds,
  importAds,
  handleComment,
  editAd,
  newVersion,
  submitAds,
  decideAd,
} from "../../lib/campaign-studio/workspace/workflow";
import type {
  Actor,
  AdStatus,
} from "../../lib/campaign-studio/workspace/types";

test.use({ screenshot: "only-on-failure" });

const base = process.env.STUDIO_UX_BASE_URL ?? "http://127.0.0.1:3018";
const actor: Actor = {
  kind: "human",
  id: "11111111-1111-4111-8111-111111111111",
  name: "Validation test",
  role: "validator",
};
const now = new Date().toISOString();

async function fixture(
  page: Page,
  status: AdStatus = "pending",
  withMedia = false,
  strictLocks = false,
  beforeSignIn?: (page: Page) => Promise<void>,
  options: { role: "validator" | "preparer" } = { role: "preparer" },
) {
  const make = (name: string) => {
    let c = createCampaign(name, actor, now);
    c.brandId = "brand-test";
    c.defaultUrl = "https://example.test";
    c = addAd(c, "google", "search", actor, now);
    Object.assign(c.ads[0], {
      name: name + " annonce",
      status,
      headlines: ["Titre un", "Titre deux", "Titre trois"],
      descriptions: ["Description un", "Description deux"],
    });
    return c;
  };
  const campaigns = [make("Alpha"), make("Beta")];
  if (withMedia)
    campaigns[1].media.push({
      id: "ready-media",
      name: "test-ready.jpg",
      path: "test-ready.jpg",
      channel: "facebook",
      mime: "image/jpeg",
      bytes: 1000,
      width: 1080,
      height: 1080,
      duration: null,
      state: "ready",
      errors: [],
    });
  if (withMedia)
    Object.assign(campaigns[1].ads[0], {
      channel: "facebook",
      format: "square",
      mediaId: "ready-media",
    });
  let data = {
    actor: { ...actor, role: options.role } as Actor,
    brands: [
      {
        id: "brand-test",
        name: "Marque test",
        logo: "",
        website: "https://example.test",
      },
    ],
    campaigns,
    members: [],
    agents: [],
    locks: [],
    catalog: CATALOG,
    channels: CHANNELS,
    mediaUrls: {} as Record<string, string>,
    thumbnailUrls: {} as Record<string, string>,
  };
  let resumableLength = 0;
  let resumableOffset = 0;
  const commands: Record<string, unknown>[] = [];
  const leases = new Map<string, string>();
  const heldCommands = new Map<string, Promise<void>>();
  let delay = 0,
    fail = "",
    failMessage = "Conflit de test",
    uploads = 0;
  await page.route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    if (url.pathname.startsWith("/auth/v1/")) {
      const user = {
        id: actor.id,
        email: "audit@example.test",
        aud: "authenticated",
        role: "authenticated",
        app_metadata: {},
        user_metadata: {},
      };
      const token =
        "eyJhbGciOiJIUzI1NiJ9." +
        Buffer.from(
          JSON.stringify({
            sub: actor.id,
            exp: Math.floor(Date.now() / 1000) + 3600,
            role: "authenticated",
          }),
        ).toString("base64url") +
        ".test";
      return route.fulfill({
        json: url.pathname.endsWith("/user")
          ? user
          : {
              access_token: token,
              refresh_token: "test-only",
              token_type: "bearer",
              expires_in: 3600,
              user,
            },
      });
    }
    if (url.pathname === "/__ux-video.mp4") {
      const file = readFileSync("tests/studio/fixtures/video-640x360.mp4");
      const range = req.headers()["range"]?.match(/bytes=(\d+)-(\d*)/);
      const start = range ? Number(range[1]) : 0;
      const end = range?.[2]
        ? Math.min(Number(range[2]), file.length - 1)
        : file.length - 1;
      const body = file.subarray(start, end + 1);
      return route.fulfill({
        status: range ? 206 : 200,
        body,
        contentType: "video/mp4",
        headers: {
          "Accept-Ranges": "bytes",
          "Content-Length": String(body.length),
          ...(range
            ? { "Content-Range": `bytes ${start}-${end}/${file.length}` }
            : {}),
        },
      });
    }
    if (url.pathname.startsWith("/storage/v1/upload/resumable")) {
      const cors = {
        "Access-Control-Allow-Origin": base,
        "Access-Control-Allow-Methods": "POST,PATCH,HEAD,OPTIONS",
        "Access-Control-Allow-Headers":
          req.headers()["access-control-request-headers"] ??
          "authorization,apikey,x-signature,x-upsert,tus-resumable,upload-length,upload-metadata,upload-offset,content-type",
        "Access-Control-Expose-Headers": "Location,Upload-Offset,Tus-Resumable",
      };
      if (req.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers: cors });
      if (req.method() === "POST") {
        resumableLength = Number(req.headers()["upload-length"]);
        resumableOffset = 0;
        return route.fulfill({
          status: 201,
          headers: {
            ...cors,
            Location: url.origin + "/storage/v1/upload/resumable/test",
            "Tus-Resumable": "1.0.0",
            "Upload-Offset": "0",
          },
        });
      }
      // WebKit does not expose file-backed XHR bodies through postDataBuffer.
      // The fixture acknowledges the known length from the TUS creation request.
      if (req.method() === "PATCH")
        resumableOffset = Math.min(
          resumableLength,
          resumableOffset + (req.postDataBuffer()?.length ?? resumableLength),
        );
      return route.fulfill({
        status: 204,
        headers: {
          ...cors,
          "Tus-Resumable": "1.0.0",
          "Upload-Offset": String(resumableOffset),
        },
      });
    }
    if (url.pathname === "/api/studio") return route.fulfill({ json: data });
    if (url.pathname === "/api/studio/commands") {
      const cmd = req.postDataJSON();
      commands.push(cmd);
      if (delay) await new Promise((r) => setTimeout(r, delay));
      await heldCommands.get(cmd.type);
      if (fail === cmd.type)
        return route.fulfill({
          status: 409,
          json: { error: failMessage },
        });
      let c = data.campaigns.find((c) => c.id === cmd.campaignId);
      const result: Record<string, unknown> = {};
      if (cmd.type === "delete_campaign") {
        if (
          data.actor.kind !== "human" ||
          (data.actor.role !== "validator" && c?.createdBy !== data.actor.id)
        )
          return route.fulfill({
            status: 403,
            json: { error: "Suppression non autorisée." },
          });
        if (
          c &&
          (c.revision !== cmd.revision || c.name !== cmd.confirmationName)
        )
          return route.fulfill({
            status: 409,
            json: {
              error:
                "La campagne a changé. Fermez puis rouvrez la confirmation.",
            },
          });
        data.campaigns = data.campaigns.filter(
          (item) => item.id !== cmd.campaignId,
        );
        return route.fulfill({ json: { deletedCampaignId: cmd.campaignId } });
      }
      if (strictLocks && cmd.type === "lock") {
        const previous = leases.get(cmd.adId);
        if (previous && previous !== cmd.token)
          return route.fulfill({
            status: 409,
            json: { error: "Annonce ouverte dans un autre éditeur" },
          });
        leases.set(cmd.adId, cmd.token);
      }
      if (
        strictLocks &&
        cmd.type === "release" &&
        leases.get(cmd.adId) === cmd.token
      )
        leases.delete(cmd.adId);
      if (
        strictLocks &&
        cmd.type === "edit" &&
        leases.get(cmd.adId) !== cmd.lockToken
      )
        return route.fulfill({
          status: 409,
          json: { error: "Bail expiré ou autre éditeur" },
        });
      if (cmd.type === "batch" && c) {
        const skipped: string[] = [];
        for (const id of cmd.adIds) {
          const ad = c.ads.find((item) => item.id === id);
          if (!ad || ["approved", "on_air", "stopped"].includes(ad.status)) {
            skipped.push(id);
            continue;
          }
          const fields = Object.fromEntries(
            Object.entries(cmd.fields).filter(
              ([key]) =>
                cmd.replace ||
                !ad[key as keyof typeof ad] ||
                (Array.isArray(ad[key as keyof typeof ad]) &&
                  !(ad[key as keyof typeof ad] as unknown[]).length),
            ),
          );
          c = editAd(c, id, fields, actor, "configuration", now);
        }
        result.skipped = skipped;
      }
      if (cmd.type === "create_brand") {
        const brand = {
          id: "created-brand",
          name: cmd.name,
          logo: "",
          website: "",
        };
        data.brands = [...data.brands, brand];
        result.brand = brand;
      }
      if (cmd.type === "create_campaign") {
        c = createCampaign(cmd.name, actor, now);
        Object.assign(c, cmd.fields ?? {});
        data = { ...data, campaigns: [c, ...data.campaigns] };
      }
      if (c) {
        if (cmd.type === "campaign") Object.assign(c, cmd.fields);
        if (cmd.type === "upload") {
          const media = {
            id: "uploaded-media-" + ++uploads,
            name: cmd.name,
            path: "uploaded-media.jpg",
            channel: cmd.channel,
            ...(cmd.channels ? { channels: cmd.channels } : {}),
            mime: cmd.mime,
            bytes: cmd.bytes,
            width: 0,
            height: 0,
            duration: null,
            state: "uploading" as const,
            errors: [],
          };
          c.media.push(media);
          result.media = media;
          result.token = "test-upload-token";
        }
        if (cmd.type === "verify_media") {
          const media = c.media.find((m) => m.id === cmd.mediaId)!;
          const video = media.mime.startsWith("video/");
          Object.assign(media, {
            state: "ready",
            width: video ? 640 : 1080,
            height: video ? 360 : 1080,
          });
          data.mediaUrls[media.id] =
            base +
            (video ? "/__ux-video.mp4" : "/deck-demo/cu-generique-square.jpg");
          if (video)
            data.thumbnailUrls[media.id] =
              base + "/deck-demo/cu-generique-square.jpg";
        }
        if (cmd.type === "decide")
          c = decideAd(c, cmd.adId, cmd.status, data.actor, now, cmd.comment);
        if (cmd.type === "edit")
          c = editAd(
            c,
            cmd.adId,
            cmd.fields,
            actor,
            cmd.source ?? "configuration",
            now,
            cmd.unlocked,
          );
        if (cmd.type === "delete_ads")
          c = deleteAds(c, cmd.adIds, data.actor, now);
        if (cmd.type === "import_ads")
          c = importAds(c, cmd.channel, cmd.rows, data.actor, now);
        if (cmd.type === "move_ad")
          c = moveAd(c, cmd.adId, cmd.beforeId, actor, now);
        if (cmd.type === "handle_comment")
          c = handleComment(c, cmd.adId, cmd.commentIndex, actor, now);
        if (cmd.type === "add_media_batch") {
          const batch = createMediaAds(
            c,
            cmd.mediaIds,
            cmd.channels,
            actor,
            now,
          );
          c = batch.campaign;
          result.created = batch.created;
        }
        if (cmd.type === "add")
          for (const format of cmd.formats)
            c = addAd(c, cmd.channel, format, actor, now);
        if (cmd.type === "version") c = newVersion(c, cmd.adId, actor, now);
        if (cmd.type === "duplicate") c = duplicateAd(c, cmd.adId, actor, now);
        if (cmd.type === "submit") {
          const submission = submitAds(c, cmd.adIds, actor, now);
          c = submission.campaign;
          result.skipped = submission.skipped;
        }
        data = {
          ...data,
          campaigns: data.campaigns.map((old) => (old.id === c!.id ? c! : old)),
        };
        result.campaign = c;
      }
      return route.fulfill({ json: result });
    }
    if (url.origin === base) return route.continue();
    return route.abort();
  });
  await page.goto(base + "/studio");
  await beforeSignIn?.(page);
  await page.getByLabel("E-mail", { exact: true }).fill("audit@example.test");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("test-only-password");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Vos campagnes" }),
  ).toBeVisible();
  return {
    get campaigns() {
      return data.campaigns;
    },
    get brands() {
      return data.brands;
    },
    setActor: (value: Actor) => {
      data.actor = value;
    },
    snapshot: () => structuredClone(data),
    empty: () => {
      data.campaigns = [];
    },
    commands,
    expireLeases: () => leases.clear(),
    claimElsewhere: (adId: string) => leases.set(adId, "another-editor-token"),
    setThumbnailUrl: (id: string, url: string) => {
      data.thumbnailUrls[id] = url;
    },
    setMediaUrl: (id: string, url: string) => {
      data.mediaUrls[id] = url;
    },
    hold: (type: string) => {
      let release!: () => void;
      heldCommands.set(
        type,
        new Promise<void>((resolve) => {
          release = resolve;
        }),
      );
      return () => {
        heldCommands.delete(type);
        release();
      };
    },
    latency: (ms: number) => {
      delay = ms;
    },
    fail: (type: string, message = "Conflit de test") => {
      fail = type;
      failMessage = message;
    },
  };
}
async function validatorFixture(...args: Parameters<typeof fixture>) {
  const [page, status, withMedia, strictLocks, beforeSignIn] = args;
  return fixture(page, status, withMedia, strictLocks, beforeSignIn, {
    role: "validator",
  });
}
async function beginCampaign(page: Page, name: string) {
  await page
    .getByRole("link", { name: "Créer votre campagne", exact: true })
    .click();
  await page.getByLabel("Nom de campagne", { exact: true }).fill(name);
}
async function openPreview(page: Page, details = false) {
  const toggle = page.getByRole("button", { name: "Aperçu", exact: true });
  if ((await toggle.getAttribute("aria-pressed")) !== "true")
    await toggle.click();
  if (details) {
    const disclosure = page
      .locator("summary")
      .filter({ hasText: "Détails de l’annonce" });
    if (
      !(await disclosure.evaluate(
        (element) => (element.parentElement as HTMLDetailsElement).open,
      ))
    )
      await disclosure.click();
  }
}

async function openReviewOptions(page: Page) {
  const summary = page.getByLabel("Options d’affichage", { exact: true });
  if (
    !(await summary.evaluate(
      (el) => (el.parentElement as HTMLDetailsElement).open,
    ))
  )
    await summary.click();
}
async function openLibrary(page: Page, channelName = "Facebook") {
  const nav = page.getByRole("navigation", {
    name: "Canal de configuration",
    exact: true,
  });
  await expect(nav).toBeVisible();
  const tab = nav.getByRole("button", { name: new RegExp(channelName) });
  if (!(await tab.count())) {
    await page
      .getByRole("navigation", { name: "Étapes de configuration", exact: true })
      .getByRole("button", { name: "2 Canaux", exact: true })
      .click();
    const chooser = page.getByRole("group", {
      name: "Choisir les canaux",
      exact: true,
    });
    const channel = chooser.getByRole("button", {
      name: channelName,
      exact: true,
    });
    if ((await channel.getAttribute("aria-pressed")) !== "true")
      await channel.click();
    await page.getByRole("button", { name: "Continuer", exact: true }).click();
  }
  await tab.click();
  await expect(tab).toHaveAttribute("aria-pressed", "true");
  const summary = page
    .locator("summary")
    .filter({ hasText: "Bibliothèque des médias" });
  if (
    !(await summary.evaluate(
      (element) => (element.parentElement as HTMLDetailsElement).open,
    ))
  )
    await summary.click();
}

async function openEditor(page: Page, id: string) {
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(id);
  await expect(page.getByRole("article")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Modifier et valider", exact: true })
    .click();
  await expect(page.getByLabel("Titres · un par ligne")).toBeEditable();
  await page.screenshot({
    path: `/tmp/studio-d-20261029/modal-${page.viewportSize()?.width ?? 1440}.png`,
    fullPage: true,
  });
}

test("une correction survit à Échap, fermeture, clic extérieur et rechargement", async ({
  page,
}) => {
  const { campaigns } = await validatorFixture(page);
  await openEditor(page, campaigns[1].id);
  const field = page.getByLabel("Titres · un par ligne");
  const text = "Correction conservée\nTitre deux\nTitre trois";
  await field.fill(text);
  for (const close of [
    async () => page.keyboard.press("Escape"),
    async () =>
      page.getByRole("button", { name: "Fermer", exact: true }).click(),
    async () => page.mouse.click(4, 4),
  ]) {
    await close();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Modifier et valider", exact: true })
      .click();
    await expect(field).toHaveValue(text);
  }
  await page.keyboard.press("Escape");
  await page.reload();
  await page
    .getByRole("button", { name: "Modifier et valider", exact: true })
    .click();
  await expect(field).toHaveValue(text);
  await page.keyboard.press("Escape");
  await page.getByRole("link", { name: "On air", exact: true }).click();
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page
    .getByRole("button", { name: "Modifier et valider", exact: true })
    .click();
  await expect(field).toHaveValue(text);
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goForward();
  await page
    .getByRole("button", { name: "Modifier et valider", exact: true })
    .click();
  await expect(field).toHaveValue(text);
});

test("campagne, canal, filtres et recherche survivent aux transitions et reload", async ({
  page,
}) => {
  const { campaigns } = await fixture(page);
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await page.getByRole("button", { name: /Google SEM/ }).click();
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await expect(page.getByLabel("Filtrer par campagne")).toHaveValue(
    campaigns[1].id,
  );
  await page.getByRole("button", { name: "Validées", exact: true }).click();
  await openReviewOptions(page);
  await page.getByRole("button", { name: "Carrousel", exact: true }).click();
  await page.getByLabel("Rechercher une annonce").fill("Beta");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Validées", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await openReviewOptions(page);
  await expect(
    page.getByRole("button", { name: "Carrousel", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Rechercher une annonce")).toHaveValue("Beta");
  await page.getByRole("link", { name: "On air", exact: true }).click();
  await expect(page.getByLabel("Filtrer par campagne")).toHaveValue(
    campaigns[1].id,
  );
  await page.getByRole("link", { name: "Configuration", exact: true }).click();
  await expect(page.getByLabel("Campagne à configurer")).toHaveValue(
    campaigns[1].id,
  );
  await expect(
    page.getByRole("button", { name: /Google SEM/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(
    page.getByRole("button", { name: /Google SEM/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Campagne à configurer").selectOption(campaigns[0].id);
  await openPreview(page, true);
  await expect(page.getByLabel("Nom de l’annonce active")).toHaveValue(
    "Alpha annonce",
  );
  await openPreview(page, true);
  await expect(page.getByLabel("Nom de l’annonce active")).not.toHaveValue(
    "Beta annonce",
  );
});

test("double clic et Entrée répétés créent une seule campagne sous 800 ms", async ({
  page,
}) => {
  const f = await fixture(page);
  f.latency(800);
  await beginCampaign(page, "Campagne unique");
  const create = page.getByRole("button", {
    name: "Continuer",
    exact: true,
  });
  await create.dblclick();
  await page.keyboard.press("Enter");
  await expect(page.getByLabel("Campagne à configurer")).toBeVisible();
  expect(f.commands.filter((c) => c.type === "create_campaign")).toHaveLength(
    1,
  );
});

for (const width of [1440, 390, 320]) {
  test(`clavier et modale native à ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    const f = await validatorFixture(page);
    await openEditor(page, f.campaigns[1].id);
    const dialog = page.getByRole("dialog");
    const field = page.getByLabel("Titres · un par ligne");
    const trigger = page.getByRole("button", {
      name: "Modifier et valider",
      exact: true,
    });
    const prompts: string[] = [];
    page.on("dialog", async (d) => {
      prompts.push(d.type());
      await d.dismiss();
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(prompts).toEqual([]);
    await trigger.press("Enter");
    await expect(field).toBeEditable();
    await field.focus();
    await field.press("End");
    await field.press("Enter");
    await expect(field).toHaveValue(/\n/);
    expect(f.commands.filter((c) => c.type === "edit")).toHaveLength(0);
    for (const key of ["Tab", "Shift+Tab"]) {
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press(key);
        const focus = await dialog.evaluate((el) => ({
          inside: el.contains(document.activeElement),
          browserChrome: !document.hasFocus(),
          active: document.activeElement?.tagName,
        }));
        expect(focus.inside || focus.browserChrome, JSON.stringify(focus)).toBe(
          true,
        );
      }
    }
    const save = page.getByRole("button", {
      name: "Enregistrer et valider",
      exact: true,
    });
    await save.focus();
    const outline = await save.evaluate((el) => ({
      style: getComputedStyle(el).outlineStyle,
      width: getComputedStyle(el).outlineWidth,
    }));
    expect(outline.style).toBe("none");
    await page.screenshot({
      path: testInfo.outputPath(`modal-${width}.png`),
      fullPage: true,
    });
    f.latency(800);
    await save.press("Enter");
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", { name: "Enregistrement…", exact: true }),
    ).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveCount(0);
    expect(f.commands.filter((c) => c.type === "edit")).toHaveLength(1);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath(`validation-${width}.png`),
      fullPage: true,
    });
  });
}

test("contexte historique et campagne B ne réutilisent aucune ligne ni sélection A", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await page.getByRole("button", { name: /Google SEM/ }).click();
  await openPreview(page, true);
  await expect(page.getByLabel("Nom de l’annonce active")).toHaveValue(
    "Beta annonce",
  );
  await page.getByLabel("Sélectionner toutes les annonces du canal").check();
  await page
    .getByRole("button", { name: "Appliquer un champ en batch" })
    .click();
  await page.getByLabel("Valeur à appliquer").fill("Brouillon batch B");
  await page
    .getByLabel("Campagne à configurer")
    .selectOption(f.campaigns[0].id);
  await openPreview(page, true);
  await expect(page.getByLabel("Nom de l’annonce active")).toHaveValue(
    "Alpha annonce",
  );
  await expect(page.getByLabel("Valeur à appliquer")).toHaveCount(0);
  await expect(
    page.getByLabel("Sélectionner toutes les annonces du canal"),
  ).not.toBeChecked();
  await page.goBack();
  await expect(page.getByLabel("Campagne à configurer")).toHaveValue(
    f.campaigns[1].id,
  );
  await openPreview(page, true);
  await expect(page.getByLabel("Nom de l’annonce active")).toHaveValue(
    "Beta annonce",
  );
  await page.goForward();
  await openPreview(page, true);
  await expect(page.getByLabel("Nom de l’annonce active")).toHaveValue(
    "Alpha annonce",
  );
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption("all");
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.getByRole("link", { name: "On air", exact: true }).click();
  await expect(page.getByLabel("Filtrer par campagne")).toHaveValue("all");
  await page.goto(
    base + "/studio/configuration?campagne=ancienne-campagne-inconnue",
  );
  await expect(
    page.getByRole("heading", { name: "Vos campagnes", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Nom de l’annonce active")).toHaveCount(0);
});

test("échec de sauvegarde conserve correction, fermeture sûre si stockage indisponible", async ({
  page,
}) => {
  const f = await validatorFixture(page);
  await openEditor(page, f.campaigns[1].id);
  const field = page.getByLabel("Titres · un par ligne");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key.startsWith("studio:validation-draft:"))
        throw new Error("Storage disabled for test");
      original.call(this, key, value);
    };
  });
  await field.fill("Correction à garder\nTitre deux\nTitre trois");
  let prompts = 0;
  page.on("dialog", async (d) => {
    prompts++;
    await d.dismiss();
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(field).toHaveValue(
    "Correction à garder\nTitre deux\nTitre trois",
  );
  expect(prompts).toBe(1);
  f.fail("edit");
  await page
    .getByRole("button", { name: "Enregistrer et valider", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(field).toHaveValue(
    "Correction à garder\nTitre deux\nTitre trois",
  );
  await expect(
    page.getByRole("dialog").getByText("Conflit de test", { exact: true }),
  ).toBeVisible();
  f.fail("");
  await page
    .getByRole("button", { name: "Enregistrer et valider", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(f.commands.filter((c) => c.type === "edit")).toHaveLength(2);
});

test("formats et duplication ne se créent qu’une fois, nouvelle intention permise après succès", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await page.getByRole("button", { name: /Google SEM/ }).click();
  await page
    .getByRole("button", { name: "Ajouter des annonces", exact: true })
    .click();
  await page.getByLabel(/Annonce responsive Search/).check();
  f.latency(800);
  await page
    .getByRole("button", { name: "Confirmer et compléter les annonces" })
    .dblclick();
  await expect(
    page.getByRole("button", { name: "Confirmer et compléter les annonces" }),
  ).toBeVisible();
  await expect(page.getByRole("row")).toHaveCount(3);
  expect(f.commands.filter((c) => c.type === "add")).toHaveLength(1);
  await page
    .getByRole("button", { name: /^Dupliquer / })
    .first()
    .dblclick();
  await expect(page.getByRole("row")).toHaveCount(4);
  expect(f.commands.filter((c) => c.type === "duplicate")).toHaveLength(1);
  await page
    .getByRole("button", { name: /^Dupliquer / })
    .first()
    .click();
  await expect(page.getByRole("row")).toHaveCount(5);
  expect(f.commands.filter((c) => c.type === "duplicate")).toHaveLength(2);
});

test("double Entrée sous 2 s et échec de création permettent une reprise explicite", async ({
  page,
}) => {
  const f = await fixture(page);
  f.latency(2000);
  f.fail("create_campaign");
  await page
    .getByRole("link", { name: "Créer votre campagne", exact: true })
    .click();
  const name = page.getByLabel("Nom de campagne");
  await name.fill("Création clavier");
  await name.press("Enter");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Enregistrement…", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Continuer", exact: true }),
  ).toBeEnabled();
  expect(f.commands.filter((c) => c.type === "create_campaign")).toHaveLength(
    1,
  );
  f.fail("");
  await name.press("Enter");
  await expect(page.getByLabel("Campagne à configurer")).toBeVisible();
  expect(f.commands.filter((c) => c.type === "create_campaign")).toHaveLength(
    2,
  );
});

test("soumission avec sauvegarde préalable et demande de modification restent uniques", async ({
  page,
}) => {
  const f = await fixture(page, "draft");
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await page.getByRole("button", { name: /Google SEM/ }).click();
  const field = page.getByLabel("Titres · 30 caractères de Beta annonce");
  await expect(field).toBeEditable();
  f.latency(800);
  await field.fill("Titre corrigé\nTitre deux\nTitre trois");
  await page
    .getByRole("button", { name: "Envoyer Beta annonce", exact: true })
    .dblclick();
  await expect(
    page.getByRole("cell", { name: "À valider", exact: true }),
  ).toBeVisible();
  expect(f.commands.filter((c) => c.type === "submit")).toHaveLength(1);
  f.setActor(actor);
  await page.goto(base + `/studio/validation?campagne=${f.campaigns[1].id}`);
  await page
    .getByRole("button", { name: "Demander une modification", exact: true })
    .click();
  await page.getByLabel("Votre commentaire").fill("Merci de revoir ce texte.");
  await page
    .getByRole("button", { name: "Envoyer la demande", exact: true })
    .dblclick();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(f.commands.filter((c) => c.type === "decide")).toHaveLength(1);
});

test("nouvelle version protégée sous latence", async ({ page }) => {
  const f = await fixture(page, "on_air");
  await page.getByRole("link", { name: "On air", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(f.campaigns[1].id);
  await page
    .getByRole("button", { name: "Ouvrir Beta annonce · Beta", exact: true })
    .click();
  f.latency(800);
  await page
    .getByRole("button", { name: "Créer une nouvelle version", exact: true })
    .dblclick();
  await expect(
    page.getByRole("button", {
      name: "Créer une nouvelle version",
      exact: true,
    }),
  ).toBeEnabled();
  expect(f.commands.filter((c) => c.type === "version")).toHaveLength(1);
});

test("média prêt sans URL reste conforme pendant préparation de l’aperçu", async ({
  page,
}) => {
  await fixture(page, "pending", true);
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await openLibrary(page);
  const library = page.getByRole("region", {
    name: "Bibliothèque du canal",
    exact: true,
  });
  await expect(
    library.getByText("test-ready.jpg", { exact: true }),
  ).toBeVisible();
  await expect(library.getByText("Non conforme", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    library.getByText("Préparation de l’aperçu…", { exact: true }),
  ).toBeVisible();
  await expect(
    library.getByRole("checkbox", { name: "Fil carré", exact: true }),
  ).toBeEnabled();
  await openPreview(page);
  const preview = page.locator("aside").filter({
    has: page.getByRole("heading", { name: "Aperçu", exact: true }),
  });
  await expect(
    preview.getByText("Préparation de l’aperçu…", { exact: true }),
  ).toBeVisible();
  await expect(
    preview.getByText("Média à associer", { exact: true }),
  ).toHaveCount(0);
});

for (const kind of ["image", "video"] as const) {
  test(`100 % affiche vérification sans Pause, puis aperçu ${kind} chargé`, async ({
    page,
  }, testInfo) => {
    const f = await fixture(page);
    await page.getByRole("link").filter({ hasText: "Beta" }).click();
    await openLibrary(page, kind === "video" ? "YouTube" : "Facebook");
    const library = page.getByRole("region", {
      name: "Bibliothèque du canal",
      exact: true,
    });
    f.latency(800);
    await library
      .locator("input[type=file]")
      .setInputFiles(
        kind === "image"
          ? "public/deck-demo/cu-generique-square.jpg"
          : "tests/studio/fixtures/video-640x360.mp4",
      );
    await expect(
      library.getByText("Vérification du fichier…", { exact: true }),
    ).toBeVisible();
    expect(f.commands.find((c) => c.type === "upload")?.channel).toBe(
      kind === "video" ? "youtube" : "facebook",
    );
    await expect(
      library.getByRole("button", { name: "Pause", exact: true }),
    ).toHaveCount(0);
    const media = library.locator("img");
    await expect(media).toBeVisible();
    await expect
      .poll(() =>
        media.evaluate((el) =>
          el instanceof HTMLImageElement
            ? el.naturalWidth
            : (el as HTMLVideoElement).videoWidth,
        ),
      )
      .toBeGreaterThan(0);
    if (kind === "video") {
      await expect(library.locator("video")).toHaveCount(0);
      await library
        .getByRole("button", { name: "Lire video-640x360.mp4", exact: true })
        .click();
      await library.locator("video").evaluate((el) => {
        const v = el as HTMLVideoElement;
        v.muted = true;
        return v.play();
      });
      await expect
        .poll(() =>
          library
            .locator("video")
            .evaluate((el) => (el as HTMLVideoElement).currentTime),
        )
        .toBeGreaterThan(0);
    }
    await expect(
      library.getByText("Non conforme", { exact: true }),
    ).toHaveCount(0);
    await page.screenshot({
      path: testInfo.outputPath(`media-${kind}.png`),
      fullPage: true,
    });
  });
}

test("carrousel parcouru : reprendre sans modifier les statuts", async ({
  page,
}) => {
  const f = await validatorFixture(page);
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(f.campaigns[1].id);
  await expect(page.getByRole("article")).toHaveCount(1);
  await openReviewOptions(page);
  await page.getByRole("button", { name: "Carrousel", exact: true }).click();
  await page.getByRole("button", { name: "Suivante →", exact: true }).click();
  await expect(
    page.getByText(
      "Toutes les annonces de cette sélection ont été parcourues.",
    ),
  ).toBeVisible();
  const resume = page.getByRole("button", {
    name: "Revoir les annonces parcourues",
    exact: true,
  });
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(
    page.getByRole("group", { name: "Annonce courante", exact: true }),
  ).toBeFocused();
  expect(
    f.commands.filter((c) =>
      ["decide", "edit", "submit"].includes(String(c.type)),
    ),
  ).toHaveLength(0);
});

test("recherche vide : reprise en un clic et focus dans la recherche", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(f.campaigns[1].id);
  const search = page.getByLabel("Rechercher une annonce");
  await search.fill("introuvable-test");
  await expect(
    page.getByText("Aucune annonce pour cette recherche.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Effacer la recherche", exact: true })
    .click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue("");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.getByLabel("Filtrer par campagne")).toHaveValue(
    f.campaigns[1].id,
  );
});

test("configuration sans campagne : création directe au clavier", async ({
  page,
}) => {
  const f = await fixture(page);
  f.empty();
  await page.goto(base + "/studio/configuration");
  await expect(
    page.getByRole("link", { name: "Créer votre campagne", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Créer votre campagne", exact: true })
    .click();
  await expect(page.getByLabel("Nom de campagne")).toBeVisible();
  await page.getByLabel("Nom de campagne").fill("Première campagne");
  await page.getByLabel("Nom de campagne").press("Enter");
  await expect(page.getByLabel("Campagne à configurer")).toBeVisible();
  expect(f.commands.filter((c) => c.type === "create_campaign")).toHaveLength(
    1,
  );
});

for (const width of [390, 320]) {
  test(`canal actif visible après reload mobile ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width === 844 ? 390 : 844 });
    const f = await fixture(page);
    await page.goto(
      base +
        "/studio/configuration?campagne=" +
        f.campaigns[1].id +
        "&canal=google",
    );
    const google = page.getByRole("button", { name: /Google SEM/ });
    await expect(google).toHaveAttribute("aria-pressed", "true");
    await expect
      .poll(() =>
        google.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.left >= 0 && r.right <= innerWidth;
        }),
      )
      .toBe(true);
    await page.reload();
    await expect
      .poll(() =>
        google.evaluate((el) => {
          const r = el.getBoundingClientRect();
          return r.left >= 0 && r.right <= innerWidth;
        }),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("raccourci clavier Aller au contenu cible la zone de travail", async ({
  page,
}) => {
  await fixture(page);
  const skip = page.getByRole("link", {
    name: "Aller au contenu",
    exact: true,
  });
  await skip.focus();
  await skip.press("Enter");
  await expect(page.locator("#workspace-main")).toBeFocused();
});

test("reprendre au clavier ne valide jamais implicitement", async ({
  page,
}) => {
  const f = await validatorFixture(page);
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(f.campaigns[1].id);
  await expect(page.getByRole("article")).toHaveCount(1);
  await openReviewOptions(page);
  await page.getByRole("button", { name: "Carrousel", exact: true }).click();
  await page.getByRole("button", { name: "Suivante →", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Revoir les annonces parcourues",
      exact: true,
    })
    .press("Enter");
  const decision = page
    .waitForResponse(
      (r) =>
        r.url().endsWith("/api/studio/commands") &&
        r.request().postDataJSON()?.type === "decide",
      { timeout: 1000 },
    )
    .catch(() => null);
  await page.keyboard.press("Enter");
  expect(await decision).toBeNull();
  expect(f.commands.filter((c) => c.type === "decide")).toHaveLength(0);
});

test("marque neuve affectée directement à sa campagne", async ({ page }) => {
  const f = await fixture(page);
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await page
    .getByRole("navigation", { name: "Étapes de configuration", exact: true })
    .getByRole("button", { name: "1 Campagne", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Créer une marque", exact: true })
    .click();
  await page
    .getByLabel("Nom", { exact: true })
    .fill("Marque créée dans la campagne");
  await page
    .getByRole("button", { name: "Créer la marque", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Marque", exact: true }),
  ).toHaveValue("created-brand");
  expect(f.commands.filter((c) => c.type === "create_brand")).toHaveLength(1);
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect
    .poll(() => f.campaigns.find((c) => c.name === "Beta")?.brandId)
    .toBe("created-brand");
});

test("vérification média sans invitation à terminer ou revérifier le transfert actif", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await openLibrary(page);
  const library = page.getByRole("region", {
    name: "Bibliothèque du canal",
    exact: true,
  });
  const states: string[] = [];
  await page.exposeFunction("recordVerificationWindow", (value: string) =>
    states.push(value),
  );
  await library.evaluate((el) => {
    new MutationObserver(() => {
      const value = el.textContent ?? "";
      if (value.includes("Vérification du fichier…"))
        (
          window as unknown as { recordVerificationWindow: (s: string) => void }
        ).recordVerificationWindow(value);
    }).observe(el, { subtree: true, childList: true, characterData: true });
  });
  const release = f.hold("verify_media");
  try {
    await library
      .locator("input[type=file]")
      .setInputFiles("public/deck-demo/cu-generique-square.jpg");
    await expect
      .poll(() => f.commands.some((c) => c.type === "verify_media"))
      .toBe(true);
    await expect(
      library.getByText("Vérification du fichier…", { exact: true }).first(),
    ).toBeVisible();
    expect(
      await library.getByText("Transfert à terminer", { exact: true }).count(),
    ).toBe(0);
    expect(
      await library
        .getByRole("button", { name: "Vérifier le transfert", exact: true })
        .count(),
    ).toBe(0);
  } finally {
    release();
  }
  await expect(library.locator("img")).toBeVisible();
  expect(
    states.some(
      (s) =>
        s.includes("Transfert à terminer") ||
        s.includes("Vérifier le transfert"),
    ),
  ).toBe(false);
});

test("rechargement conserve le bail de son éditeur sans ouvrir un second éditeur", async ({
  page,
}) => {
  const f = await fixture(page, "pending", false, true);
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await page.getByRole("button", { name: /Google SEM/ }).click();
  const field = page.getByLabel("Titres · 30 caractères de Beta annonce");
  await expect(field).toBeEditable();
  await page.reload();
  await expect(field).toBeEditable();
  const tokens = f.commands
    .filter((c) => c.type === "lock")
    .map((c) => c.token);
  expect(tokens[0]).toBe(tokens.at(-1));
});

test("commentaire : focus initial, Entrée et Échap restent sûrs", async ({
  page,
}) => {
  const f = await validatorFixture(page);
  await openEditor(page, f.campaigns[1].id);
  await page.keyboard.press("Escape");
  const trigger = page.getByRole("button", {
    name: "Demander une modification",
    exact: true,
  });
  await trigger.click();
  const field = page.getByLabel("Votre commentaire");
  await expect(field).toBeFocused();
  await page.keyboard.type("Commentaire synthétique");
  await field.press("Enter");
  await expect(field).toHaveValue("Commentaire synthétique\n");
  expect(f.commands.filter((c) => c.type === "decide")).toHaveLength(0);
  page.once("dialog", (d) => d.dismiss());
  await field.press("Escape");
  await expect(field).toHaveValue("Commentaire synthétique\n");
  await field.fill("");
  await field.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

async function axeViolations(page: Page, rules: string[]) {
  await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
  return page.evaluate(async (rules) => {
    const axe = (
      window as unknown as {
        axe: {
          run: (options: unknown) => Promise<{
            violations: {
              id: string;
              nodes: { target: string[]; failureSummary: string }[];
            }[];
          }>;
        };
      }
    ).axe;
    return (await axe.run({ runOnly: { type: "rule", values: rules } }))
      .violations;
  }, rules);
}

test("connexion : contraste du bouton lisible", async ({ page }) => {
  await page.goto(base + "/studio");
  await expect(
    page.getByRole("button", { name: "Se connecter", exact: true }),
  ).toBeVisible();
  expect(await axeViolations(page, ["color-contrast"])).toEqual([]);
});

test("repères, titres et noms accessibles des principales vues", async ({
  page,
}) => {
  const f = await fixture(page);
  for (const route of [
    "",
    "/configuration",
    "/validation",
    "/on-air",
    "/terminees",
    "/statistiques",
  ]) {
    await page.goto(
      base +
        "/studio" +
        route +
        "?campagne=" +
        f.campaigns[1].id +
        "&canal=google",
    );
    await expect(page.locator("#workspace-main")).toBeVisible();
    expect(
      await axeViolations(page, [
        "landmark-main-is-top-level",
        "landmark-no-duplicate-main",
        "landmark-unique",
        "page-has-heading-one",
        "label-content-name-mismatch",
        "label",
        "button-name",
        "select-name",
      ]),
      route || "home",
    ).toEqual([]);
  }
});

test("erreur et chargement annoncés dans le dialogue de validation", async ({
  page,
}) => {
  const f = await validatorFixture(page);
  await openEditor(page, f.campaigns[1].id);
  const dialog = page.getByRole("dialog");
  await page
    .getByLabel("Titres · un par ligne")
    .fill("Titre corrigé\nTitre deux\nTitre trois");
  f.fail("edit");
  await page
    .getByRole("button", { name: "Enregistrer et valider", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("Conflit de test");
  f.fail("");
  const release = f.hold("edit");
  try {
    await page
      .getByRole("button", { name: "Enregistrer et valider", exact: true })
      .click();
    await expect(dialog.getByRole("status")).toContainText("Enregistrement");
  } finally {
    release();
  }
  await expect(dialog).toHaveCount(0);
});

test("erreur de commentaire annoncée sans perdre la saisie", async ({
  page,
}) => {
  const f = await validatorFixture(page);
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(f.campaigns[1].id);
  await expect(page.getByRole("article")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Demander une modification", exact: true })
    .click();
  await page
    .getByLabel("Votre commentaire")
    .fill("Commentaire conservé après erreur");
  f.fail("decide");
  await page
    .getByRole("button", { name: "Envoyer la demande", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Conflit de test",
  );
  await expect(page.getByLabel("Votre commentaire")).toHaveValue(
    "Commentaire conservé après erreur",
  );
});

for (const width of [390, 320]) {
  test(`champ tabulé entièrement visible à ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const f = await fixture(page);
    await page.goto(
      base +
        "/studio/configuration?campagne=" +
        f.campaigns[1].id +
        "&canal=google",
    );
    const field = page.getByLabel("Titres · 30 caractères de Beta annonce", {
      exact: true,
    });
    await expect(field).toBeEditable();
    await page
      .getByLabel("Thématique de Beta annonce", { exact: true })
      .focus();
    await page.keyboard.press("Tab");
    await expect(field).toBeFocused();
    await expect
      .poll(() =>
        field.evaluate((el) => {
          const r = el.getBoundingClientRect(),
            clip = el.closest("table")!.parentElement!.getBoundingClientRect();
          return (
            r.left >= clip.left &&
            r.right <= clip.right &&
            r.right <= innerWidth
          );
        }),
      )
      .toBe(true);
  });
}

test("canal actif reste visible lors du passage desktop vers mobile", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=google",
  );
  const channel = page.getByRole("button", { name: /Google SEM/ });
  await expect(channel).toHaveAttribute("aria-pressed", "true");
  await page.setViewportSize({ width: 320, height: 844 });
  await expect
    .poll(() =>
      channel.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth;
      }),
    )
    .toBe(true);
});

test("préparation du transfert sans bouton Pause trompeur", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await openLibrary(page);
  const library = page.getByRole("region", {
    name: "Bibliothèque du canal",
    exact: true,
  });
  const release = f.hold("upload");
  try {
    await library
      .locator("input[type=file]")
      .setInputFiles("public/deck-demo/cu-generique-square.jpg");
    await expect
      .poll(() => f.commands.some((c) => c.type === "upload"))
      .toBe(true);
    expect(
      await library.getByRole("button", { name: "Pause", exact: true }).count(),
    ).toBe(0);
    await expect(
      library.getByText("Préparation du transfert…", { exact: true }),
    ).toBeVisible();
  } finally {
    release();
  }
  await expect(library.locator("img")).toBeVisible();
});

test("vérification manuelle retire seulement l’erreur de ce transfert", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await openLibrary(page);
  const library = page.getByRole("region", {
    name: "Bibliothèque du canal",
    exact: true,
  });
  f.fail("verify_media", "Échec du transfert A");
  await library
    .locator("input[type=file]")
    .setInputFiles("public/deck-demo/cu-generique-square.jpg");
  await expect(library.getByRole("alert")).toContainText(
    "Échec du transfert A",
  );
  f.fail("");
  await library
    .getByRole("button", { name: "Vérifier le transfert", exact: true })
    .click();
  await expect(library.locator("img")).toBeVisible();
  await expect(library.getByRole("alert")).toHaveCount(0);
});

test("vérifier A ne masque pas l’erreur du transfert B", async ({ page }) => {
  const f = await fixture(page);
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await openLibrary(page);
  const library = page.getByRole("region", {
    name: "Bibliothèque du canal",
    exact: true,
  });
  f.fail("verify_media", "Échec du transfert A");
  await library.locator("input[type=file]").setInputFiles({
    name: "A.jpg",
    mimeType: "image/jpeg",
    buffer: readFileSync("public/deck-demo/cu-generique-square.jpg"),
  });
  await expect(library.getByRole("alert")).toContainText(
    "Échec du transfert A",
  );
  f.fail("verify_media", "Échec du transfert B");
  await library.locator("input[type=file]").setInputFiles({
    name: "B.jpg",
    mimeType: "image/jpeg",
    buffer: readFileSync("public/deck-demo/cu-generique-square.jpg"),
  });
  await expect(library.getByRole("alert")).toContainText(
    "Échec du transfert B",
  );
  f.fail("");
  await library
    .getByRole("article")
    .filter({ hasText: "A.jpg" })
    .getByRole("button", { name: "Vérifier le transfert", exact: true })
    .click();
  await expect(library.locator("img")).toBeVisible();
  await expect(library.getByRole("alert")).toContainText(
    "Échec du transfert B",
  );
});

test("carrousel : hiérarchie de titres continue", async ({ page }) => {
  const f = await validatorFixture(page);
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(f.campaigns[1].id);
  await expect(page.getByRole("article")).toHaveCount(1);
  await openReviewOptions(page);
  await page.getByRole("button", { name: "Carrousel", exact: true }).click();
  expect(await axeViolations(page, ["heading-order"])).toEqual([]);
});

test("connexion sans session : une seule invitation, vraies erreurs conservées", async ({
  page,
}) => {
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.startsWith("/auth/v1/"))
      return route.fulfill({
        status: 400,
        json: {
          error: "invalid_grant",
          error_description: "Invalid login credentials",
        },
      });
    return url.origin === base ? route.continue() : route.abort();
  });
  await page.goto(base + "/studio");
  await expect(
    page.getByRole("button", { name: "Se connecter", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByText("Connectez-vous à votre espace de travail.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Connectez-vous pour accéder au studio.", { exact: true }),
  ).toHaveCount(0);
  await page.getByLabel("E-mail", { exact: true }).fill("audit@example.test");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("test-only-password");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Connexion au studio", exact: true })
      .getByRole("alert"),
  ).toContainText("Invalid login credentials");
});

test("panne réseau à l’enregistrement : message français, brouillon préservé, aucune répétition automatique", async ({
  page,
}) => {
  const f = await validatorFixture(page);
  await openEditor(page, f.campaigns[1].id);
  let attempts = 0;
  await page.route("**/api/studio/commands", (route) => {
    if (route.request().postDataJSON()?.type !== "edit")
      return route.fallback();
    attempts++;
    return route.abort("failed");
  });
  const field = page.getByLabel("Titres · un par ligne");
  const copy = "Correction hors connexion\nTitre deux\nTitre trois";
  await field.fill(copy);
  await page
    .getByRole("button", { name: "Enregistrer et valider", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("alert")).toContainText(
    "Impossible de confirmer l’opération.",
  );
  await expect(dialog.getByRole("alert")).not.toContainText("Failed to fetch");
  await expect(field).toHaveValue(copy);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Modifier et valider", exact: true })
    .click();
  await expect(field).toHaveValue(copy);
  expect(attempts).toBe(1);
});

test("configuration neuve : campagne puis canaux, dépôt multiple et création globale", async ({
  page,
}) => {
  const f = await fixture(page);
  await beginCampaign(page, "Lot multicanal");
  await expect(
    page.getByRole("form", { name: "Informations de campagne", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  const chooser = page.getByRole("group", { name: "Choisir les canaux" });
  await expect(chooser).toBeVisible();
  expect(
    await axeViolations(page, [
      "color-contrast",
      "button-name",
      "label",
      "heading-order",
      "aria-allowed-attr",
    ]),
  ).toEqual([]);
  await page.screenshot({
    path: "/tmp/studio-batch-20261027/channels-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("complementary", {
      name: "Menu principal du studio",
      exact: true,
    }),
  ).toHaveCSS("height", "58px");
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(
    await axeViolations(page, [
      "color-contrast",
      "button-name",
      "label",
      "heading-order",
      "aria-allowed-attr",
    ]),
  ).toEqual([]);
  await page.screenshot({
    path: "/tmp/studio-batch-20261027/channels-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await expect(page.getByRole("table")).toHaveCount(0);
  await chooser.getByRole("button", { name: "Facebook", exact: true }).click();
  await chooser.getByRole("button", { name: "Instagram", exact: true }).click();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(
    page.getByRole("region", {
      name: "Bibliothèque des canaux sélectionnés",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  const library = page.getByRole("region", {
    name: "Bibliothèque des canaux sélectionnés",
    exact: true,
  });
  await library.locator("input[type=file]").setInputFiles([
    {
      name: "square-A.png",
      mimeType: "image/png",
      buffer: readFileSync(
        "Media Test/01-Studio/Facebook/facebook-square-1080x1080.png",
      ),
    },
    {
      name: "square-B.png",
      mimeType: "image/png",
      buffer: readFileSync(
        "Media Test/01-Studio/Facebook/facebook-square-1080x1080.png",
      ),
    },
  ]);
  const create = page.getByRole("button", {
    name: "Créer les 4 annonces",
    exact: true,
  });
  await expect(create).toBeEnabled();
  expect(
    await axeViolations(page, [
      "color-contrast",
      "button-name",
      "label",
      "heading-order",
      "aria-allowed-attr",
    ]),
  ).toEqual([]);
  await page.screenshot({
    path: "/tmp/studio-batch-20261027/batch-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect(
    await axeViolations(page, [
      "color-contrast",
      "button-name",
      "label",
      "heading-order",
      "aria-allowed-attr",
    ]),
  ).toEqual([]);
  await page.screenshot({
    path: "/tmp/studio-batch-20261027/batch-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  f.latency(500);
  await create.dblclick();
  await expect(page.getByRole("table")).toBeVisible();
  expect(f.commands.filter((c) => c.type === "upload")).toHaveLength(2);
  expect(
    f.commands
      .filter((c) => c.type === "upload")
      .every(
        (c) =>
          JSON.stringify(c.channels) ===
          JSON.stringify(["facebook", "instagram"]),
      ),
  ).toBe(true);
  expect(f.commands.filter((c) => c.type === "add_media_batch")).toHaveLength(
    1,
  );
  const campaign = f.campaigns.find((c) => c.name === "Lot multicanal");
  expect(campaign?.ads).toHaveLength(4);
});

async function startMediaBatch(page: Page, name: string, channels: string[]) {
  await beginCampaign(page, name);
  await expect(
    page.getByRole("form", { name: "Informations de campagne", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  const chooser = page.getByRole("group", { name: "Choisir les canaux" });
  for (const channel of channels)
    await chooser.getByRole("button", { name: channel, exact: true }).click();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
}

test("lot : un canal incompatible ne bloque pas les annonces compatibles", async ({
  page,
}) => {
  const f = await fixture(page);
  await startMediaBatch(page, "Lot mixte", ["Facebook", "YouTube"]);
  const library = page.getByRole("region", {
    name: "Bibliothèque des canaux sélectionnés",
    exact: true,
  });
  await library
    .locator("input[type=file]")
    .setInputFiles(
      "Media Test/01-Studio/Facebook/facebook-square-1080x1080.png",
    );
  await expect(
    library.getByText("Non compatible avec ce canal", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Créer l’annonce", exact: true })
    .click();
  await expect(page.getByRole("table")).toBeVisible();
  expect(
    f.campaigns.find((c) => c.name === "Lot mixte")?.ads.map((a) => a.channel),
  ).toEqual(["facebook"]);
  await page
    .getByRole("button", { name: "Ajouter des annonces", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ajouter des médias en lot", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Créer toutes les annonces",
      exact: true,
    }),
  ).toBeDisabled();
  expect(f.commands.filter((c) => c.type === "upload")).toHaveLength(1);
});

test("lot : une erreur de création permet une reprise explicite sans doublon", async ({
  page,
}) => {
  const f = await fixture(page);
  await startMediaBatch(page, "Lot à reprendre", ["Facebook", "Instagram"]);
  await page
    .locator("input[type=file]")
    .setInputFiles(
      "Media Test/01-Studio/Facebook/facebook-square-1080x1080.png",
    );
  f.fail(
    "add_media_batch",
    "Les données ont changé. Rechargez avant de modifier.",
  );
  await page
    .getByRole("button", { name: "Créer les 2 annonces", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({
      hasText: "Les données ont changé. Rechargez avant de modifier.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Créer les 2 annonces", exact: true }),
  ).toBeEnabled();
  expect(f.commands.filter((c) => c.type === "add_media_batch")).toHaveLength(
    1,
  );
  expect(
    f.campaigns.find((c) => c.name === "Lot à reprendre")?.ads,
  ).toHaveLength(0);
  f.fail("");
  await page
    .getByRole("button", { name: "Créer les 2 annonces", exact: true })
    .click();
  await expect(page.getByRole("table")).toBeVisible();
  expect(
    f.campaigns.find((c) => c.name === "Lot à reprendre")?.ads,
  ).toHaveLength(2);
  expect(f.commands.filter((c) => c.type === "upload")).toHaveLength(1);
});

test("Google SEM seul ouvre directement la saisie sans imposer de média", async ({
  page,
}) => {
  const f = await fixture(page);
  await startMediaBatch(page, "Campagne texte", ["Google SEM"]);
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await page.getByLabel("Annonce responsive Search").check();
  await page
    .getByRole("button", {
      name: "Confirmer et compléter les annonces",
      exact: true,
    })
    .click();
  await expect(page.getByRole("table")).toBeVisible();
  expect(
    f.campaigns.find((c) => c.name === "Campagne texte")?.ads[0].channel,
  ).toBe("google");
});

test("lot : le fichier en échec reste signalé après le succès des suivants", async ({
  page,
}) => {
  const f = await fixture(page);
  await startMediaBatch(page, "Lot partiel", ["Facebook", "Instagram"]);
  await page.route("**/api/studio/commands", (route) => {
    const cmd = route.request().postDataJSON();
    if (cmd.type === "upload" && cmd.name === "A.png")
      return route.fulfill({
        status: 400,
        json: { error: "Transfert indisponible." },
      });
    return route.fallback();
  });
  const library = page.getByRole("region", {
    name: "Bibliothèque des canaux sélectionnés",
    exact: true,
  });
  const buffer = readFileSync(
    "Media Test/01-Studio/Facebook/facebook-square-1080x1080.png",
  );
  await library.locator("input[type=file]").setInputFiles([
    { name: "A.png", mimeType: "image/png", buffer },
    { name: "B.png", mimeType: "image/png", buffer },
  ]);
  await expect(
    page.getByRole("button", { name: "Créer les 2 annonces", exact: true }),
  ).toBeEnabled();
  await expect(
    library.getByRole("alert").filter({ hasText: "A.png" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Créer les 2 annonces", exact: true })
    .click();
  await expect(page.getByRole("table")).toBeVisible();
  expect(f.campaigns.find((c) => c.name === "Lot partiel")?.ads).toHaveLength(
    2,
  );
});

test("configuration en trois étapes : campagne, canaux, annonces", async ({
  page,
}) => {
  const f = await fixture(page);
  await beginCampaign(page, "Parcours trois étapes");
  const form = page.getByRole("form", {
    name: "Informations de campagne",
    exact: true,
  });
  await expect(form).toBeVisible();
  expect(
    await axeViolations(page, [
      "color-contrast",
      "button-name",
      "label",
      "heading-order",
      "aria-allowed-attr",
    ]),
  ).toEqual([]);
  await page.screenshot({
    path: "/tmp/studio-steps-20261027/details-desktop.png",
    fullPage: true,
  });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await axeViolations(page, [
        "color-contrast",
        "button-name",
        "label",
        "heading-order",
        "aria-allowed-attr",
      ]),
    ).toEqual([]);
  }
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  await page.screenshot({
    path: "/tmp/studio-steps-20261027/details-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });

  await expect(
    page.getByRole("group", { name: "Choisir les canaux" }),
  ).toHaveCount(0);
  await expect(page.locator("input[type=file]")).toHaveCount(0);
  await form
    .getByLabel("Nom de campagne", { exact: true })
    .fill("Campagne complétée");
  await form
    .getByRole("combobox", { name: "Marque", exact: true })
    .selectOption("brand-test");
  await form.locator("summary").click();
  await form
    .getByLabel("URL commune", { exact: true })
    .fill("https://example.test/admissions");
  await form.getByLabel("Début", { exact: true }).fill("2027-01-01");
  await form
    .getByLabel("Fin · 23 h 59 Montréal", { exact: true })
    .fill("2027-02-01");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  const steps = page.getByRole("navigation", {
    name: "Étapes de configuration",
    exact: true,
  });
  await expect(
    steps.getByRole("button", { name: "2 Canaux", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  const chooser = page.getByRole("group", { name: "Choisir les canaux" });
  for (const name of ["Facebook", "Instagram"])
    await chooser.getByRole("button", { name, exact: true }).click();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(
    steps.getByRole("button", { name: "3 Annonces", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  await expect(
    page.getByRole("region", {
      name: "Bibliothèque des canaux sélectionnés",
      exact: true,
    }),
  ).toBeVisible();
  await steps.getByRole("button", { name: "1 Campagne", exact: true }).click();
  await expect(form.getByLabel("Nom de campagne", { exact: true })).toHaveValue(
    "Campagne complétée",
  );
  await expect(
    form.getByRole("combobox", { name: "Marque", exact: true }),
  ).toHaveValue("brand-test");
  await expect(form.getByLabel("URL commune", { exact: true })).toHaveValue(
    "https://example.test/admissions",
  );
  await expect(form.getByLabel("Début", { exact: true })).toHaveValue(
    "2027-01-01",
  );
  expect(
    f.campaigns.find((c) => c.name === "Campagne complétée")?.brandId,
  ).toBe("brand-test");
  await page.reload();
  await expect(
    form.getByLabel("Fin · 23 h 59 Montréal", { exact: true }),
  ).toHaveValue("2027-02-01");
});

test("première étape : un échec conserve les champs et ne passe pas aux canaux", async ({
  page,
}) => {
  const f = await fixture(page);
  await beginCampaign(page, "Campagne à compléter");
  const form = page.getByRole("form", {
    name: "Informations de campagne",
    exact: true,
  });
  await form
    .getByLabel("Nom de campagne", { exact: true })
    .fill("Nom conservé après erreur");
  f.fail("create_campaign", "Enregistrement indisponible.");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Nouvelle campagne", exact: true })
      .getByRole("alert"),
  ).toContainText("Enregistrement indisponible.");
  await expect(form.getByLabel("Nom de campagne", { exact: true })).toHaveValue(
    "Nom conservé après erreur",
  );
  await expect(
    page.getByRole("group", { name: "Choisir les canaux" }),
  ).toHaveCount(0);
  f.fail("");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "Choisir les canaux" }),
  ).toBeVisible();
});

test("une autre campagne vierge reprend à ses informations, pas à l’étape précédente", async ({
  page,
}) => {
  const f = await fixture(page);
  const empty = createCampaign("Autre campagne vierge", actor, now);
  f.campaigns.push(empty);
  await page.reload();
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
  await page
    .getByRole("navigation", { name: "Étapes de configuration", exact: true })
    .getByRole("button", { name: "2 Canaux", exact: true })
    .click();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await page.getByLabel("Campagne à configurer").selectOption(empty.id);
  await expect(
    page.getByRole("form", { name: "Informations de campagne", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Nom de campagne", { exact: true })).toHaveValue(
    empty.name,
  );
  await expect(page.locator("input[type=file]")).toHaveCount(0);
});

test("direction D : accueil vide puis création atomique avec métadonnées", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.screenshot({
    path: "/tmp/studio-d-20261029/landing-campaigns-desktop.png",
    fullPage: true,
  });
  f.empty();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Vos campagnes", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Créer votre campagne", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/studio-d-20261029/landing-empty-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/studio-d-20261029/landing-empty-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await beginCampaign(page, "Admissions atomiques");
  await expect(
    page.getByRole("group", { name: "Choisir les canaux" }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Marque", exact: true })
    .selectOption("brand-test");
  await page.locator("summary").filter({ hasText: "Dates et lien" }).click();
  await page
    .getByLabel("URL commune", { exact: true })
    .fill("https://example.test/admissions");
  await page.getByLabel("Début", { exact: true }).fill("2027-01-01");
  await page
    .getByLabel("Fin · 23 h 59 Montréal", { exact: true })
    .fill("2027-02-01");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "Choisir les canaux" }),
  ).toBeVisible();
  expect(
    f.commands.filter((command) => command.type === "create_campaign"),
  ).toEqual([
    expect.objectContaining({
      name: "Admissions atomiques",
      fields: {
        brandId: "brand-test",
        defaultUrl: "https://example.test/admissions",
        startDate: "2027-01-01",
        endDate: "2027-02-01",
      },
    }),
  ]);
  expect(
    f.commands.filter((command) => command.type === "campaign"),
  ).toHaveLength(0);
  await page.reload();
  await expect(
    page.getByRole("group", { name: "Choisir les canaux" }),
  ).toBeVisible();
});

test("direction D : Tab traverse les lignes et conserve le texte saisi", async ({
  page,
}) => {
  const f = await fixture(page, "draft");
  const campaign = addAd(f.campaigns[1], "google", "search", actor, now);
  campaign.ads[1].name = "Deuxième ligne";
  f.campaigns[1] = campaign;
  await page.goto(
    base + "/studio/configuration?campagne=" + campaign.id + "&canal=google",
  );
  await expect(page.getByLabel("Nom de l’annonce active")).toHaveCount(0);
  await page.screenshot({
    path: "/tmp/studio-d-20261029/table-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/studio-d-20261029/table-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const last = page.getByLabel("Chemin 2 de Beta annonce", { exact: true });
  await last.fill("admissions");
  await last.press("Tab");
  await expect(
    page.getByLabel("Format de Deuxième ligne", { exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(last).toBeFocused();
  await expect(last).toHaveValue("admissions");
  await expect
    .poll(
      () => f.campaigns.find((item) => item.id === campaign.id)?.ads[0].path2,
    )
    .toBe("admissions");
  await page.reload();
  await expect(last).toHaveValue("admissions");
});

test("direction D : Copier tout produit des blocs texte complets", async ({
  page,
}) => {
  const f = await fixture(page, "draft");
  const campaign = addAd(f.campaigns[1], "google", "search", actor, now);
  campaign.ads[0].theme = "Admissions";
  campaign.ads[0].path1 = "formation";
  campaign.ads[0].comments = [
    {
      text: "Garder ce détail",
      author: "Validation",
      at: now,
      resolution: "handled",
    },
  ];
  campaign.ads[1].name = "Deuxième annonce";
  f.campaigns[1] = campaign;
  await page.goto(
    base + "/studio/configuration?campagne=" + campaign.id + "&canal=google",
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (window as unknown as { copiedText: string }).copiedText = value;
        },
      },
    });
  });
  await page.getByRole("button", { name: "Copier tout", exact: true }).click();
  const copied = await page.evaluate(
    () => (window as unknown as { copiedText: string }).copiedText,
  );
  expect(copied).toContain("Annonce 1\nNom : Beta annonce\nCanal : Google SEM");
  expect(copied).toContain("Thématique : Admissions");
  expect(copied).toContain("Titres : Titre un\nTitre deux\nTitre trois");
  expect(copied).toContain("Descriptions : Description un\nDescription deux");
  expect(copied).toContain("Chemin 1 : formation");
  expect(copied).toContain("Lien : https://example.test");
  expect(copied).toContain("Commentaire traité : Garder ce détail");
  expect(copied).toContain("\n\nAnnonce 2\nNom : Deuxième annonce");
  expect(copied).not.toContain("<table");
});

test("direction D : duplication sous la source et déplacement clavier persistants", async ({
  page,
}) => {
  const f = await fixture(page, "draft");
  const campaign = addAd(f.campaigns[1], "google", "search", actor, now);
  campaign.ads[1].name = "Dernière annonce";
  f.campaigns[1] = campaign;
  await page.goto(
    base + "/studio/configuration?campagne=" + campaign.id + "&canal=google",
  );
  await page
    .getByRole("button", { name: "Dupliquer Beta annonce", exact: true })
    .click();
  await expect(page.locator("tbody tr[data-ad-row]")).toHaveCount(3);
  await expect
    .poll(() =>
      f.campaigns
        .find((item) => item.id === campaign.id)
        ?.ads.map((ad) => ad.name),
    )
    .toEqual(["Beta annonce", "Beta annonce (copie)", "Dernière annonce"]);
  expect(
    f.campaigns.find((item) => item.id === campaign.id)?.ads[1].status,
  ).toBe("draft");
  await page
    .getByRole("button", { name: "Déplacer Beta annonce (copie)", exact: true })
    .press("Alt+ArrowDown");
  await expect
    .poll(() =>
      f.campaigns
        .find((item) => item.id === campaign.id)
        ?.ads.map((ad) => ad.name),
    )
    .toEqual(["Beta annonce", "Dernière annonce", "Beta annonce (copie)"]);
  await page.reload();
  const rows = page.locator("tbody tr[data-ad-row]");
  await expect(
    rows
      .nth(2)
      .getByLabel("Thématique de Beta annonce (copie)", { exact: true }),
  ).toBeVisible();
  expect(
    f.commands.filter((command) => command.type === "duplicate"),
  ).toHaveLength(1);
  expect(
    f.commands.filter((command) => command.type === "move_ad"),
  ).toHaveLength(1);
});

test("direction D : commentaire traité conservé en gris sans validation", async ({
  page,
}) => {
  const f = await fixture(page, "changes_requested", true);
  f.setMediaUrl("ready-media", base + "/deck-demo/cu-generique-square.jpg");
  f.campaigns[1].ads[0].comments = [
    {
      text: "Préciser les admissions",
      author: "Validation",
      at: now,
      resolution: "open",
    },
  ];
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=facebook",
  );
  await page.screenshot({
    path: "/tmp/studio-d-20261029/table-social-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/studio-d-20261029/table-social-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openPreview(page);
  await expect(
    page
      .getByRole("complementary", { name: "Aperçu de l’annonce", exact: true })
      .locator("img"),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/studio-d-20261029/table-social-preview-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Marquer le commentaire comme pris en compte",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Commentaire pris en compte",
      exact: true,
    }),
  ).toBeDisabled();
  await expect(
    page.getByText("Préciser les admissions", { exact: false }),
  ).toBeVisible();
  const row = page
    .getByRole("row")
    .filter({ hasText: "Préciser les admissions" });
  await expect(row).toHaveClass(/handled/);
  await page.screenshot({
    path: "/tmp/studio-d-20261029/table-comment-handled-desktop.png",
    fullPage: true,
  });
  expect(f.campaigns[1].ads[0].status).toBe("changes_requested");
  expect(
    f.commands.filter((command) =>
      ["decide", "submit"].includes(String(command.type)),
    ),
  ).toHaveLength(0);
  await page.reload();
  await expect(row).toHaveClass(/handled/);
});

test("direction D : validation affiche tout le groupe par défaut", async ({
  page,
}) => {
  const f = await validatorFixture(page);
  const campaign = addAd(f.campaigns[1], "google", "search", actor, now);
  Object.assign(campaign.ads[1], {
    name: "Second texte du groupe",
    status: "pending",
  });
  f.campaigns[1] = campaign;
  await page.reload();
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(campaign.id);
  await expect(page.getByRole("article")).toHaveCount(2);
  await page.screenshot({
    path: "/tmp/studio-d-20261029/validation-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/studio-d-20261029/validation-mobile.png",
    fullPage: true,
  });
  await openReviewOptions(page);
  await expect(
    page.getByRole("button", { name: "Carrousel", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page.getByRole("button", { name: "Modifier et valider", exact: true }),
  ).toHaveCount(2);
});

test("direction D : On air inclut les canaux prévus et compte les familles", async ({
  page,
}) => {
  const f = await fixture(page, "on_air");
  let campaign = newVersion(
    f.campaigns[1],
    f.campaigns[1].ads[0].id,
    actor,
    now,
  );
  campaign = addAd(campaign, "facebook", "square", actor, now);
  campaign.channels = ["google", "facebook", "instagram"];
  f.campaigns[1] = campaign;
  await page.reload();
  await page.getByRole("link", { name: "On air", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(campaign.id);
  const overview = page.getByRole("region", {
    name: "Vue d’ensemble On air",
    exact: true,
  });
  await expect(overview).toContainText("1 / 3 canaux en ligne");
  await expect(overview).toContainText("1 / 2 annonces en ligne");
  await expect(
    overview.getByRole("region", { name: "Google SEM", exact: true }),
  ).toContainText("1 / 1");
  await expect(
    overview.getByRole("region", { name: "Facebook", exact: true }),
  ).toContainText("0 / 1");
  await expect(
    overview.getByRole("region", { name: "Instagram", exact: true }),
  ).toContainText("Aucune annonce créée");
  await page.screenshot({
    path: "/tmp/studio-d-20261029/onair-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/tmp/studio-d-20261029/onair-mobile.png",
    fullPage: true,
  });
});

test("fidélité maquettes : captures bureau avec campagne complète", async ({
  page,
}) => {
  test.setTimeout(90000);
  const f = await fixture(page, "draft");
  f.brands[0].name = "Collège Universel";
  const root = process.env.STUDIO_VISUAL_DIR ?? "/tmp/studio-fidelity-after";
  const capture = async (name: string) => {
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images).map((img) => img.decode().catch(() => {})),
      );
    });
    await page.screenshot({
      path: `${root}/${name}.png`,
      fullPage: true,
      animations: "disabled",
    });
  };
  await page.setViewportSize({ width: 1440, height: 900 });
  const c = f.campaigns[1];
  c.name = "Admissions automne 2027";
  c.defaultUrl = "https://collegeuniversel.ca";
  c.ads = [];
  c.media = [];
  c.channels = ["facebook", "instagram"];
  f.campaigns[0].name = "Portes ouvertes";
  const third = createCampaign("Formation continue", actor, now);
  third.brandId = "brand-test";
  f.campaigns.push(third);
  const texts = [
    "Votre prochaine étape commence ici.",
    "Des idées qui changent demain.",
    "ICI, vos ambitions grandissent.",
    "Plus qu’un diplôme.",
    "Des profs qui font la différence.",
    "Un campus au cœur de la ville.",
  ];
  let campaign = c;
  for (let i = 0; i < 6; i++) {
    campaign = addAd(
      campaign,
      "facebook",
      i === 1 || i === 4 ? "story" : "square",
      actor,
      now,
    );
    const ad = campaign.ads.at(-1)!;
    Object.assign(ad, {
      copy: texts[i],
      headline: i === 1 ? "" : "Admissions ouvertes",
      cta: "En savoir plus",
      url: c.defaultUrl,
      mediaId: `visual-${i}`,
      theme: "Vie étudiante",
    });
    campaign.media.push({
      id: `visual-${i}`,
      name: `admissions-${i}.jpg`,
      path: `admissions-${i}.jpg`,
      channel: "facebook",
      mime: "image/jpeg",
      bytes: 10000,
      width: 1080,
      height: ad.format === "story" ? 1920 : 1080,
      duration: null,
      state: "ready",
      errors: [],
    });
    f.setMediaUrl(
      `visual-${i}`,
      base +
        "/deck-demo/cu-generique-" +
        (ad.format === "story" ? "vertical" : "square") +
        ".jpg",
    );
  }
  campaign.ads[1].status = "changes_requested";
  campaign.ads[1].comments = [
    {
      text: "Merci de préciser la date de rentrée et de raccourcir l’accroche.",
      author: "Validateur",
      at: now,
      resolution: "open",
    },
  ];
  f.campaigns[1] = campaign;
  await page.reload();
  await capture("01-campagnes");
  await page
    .getByRole("link", { name: "Créer votre campagne", exact: true })
    .click();
  await page
    .getByLabel("Nom de campagne", { exact: true })
    .fill("Admissions automne 2027");
  await capture("02-formulaire");
  await page.goto(
    base +
      `/studio/configuration?campagne=${campaign.id}&canal=facebook&etape=channels`,
  );
  await capture("03-canaux");
  await page.goto(
    base +
      `/studio/configuration?campagne=${campaign.id}&canal=facebook&etape=media`,
  );
  await capture("04-medias");
  await page.goto(
    base +
      `/studio/configuration?campagne=${campaign.id}&canal=facebook&etape=editor`,
  );
  await expect(page.getByRole("table")).toBeVisible();
  await capture("05-tableau");
  const tableBox = await page.getByRole("table").boundingBox();
  const tabsBox = await page
    .getByRole("navigation", { name: "Canal de configuration" })
    .boundingBox();
  const copyBox = await page
    .getByRole("button", { name: "Copier tout", exact: true })
    .boundingBox();
  await openPreview(page);
  await capture("06-apercu");
  await page
    .getByRole("button", { name: "Fermer l’aperçu", exact: true })
    .click();
  campaign.ads = campaign.ads.slice(0, 3).map((a) => ({
    ...a,
    format: "square",
    mediaId: "visual-0",
    status: "pending" as const,
  }));
  f.campaigns[1] = campaign;
  f.setActor(actor);
  await page.goto(base + `/studio/validation?campagne=${campaign.id}`);
  await capture("07-validation-facebook");
  await page
    .getByRole("button", { name: "Modifier et valider", exact: true })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await capture("08-modification");
  await page.getByRole("button", { name: "Fermer", exact: true }).click();
  for (const channel of [
    "instagram",
    "tiktok",
    "youtube",
    "google",
    "display",
  ] as const) {
    const formats =
      channel === "instagram"
        ? ["square", "story", "reel"]
        : channel === "youtube"
          ? ["instream", "short"]
          : channel === "display"
            ? ["leaderboard", "rectangle", "halfpage"]
            : channel === "google"
              ? ["search", "search", "search"]
              : ["vertical", "vertical", "vertical"];
    campaign.ads = [];
    for (const [i, format] of formats.entries()) {
      campaign = addAd(campaign, channel, format, actor, now);
      const ad = campaign.ads.at(-1)!;
      Object.assign(ad, {
        theme: "Vie étudiante",
        copy: texts[i],
        headline: "Vivez l’expérience",
        headlines:
          channel === "google"
            ? [
                "Collège Universel",
                "Admissions automne 2027",
                "Trouvez votre programme",
              ]
            : [],
        descriptions:
          channel === "google"
            ? [
                "Une communauté qui vous ressemble. Des programmes concrets pour votre avenir à Montréal.",
              ]
            : [],
        cta: "Découvrir",
        url: c.defaultUrl,
        status: "pending",
        mediaId: channel === "google" ? null : `channel-${channel}-${i}`,
      });
      if (ad.mediaId) {
        const isWide = channel === "youtube" && format === "instream";
        const dims =
          channel === "display"
            ? CATALOG.display.find((x) => x.id === format)!
            : {
                width: 1080,
                height: format === "square" ? 1080 : isWide ? 608 : 1920,
              };
        campaign.media.push({
          id: ad.mediaId,
          name: `${format}.jpg`,
          path: `${format}.jpg`,
          channel,
          mime: "image/jpeg",
          bytes: 10000,
          width: dims.width,
          height: dims.height,
          duration: null,
          state: "ready",
          errors: [],
        });
        f.setMediaUrl(
          ad.mediaId,
          base +
            "/deck-demo/" +
            (channel === "display"
              ? `cu-${dims.width}x${dims.height}.gif`
              : `cu-generique-${format === "square" || isWide ? "square" : "vertical"}.jpg`),
        );
      }
    }
    f.campaigns[1] = campaign;
    await page.reload();
    await capture(`09-validation-${channel}`);
    const lastAction = await page
      .getByRole("button", { name: "Approuver", exact: true })
      .last()
      .boundingBox();
    if (lastAction)
      expect(
        lastAction.y + lastAction.height,
        `${channel}: validation accessible sans défiler sur bureau`,
      ).toBeLessThanOrEqual(900);
  }
  campaign.ads = [];
  campaign.channels = [
    "facebook",
    "instagram",
    "youtube",
    "tiktok",
    "google",
    "display",
  ];
  for (const channel of campaign.channels) {
    const count =
      channel === "facebook"
        ? 4
        : ["youtube", "tiktok"].includes(channel)
          ? 2
          : 3;
    const live =
      channel === "facebook"
        ? 3
        : channel === "youtube"
          ? 1
          : ["instagram", "tiktok"].includes(channel)
            ? 2
            : 0;
    for (let i = 0; i < count; i++) {
      const format =
        channel === "facebook"
          ? "square"
          : channel === "instagram"
            ? "story"
            : channel === "youtube"
              ? "instream"
              : channel === "tiktok"
                ? "vertical"
                : channel === "google"
                  ? "search"
                  : ["leaderboard", "rectangle", "halfpage"][i];
      campaign = addAd(campaign, channel, format, actor, now);
      Object.assign(campaign.ads.at(-1)!, {
        status: i < live ? "on_air" : "draft",
        mediaId:
          channel === "facebook"
            ? `visual-${i === 1 ? 2 : i}`
            : `channel-${channel}-${channel === "youtube" ? 0 : i}`,
        copy: texts[i],
        url: c.defaultUrl,
      });
    }
  }
  f.campaigns[1] = campaign;
  await page.goto(base + `/studio/on-air?campagne=${campaign.id}`);
  await capture("10-on-air");
  await page.setViewportSize({ width: 390, height: 844 });
  await capture("11-on-air-mobile");
  f.campaigns[1].ads
    .filter((a) => a.channel === "facebook")
    .forEach((a) => {
      a.status = "pending";
      a.theme = "Vie étudiante";
    });
  await page.goto(base + `/studio/validation?campagne=${campaign.id}`);
  await capture("12-validation-mobile");
  f.empty();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base + "/studio");
  await capture("00-aucune-campagne");
  // Structural visual contracts from the approved D4 mockup (1440 px desktop).
  expect(
    tableBox!.y,
    "Le tableau doit débuter sous la barre unique, sans étage vide",
  ).toBeLessThan(245);
  expect(
    Math.abs(
      tabsBox!.y + tabsBox!.height / 2 - (copyBox!.y + copyBox!.height / 2),
    ),
    "Canaux et outils sur une seule ligne",
  ).toBeLessThan(8);
});

test("Google SEM : aperçu réaliste, tous les textes conservés dans l’éditeur", async ({
  page,
}) => {
  const f = await validatorFixture(page);
  const campaign = f.campaigns[1];
  const ad = campaign.ads[0];
  ad.headlines = Array.from({ length: 15 }, (_, i) => `Accroche ${i + 1}`);
  ad.descriptions = Array.from({ length: 4 }, (_, i) => `Description ${i + 1}`);
  await page.goto(base + `/studio/validation?campagne=${campaign.id}`);
  const preview = page.locator(`[data-workspace-ad="${ad.id}"]`);
  await expect(
    preview.getByRole("heading", {
      name: "Accroche 1 | Accroche 2 | Accroche 3",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    preview.getByText("Description 2", { exact: true }),
  ).toBeVisible();
  await expect(preview.getByText("Description 3", { exact: true })).toHaveCount(
    0,
  );
  await page
    .getByRole("button", { name: "Modifier et valider", exact: true })
    .click();
  await expect(page.getByLabel("Titres · un par ligne")).toHaveValue(
    ad.headlines.join("\n"),
  );
  await expect(page.getByLabel("Descriptions · une par ligne")).toHaveValue(
    ad.descriptions.join("\n"),
  );
});

for (const width of [1440, 390]) {
  test(`suppression campagne : confirmation, annulation et persistance à ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const f = await fixture(page);
    const deleted = f.campaigns[1];
    const other = f.campaigns[0];
    await page.goto(base + `/studio?campagne=${deleted.id}`);
    const trigger = page.getByRole("button", {
      name: "Supprimer la campagne Beta",
      exact: true,
    });
    await trigger.click();
    const dialog = page.getByRole("dialog", {
      name: "Supprimer la campagne",
      exact: true,
    });
    const confirm = dialog.getByRole("button", {
      name: /^(Supprimer définitivement|Suppression…)$/,
    });
    await expect(confirm).toBeDisabled();
    await dialog
      .getByLabel("Nom de campagne à confirmer", { exact: true })
      .fill("Autre campagne");
    await expect(confirm).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    expect(f.commands.filter((c) => c.type === "delete_campaign")).toHaveLength(
      0,
    );
    await expect(trigger).toBeFocused();
    await trigger.click();
    await dialog
      .getByLabel("Nom de campagne à confirmer", { exact: true })
      .fill("Beta");
    await page.screenshot({
      path: testInfo.outputPath(`confirmation-${width}.png`),
      fullPage: true,
    });
    const release = f.hold("delete_campaign");
    await confirm.click();
    await expect(confirm).toBeDisabled();
    await page.keyboard.press("Enter");
    await expect
      .poll(() => f.commands.filter((c) => c.type === "delete_campaign").length)
      .toBe(1);
    release();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toHaveCount(0);
    expect(f.campaigns.map((c) => c.id)).toEqual([other.id]);
    expect(f.brands).toHaveLength(1);
    expect(new URL(page.url()).searchParams.get("campagne")).not.toBe(
      deleted.id,
    );
    await page.reload();
    await expect(trigger).toHaveCount(0);
    await expect(
      page.getByRole("link").filter({ hasText: "Alpha" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("suppression campagne : échec conserve la campagne et permet une reprise volontaire", async ({
  page,
}) => {
  const f = await fixture(page);
  f.fail("delete_campaign", "Suppression indisponible. Réessayez.");
  await page
    .getByRole("button", { name: "Supprimer la campagne Beta", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Supprimer la campagne",
    exact: true,
  });
  await dialog
    .getByLabel("Nom de campagne à confirmer", { exact: true })
    .fill("Beta");
  await dialog
    .getByRole("button", { name: "Supprimer définitivement", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText(
    "Suppression indisponible",
  );
  expect(f.campaigns).toHaveLength(2);
  await expect(
    dialog.getByLabel("Nom de campagne à confirmer", { exact: true }),
  ).toHaveValue("Beta");
  expect(f.commands.filter((c) => c.type === "delete_campaign")).toHaveLength(
    1,
  );
  f.fail("");
  await dialog
    .getByRole("button", { name: "Supprimer définitivement", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  expect(f.campaigns.map((c) => c.name)).toEqual(["Alpha"]);
});

test("suppression campagne : droits du créateur et refus des autres campagnes", async ({
  page,
}) => {
  const f = await fixture(page);
  const preparer: Actor = {
    kind: "human",
    role: "preparer",
    id: "22222222-2222-4222-8222-222222222222",
    name: "Préparation test",
  };
  f.campaigns[0].createdBy = preparer.id;
  f.setActor(preparer);
  await page.reload();
  await expect(
    page.getByRole("button", {
      name: "Supprimer la campagne Alpha",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Supprimer la campagne Beta",
      exact: true,
    }),
  ).toHaveCount(0);
});

test("suppression campagne : confirmation périmée ne reprend pas la nouvelle révision", async ({
  page,
}) => {
  await page.clock.install();
  const f = await fixture(page);
  const initialRevision = f.campaigns[1].revision;
  await page
    .getByRole("button", { name: "Supprimer la campagne Beta", exact: true })
    .click();
  f.campaigns[1].revision++;
  const refreshed = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/api/studio",
  );
  await page.clock.fastForward(15001);
  await refreshed;
  const dialog = page.getByRole("dialog", {
    name: "Supprimer la campagne",
    exact: true,
  });
  await dialog
    .getByLabel("Nom de campagne à confirmer", { exact: true })
    .fill("Beta");
  await dialog
    .getByRole("button", { name: "Supprimer définitivement", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toContainText("La campagne a changé");
  expect(f.commands.find((c) => c.type === "delete_campaign")?.revision).toBe(
    initialRevision,
  );
  expect(f.campaigns).toHaveLength(2);
});

test("suppression campagne : un ancien rafraîchissement ne ressuscite pas la carte", async ({
  page,
}) => {
  await page.clock.install();
  const f = await fixture(page);
  let release!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const seen = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route(
    "**/api/studio",
    async (route) => {
      const stale = f.snapshot();
      started();
      await hold;
      await route.fulfill({ json: stale });
    },
    { times: 1 },
  );
  await page.clock.fastForward(15001);
  await seen;
  await page
    .getByRole("button", { name: "Supprimer la campagne Beta", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Supprimer la campagne",
    exact: true,
  });
  await dialog
    .getByLabel("Nom de campagne à confirmer", { exact: true })
    .fill("Beta");
  await dialog
    .getByRole("button", { name: "Supprimer définitivement", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
  const refreshed = page.waitForResponse(
    (r) => new URL(r.url()).pathname === "/api/studio",
  );
  release();
  await refreshed;
  await expect(
    page.getByRole("button", {
      name: "Supprimer la campagne Beta",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link").filter({ hasText: "Alpha" }),
  ).toBeVisible();
});

test("tableau mobile : une pause sans modification ne bloque pas la reprise de saisie", async ({
  page,
}, testInfo) => {
  await page.clock.install();
  const f = await fixture(page, "draft", false, true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=google",
  );
  const field = page.getByLabel("Thématique de Beta annonce", { exact: true });
  await expect
    .poll(() => f.commands.filter((c) => c.type === "lock").length)
    .toBeGreaterThan(0);
  await page.clock.fastForward(120001);
  await expect(
    page.getByRole("button", { name: "Reprendre l’édition", exact: true }),
  ).toHaveCount(0);
  await field.fill("Reprise après lecture");
  await page.clock.runFor(1000);
  await expect
    .poll(() => f.campaigns[1].ads[0].theme)
    .toBe("Reprise après lecture");
  await page.screenshot({
    path: testInfo.outputPath("mobile-saisie-apres-pause.png"),
  });
});

test("tableau Google : le batch initial cible bien les titres affichés", async ({
  page,
}) => {
  const f = await fixture(page, "draft");
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=google",
  );
  await page.getByLabel("Sélectionner toutes les annonces du canal").check();
  await page
    .getByRole("button", { name: "Appliquer un champ en batch" })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Champ", exact: true }),
  ).toHaveValue("headlines");
  await page
    .getByLabel("Valeur à appliquer")
    .fill("Premier titre\nDeuxième titre\nTroisième titre");
  await page
    .getByRole("button", { name: "Appliquer à 1 ligne(s)", exact: true })
    .click();
  await expect
    .poll(() => f.commands.filter((c) => c.type === "batch").length)
    .toBe(1);
  expect(f.commands.find((c) => c.type === "batch")?.fields).toEqual({
    headlines: ["Premier titre", "Deuxième titre", "Troisième titre"],
  });
});

test("tableau : retour d’un onglet suspendu reprend le bail avant sauvegarde", async ({
  page,
}) => {
  const f = await fixture(page, "draft", false, true);
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=google",
  );
  await expect
    .poll(() => f.commands.filter((c) => c.type === "lock").length)
    .toBeGreaterThan(0);
  f.expireLeases();
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  const before = f.commands.length;
  await page
    .getByLabel("Thématique de Beta annonce", { exact: true })
    .fill("Après suspension");
  await expect.poll(() => f.campaigns[1].ads[0].theme).toBe("Après suspension");
  const writes = f.commands.slice(before).map((c) => c.type);
  expect(writes.indexOf("lock")).toBeLessThan(writes.indexOf("edit"));
  const tokens = f.commands
    .filter((c) => c.type === "lock")
    .map((c) => c.token);
  expect(new Set(tokens).size).toBe(1);
});

test("tableau : autre éditeur après suspension préserve la saisie et bloque l’écriture", async ({
  page,
}) => {
  const f = await fixture(page, "draft", false, true);
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=google",
  );
  await expect
    .poll(() => f.commands.filter((c) => c.type === "lock").length)
    .toBeGreaterThan(0);
  f.claimElsewhere(f.campaigns[1].ads[0].id);
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  const field = page.getByLabel("Thématique de Beta annonce", { exact: true });
  await field.fill("À conserver");
  await expect(
    page.getByRole("button", { name: "Reprendre l’édition", exact: true }),
  ).toBeVisible();
  await expect(field).toHaveValue("À conserver");
  expect(f.commands.filter((c) => c.type === "edit")).toHaveLength(0);
});

test("tableau mobile : outils, aperçu visible, envoi incomplet et déplacement tactile", async ({
  page,
}, testInfo) => {
  const f = await fixture(page, "draft", true);
  f.setMediaUrl("ready-media", base + "/deck-demo/cu-generique-square.jpg");
  const c = addAd(f.campaigns[1], "facebook", "square", actor, now);
  c.ads[1].name = "Deuxième annonce";
  f.campaigns[1] = c;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    base + "/studio/configuration?campagne=" + c.id + "&canal=facebook",
  );
  await page
    .getByRole("button", { name: "Appliquer un champ en batch" })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Sélectionnez les lignes" }),
  ).toBeVisible();
  await expect(page.getByLabel("Valeur à appliquer")).toBeVisible();
  await page.getByLabel("Sélectionner toutes les annonces du canal").check();
  await page.getByLabel("Valeur à appliquer").fill("Message commun");
  await page
    .getByRole("button", { name: "Appliquer à 2 ligne(s)", exact: true })
    .click();
  await expect
    .poll(() => f.campaigns[1].ads.every((a) => a.copy === "Message commun"))
    .toBe(true);
  await page
    .getByRole("button", { name: "Ajouter des annonces", exact: true })
    .click();
  await expect(
    page.locator("details[open]").filter({ hasText: "Choisir des formats" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Aperçu", exact: true }).click();
  const preview = page.getByRole("complementary", {
    name: "Aperçu de l’annonce",
    exact: true,
  });
  await expect(preview).toBeInViewport();
  const closeNotice = page.getByRole("button", {
    name: "Fermer la notification",
    exact: true,
  });
  if (await closeNotice.count()) await closeNotice.click();
  await page.screenshot({
    path: testInfo.outputPath("mobile-apercu-visible.png"),
  });
  await page
    .getByRole("button", { name: "Fermer l’aperçu", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Envoyer Deuxième annonce", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "À compléter : Média conforme" }),
  ).toBeVisible();
  expect(f.commands.filter((c) => c.type === "submit")).toHaveLength(0);
  await page
    .getByRole("button", { name: "Déplacer Beta annonce", exact: true })
    .click();
  const move = page.getByRole("dialog", {
    name: "Déplacer Beta annonce",
    exact: true,
  });
  await expect(move).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("mobile-deplacement.png"),
  });
  await expect(
    move.getByRole("button", { name: "Monter", exact: true }),
  ).toBeDisabled();
  await move.getByRole("button", { name: "Descendre", exact: true }).click();
  await expect
    .poll(() => f.campaigns[1].ads.map((a) => a.name))
    .toEqual(["Deuxième annonce", "Beta annonce"]);
  await expect(move).not.toBeVisible();
});

test("tableau : déverrouiller directement une autre ligne approuvée", async ({
  page,
}) => {
  const f = await fixture(page, "approved");
  const c = addAd(f.campaigns[1], "google", "search", actor, now);
  c.ads[1].name = "Autre annonce";
  c.ads[1].status = "approved";
  c.ads[1].headlines = ["Premier titre", "Deuxième titre", "Troisième titre"];
  c.ads[1].descriptions = ["Première description", "Deuxième description"];
  f.campaigns[1] = c;
  await page.goto(
    base + "/studio/configuration?campagne=" + c.id + "&canal=google",
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "Déverrouiller Autre annonce", exact: true })
    .click();
  const field = page.getByLabel("Thématique de Autre annonce", { exact: true });
  await expect(field).toBeEditable();
  await field.fill("Correction volontaire");
  await expect
    .poll(() => f.campaigns[1].ads[1].theme)
    .toBe("Correction volontaire");
  expect(f.campaigns[1].ads[1].status).toBe("pending");
});

test("tableau : révision distante changée demande une reprise explicite sans perdre le texte", async ({
  page,
}) => {
  const f = await fixture(page, "draft", false, true);
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=google",
  );
  await expect
    .poll(() => f.commands.filter((c) => c.type === "lock").length)
    .toBeGreaterThan(0);
  f.expireLeases();
  f.campaigns[1].ads[0].theme = "Version distante";
  f.campaigns[1].ads[0].revision++;
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  const field = page.getByLabel("Thématique de Beta annonce", { exact: true });
  await field.fill("Correction locale à conserver");
  const retry = page.getByRole("button", {
    name: "Reprendre l’édition",
    exact: true,
  });
  await expect(retry).toBeVisible();
  await expect(page.getByRole("table").getByRole("alert")).toContainText(
    "a changé pendant votre absence",
  );
  await expect(field).toHaveValue("Correction locale à conserver");
  expect(f.commands.filter((c) => c.type === "edit")).toHaveLength(0);
  await retry.click();
  await expect
    .poll(() => f.campaigns[1].ads[0].theme)
    .toBe("Correction locale à conserver");
  await expect(retry).toHaveCount(0);
});

test("tableau : format, détails, média de ligne, historique et navigation aperçu", async ({
  page,
}) => {
  const f = await fixture(page, "draft", true);
  const c = addAd(f.campaigns[1], "facebook", "square", actor, now);
  c.ads[1].name = "Dernière annonce";
  f.campaigns[1] = c;
  await page.goto(
    base + "/studio/configuration?campagne=" + c.id + "&canal=facebook",
  );
  const format = page.getByLabel("Format de Beta annonce", { exact: true });
  await format.selectOption("portrait");
  await expect.poll(() => f.campaigns[1].ads[0].format).toBe("portrait");
  await format.selectOption("square");
  await expect.poll(() => f.campaigns[1].ads[0].format).toBe("square");
  await page
    .getByRole("button", { name: "Aperçu de Beta annonce", exact: true })
    .click();
  const preview = page.getByRole("complementary", {
    name: "Aperçu de l’annonce",
    exact: true,
  });
  await expect(
    preview.getByRole("button", { name: "Annonce précédente" }),
  ).toBeDisabled();
  await preview.getByText("Détails de l’annonce", { exact: true }).click();
  await page
    .getByLabel("Nom de l’annonce active", { exact: true })
    .fill("Nom vérifié");
  await expect.poll(() => f.campaigns[1].ads[0].name).toBe("Nom vérifié");
  const media = page.getByLabel("Média de Nom vérifié", { exact: true });
  await media.selectOption("");
  await expect.poll(() => f.campaigns[1].ads[0].mediaId).toBeNull();
  await media.selectOption("ready-media");
  await expect.poll(() => f.campaigns[1].ads[0].mediaId).toBe("ready-media");
  await page
    .getByLabel("Joindre un média")
    .setInputFiles("public/deck-demo/cu-generique-square.jpg");
  await expect
    .poll(() => f.campaigns[1].ads[0].mediaId)
    .toBe("uploaded-media-1");
  await preview.locator("summary").filter({ hasText: "Historique" }).click();
  await expect(
    preview.getByText("Nom vérifié", { exact: true }).last(),
  ).toBeVisible();
  await preview
    .getByRole("button", { name: "Annonce suivante", exact: true })
    .click();
  await expect(
    page.getByLabel("Nom de l’annonce active", { exact: true }),
  ).toHaveValue("Dernière annonce");
  await expect(
    preview.getByRole("button", { name: "Annonce suivante", exact: true }),
  ).toBeDisabled();
  await preview
    .getByRole("button", { name: "Annonce précédente", exact: true })
    .click();
  await expect(
    page.getByLabel("Nom de l’annonce active", { exact: true }),
  ).toHaveValue("Nom vérifié");
});

for (const width of [1440, 390]) {
  test(`compteurs tableau ${width}px : décompte libre, discret et navigation clavier intacte`, async ({
    page,
  }, testInfo) => {
    const f = await fixture(page, "draft", true, true);
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      base +
        "/studio/configuration?campagne=" +
        f.campaigns[1].id +
        "&canal=facebook",
    );
    const field = page.getByLabel("Texte de Beta annonce", { exact: true });
    const cell = field.locator("..");
    const counter = cell.locator("[data-character-countdown]");
    const expectBadgeInScrollViewport = async (badge: typeof counter) => {
      await expect
        .poll(async () =>
          badge.evaluate((element) => {
            const scroll = element.closest("table")!.parentElement!;
            const viewport = scroll.getBoundingClientRect();
            const bounds = element.getBoundingClientRect();
            return (
              bounds.left >= viewport.left && bounds.right <= viewport.right
            );
          }),
        )
        .toBe(true);
    };
    await expect(counter).toHaveAttribute("data-remaining", "150");
    await expect(counter).toHaveAttribute(
      "title",
      /longueur recommandée de 150/,
    );
    await expect(page.locator("[data-character-countdown]")).toHaveCount(2);
    await expect(field).not.toHaveAttribute("maxlength");
    const initialHeight = (await cell.boundingBox())!.height;
    const initialColor = await counter.evaluate(
      (el) => getComputedStyle(el).color,
    );
    await field.fill("a".repeat(149));
    await expectBadgeInScrollViewport(counter);
    await expect(counter).toHaveAttribute("data-remaining", "1");
    await expect
      .poll(() => counter.evaluate((el) => getComputedStyle(el).color))
      .not.toBe(initialColor);
    await page.screenshot({
      path: testInfo.outputPath(`compteur-proche-${width}.png`),
    });
    await field.press("End");
    await field.press("a");
    await expect(counter).toHaveAttribute("data-remaining", "0");
    await field.press("b");
    await expect(counter).toHaveAttribute("data-remaining", "-1");
    await expect(field).toHaveValue("a".repeat(150) + "b");
    await expect(counter).toHaveCSS("color", "rgb(105, 64, 22)");
    await expect
      .poll(() => f.campaigns[1].ads[0].copy)
      .toBe("a".repeat(150) + "b");
    expect((await cell.boundingBox())!.height).toBe(initialHeight);
    expect(initialHeight).toBeLessThanOrEqual(49);
    const badgeBox = (await counter.boundingBox())!;
    const cellBox = (await cell.boundingBox())!;
    const fieldBox = (await field.boundingBox())!;
    expect(fieldBox.x + fieldBox.width).toBeLessThanOrEqual(badgeBox.x);
    expect(badgeBox.width).toBe(26);
    expect(badgeBox.height).toBe(26);
    expect(
      cellBox.x + cellBox.width - badgeBox.x - badgeBox.width,
    ).toBeLessThanOrEqual(6);
    expect(
      cellBox.y + cellBox.height - badgeBox.y - badgeBox.height,
    ).toBeLessThanOrEqual(6);
    await page.screenshot({
      path: testInfo.outputPath(`compteur-depasse-${width}.png`),
    });
    await field.press("Tab");
    await expect(
      page.getByLabel("Titre de Beta annonce", { exact: true }),
    ).toBeFocused();
    await expectBadgeInScrollViewport(
      page
        .getByLabel("Titre de Beta annonce", { exact: true })
        .locator("..")
        .locator("[data-character-countdown]"),
    );
    await page.keyboard.press("Shift+Tab");
    await expect(field).toBeFocused();
    await expectBadgeInScrollViewport(counter);
    await page
      .getByLabel("Format de Beta annonce", { exact: true })
      .selectOption("story");
    await expect(counter).toHaveAttribute("data-limit", "125");
    await expect(counter).toHaveAttribute("data-remaining", "-26");
    expect((await cell.boundingBox())!.height).toBe(initialHeight);
    await field.fill("e\u0301👨‍👩‍👧‍👦");
    await expect(counter).toHaveAttribute("data-remaining", "123");
  });
}

test("compteurs tableau Google : budget par variante, pas par somme de la cellule", async ({
  page,
}) => {
  const f = await fixture(page, "draft");
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=google",
  );
  const field = page.getByLabel("Titres · 30 caractères de Beta annonce", {
    exact: true,
  });
  const counter = field.locator("..").locator("[data-character-countdown]");
  await expect(page.locator("[data-character-countdown]")).toHaveCount(4);
  await field.fill("a".repeat(20) + "\n" + "b".repeat(31) + "\nTitre trois");
  await expect(counter).toHaveAttribute("data-remaining", "-1");
  await expect(counter).toHaveAttribute("title", /Texte 2, le plus long/);
  await expect(counter).toHaveAttribute("title", /limite du champ de 30/);
  await field.press("Tab");
  const descriptions = page.getByLabel(
    "Descriptions · 90 caractères de Beta annonce",
    { exact: true },
  );
  await expect(descriptions).toBeFocused();
  await descriptions.fill("Court\n" + "x".repeat(91));
  await expect(
    descriptions.locator("..").locator("[data-character-countdown]"),
  ).toHaveAttribute("data-remaining", "-1");
  const path = page.getByLabel("Chemin 1 de Beta annonce", { exact: true });
  await path.fill("abcdefghijklmnop");
  await expect(
    path.locator("..").locator("[data-character-countdown]"),
  ).toHaveAttribute("data-remaining", "-1");
  await expect(path).toHaveValue("abcdefghijklmnop");
});

test.describe("Contrôles tactiles", () => {
  test.use({ hasTouch: true, isMobile: true });
  for (const width of [320, 390, 844]) {
    test(`champs mobiles sans petite police à ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      async function minimumTextSize(fields: ReturnType<Page["locator"]>) {
        const sizes = await fields.evaluateAll((elements) =>
          elements.map((element) => ({
            label:
              element.getAttribute("aria-label") ||
              element.getAttribute("name") ||
              element.tagName,
            size: parseFloat(getComputedStyle(element).fontSize),
          })),
        );
        expect(sizes.length).toBeGreaterThan(0);
        for (const field of sizes)
          expect.soft(field.size, field.label).toBeGreaterThanOrEqual(16);
      }
      const f = await fixture(page, "draft", true, false, async (login) => {
        await expect(login.getByLabel("E-mail", { exact: true })).toBeVisible();
        await minimumTextSize(
          login.locator('input[type="email"], input[type="password"]'),
        );
      });
      await page
        .getByRole("link", { name: "Créer votre campagne", exact: true })
        .click();
      const name = page.getByLabel("Nom de campagne", { exact: true });
      await expect(name).toBeVisible();
      await expect(name).not.toBeFocused();
      await name.locator("..").evaluate((label) => {
        label.style.fontSize = "20px";
      });
      await expect(name).toHaveCSS("font-size", "20px");
      await name.locator("..").evaluate((label) => {
        label.style.removeProperty("font-size");
      });
      await page.screenshot({
        path: `/tmp/studio-mobile-fonts-${width}-creation.png`,
        fullPage: true,
      });
      await page
        .locator("summary")
        .filter({ hasText: "Dates et lien" })
        .click();
      await minimumTextSize(
        page
          .getByRole("form", { name: "Informations de campagne", exact: true })
          .locator("input,select"),
      );
      await page
        .getByRole("button", { name: "Créer une marque", exact: true })
        .click();
      await minimumTextSize(
        page
          .getByRole("form", { name: "Nouvelle marque", exact: true })
          .locator("input"),
      );
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      await page.goto(
        base +
          "/studio/configuration?campagne=" +
          f.campaigns[1].id +
          "&canal=facebook",
      );
      await expect(
        page.getByLabel("Texte de Beta annonce", { exact: true }),
      ).toBeVisible();
      await minimumTextSize(page.locator("table textarea,table select"));
      await page.screenshot({
        path: `/tmp/studio-mobile-fonts-${width}-table.png`,
      });
      const checkbox = page.locator('table input[type="checkbox"]').first();
      await expect(checkbox).toHaveCSS("width", "17px");
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
      const viewport = await page
        .locator('meta[name="viewport"]')
        .getAttribute("content");
      expect(viewport).toContain("initial-scale=1");
      expect(viewport).not.toMatch(/user-scalable=no|maximum-scale=1/);
    });
  }
});

test("champs desktop conservent leurs proportions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const f = await fixture(page, "draft", true);
  await page
    .getByRole("link", { name: "Créer votre campagne", exact: true })
    .click();
  await expect(page.getByLabel("Nom de campagne", { exact: true })).toHaveCSS(
    "font-size",
    "14px",
  );
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=facebook",
  );
  await expect(
    page.getByLabel("Texte de Beta annonce", { exact: true }),
  ).toHaveCSS("font-size", "14px");
});

test.describe("Arrivée mobile en création", () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  for (const destination of ["formulaire", "tableau"] as const) {
    test(`échelle stable pendant arrivée et navigation : ${destination}`, async ({
      page,
    }, testInfo) => {
      await page.addInitScript(() => {
        type Sample = { event: string; scale: number; width: number };
        const observed = window as typeof window & {
          __studioViewportSamples: Sample[];
        };
        observed.__studioViewportSamples = [];
        const sample = (event: Event | string) => {
          observed.__studioViewportSamples.push({
            event: typeof event === "string" ? event : event.type,
            scale: window.visualViewport?.scale ?? 1,
            width: window.visualViewport?.width ?? innerWidth,
          });
        };
        window.visualViewport?.addEventListener("resize", sample);
        window.addEventListener("pageshow", sample);
        window.addEventListener("load", sample);
        document.addEventListener("DOMContentLoaded", sample);
        document.addEventListener("focusin", sample);
        sample("initial");
      });
      const f = await fixture(page, "draft", true);
      const path =
        destination === "formulaire"
          ? "/studio/configuration?nouvelle=1"
          : "/studio/configuration?campagne=" +
            f.campaigns[1].id +
            "&canal=facebook";
      const ready = () =>
        destination === "formulaire"
          ? expect(
              page.getByLabel("Nom de campagne", { exact: true }),
            ).toBeVisible()
          : expect(
              page.getByLabel("Texte de Beta annonce", { exact: true }),
            ).toBeVisible();
      async function checkViewport(stage: string, noEditableFocus = true) {
        await ready();
        // Two frames allow layout to settle; listeners retain any transient zoom.
        const observation = await page.evaluate(async () => {
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          const observed = window as typeof window & {
            __studioViewportSamples: {
              event: string;
              scale: number;
              width: number;
            }[];
          };
          const result = {
            scale: visualViewport?.scale ?? 1,
            visualWidth: visualViewport?.width ?? innerWidth,
            innerWidth,
            scrollWidth: document.documentElement.scrollWidth,
            editableFocus: !!document.activeElement?.matches(
              'textarea,select,[contenteditable="true"],input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"])',
            ),
            samples: observed.__studioViewportSamples,
          };
          observed.__studioViewportSamples = [];
          return result;
        });
        await testInfo.attach(stage, {
          body: JSON.stringify(observation),
          contentType: "application/json",
        });
        expect(observation.scale, stage).toBeCloseTo(1, 2);
        expect(observation.visualWidth, stage).toBeCloseTo(
          observation.innerWidth,
          0,
        );
        expect(observation.innerWidth, stage).toBe(390);
        expect(observation.scrollWidth, stage).toBeLessThanOrEqual(390);
        expect(
          Math.max(...observation.samples.map((sample) => sample.scale), 1),
          stage,
        ).toBeLessThanOrEqual(1.01);
        if (noEditableFocus)
          expect(observation.editableFocus, stage).toBe(false);
      }
      await page.goto(base + path);
      await checkViewport("arrivée directe");
      await page.reload();
      await checkViewport("rechargement");
      await page.goto(base + "/studio");
      await expect(
        page.getByRole("heading", { name: "Vos campagnes", exact: true }),
      ).toBeVisible();
      if (destination === "formulaire")
        await page
          .getByRole("link", { name: "Créer votre campagne", exact: true })
          .tap();
      else await page.getByRole("link", { name: /Beta/ }).tap();
      await checkViewport("navigation depuis accueil");
      await page.goBack();
      await expect(
        page.getByRole("heading", { name: "Vos campagnes", exact: true }),
      ).toBeVisible();
      await page.goForward();
      await checkViewport("historique sans édition");
      const field =
        destination === "formulaire"
          ? page.getByLabel("Nom de campagne", { exact: true })
          : page.getByLabel("Texte de Beta annonce", { exact: true });
      await field.tap();
      await checkViewport("champ touché volontairement", false);
      await page.goBack();
      await expect(
        page.getByRole("heading", { name: "Vos campagnes", exact: true }),
      ).toBeVisible();
      await page.goForward();
      // History may legitimately restore the field the user focused earlier.
      await checkViewport("historique après focus volontaire", false);
    });
  }
});

test("statut tableau : compléter le dernier champ rend prête avant et après sauvegarde", async ({
  page,
}) => {
  const f = await fixture(page, "draft", true);
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=facebook",
  );
  await expect(
    page.getByRole("cell", { name: "À compléter", exact: true }),
  ).toBeVisible();
  const release = f.hold("edit");
  try {
    await page
      .getByLabel("Texte de Beta annonce", { exact: true })
      .fill("Texte final de l’annonce");
    await expect(
      page.getByRole("cell", { name: "Prête", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(/1 annonce · 1 prête à envoyer/, { exact: false }),
    ).toBeVisible();
  } finally {
    release();
  }
  await expect
    .poll(() => f.campaigns[1].ads[0].copy)
    .toBe("Texte final de l’annonce");
  await page
    .getByRole("heading", { name: "Compléter les annonces", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("cell", { name: "Prête", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Envoyer Beta annonce", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "À valider", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/1 annonce · 1 à valider/, { exact: false }),
  ).toBeVisible();
});

test("statut tableau : annonces complètes déjà envoyées sont comptées à valider", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const f = await fixture(page, "pending");
  let c = f.campaigns[1];
  for (const name of ["Deuxième annonce", "Troisième annonce"]) {
    c = addAd(c, "google", "search", actor, now);
    Object.assign(c.ads.at(-1)!, {
      name,
      status: "pending",
      headlines: ["Titre un", "Titre deux", "Titre trois"],
      descriptions: ["Description un", "Description deux"],
    });
  }
  f.campaigns[1] = c;
  await page.goto(
    base + "/studio/configuration?campagne=" + c.id + "&canal=google",
  );
  await expect(
    page.getByRole("cell", { name: "À valider", exact: true }),
  ).toHaveCount(3);
  await expect(
    page.getByText(/3 annonces · 3 à valider/, { exact: false }),
  ).toBeVisible();
  await expect(page.getByText(/0 prête/, { exact: false })).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("mobile-annonces-a-valider.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Envoyer les annonces prêtes", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "déjà envoyées en validation" }),
  ).toBeVisible();
  expect(
    f.commands.filter((command) => command.type === "submit"),
  ).toHaveLength(0);
});

test("statut tableau : correction prête reste à renvoyer et annonce pending reste à valider", async ({
  page,
}) => {
  const f = await fixture(page, "changes_requested", true);
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=facebook",
  );
  await page
    .getByLabel("Texte de Beta annonce", { exact: true })
    .fill("Texte corrigé");
  await expect.poll(() => f.campaigns[1].ads[0].copy).toBe("Texte corrigé");
  await expect(
    page.getByRole("cell", { name: "À modifier", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/1 annonce · 1 prête à envoyer/, { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Envoyer les annonces prêtes", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "À valider", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Texte de Beta annonce", { exact: true })
    .fill("Texte ajusté encore");
  await expect
    .poll(() => f.campaigns[1].ads[0].copy)
    .toBe("Texte ajusté encore");
  await expect(
    page.getByRole("cell", { name: "À valider", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/1 annonce · 1 à valider/, { exact: false }),
  ).toBeVisible();
});

test("statut tableau : résumé mixte sépare prête, incomplète et déjà envoyée", async ({
  page,
}, testInfo) => {
  const f = await fixture(page, "draft");
  let c = addAd(f.campaigns[1], "google", "search", actor, now);
  c.ads[1].name = "À compléter";
  c = addAd(c, "google", "search", actor, now);
  Object.assign(c.ads[2], {
    name: "Déjà envoyée",
    status: "pending",
    headlines: ["Titre un", "Titre deux", "Titre trois"],
    descriptions: ["Description un", "Description deux"],
  });
  f.campaigns[1] = c;
  await page.goto(
    base + "/studio/configuration?campagne=" + c.id + "&canal=google",
  );
  await expect(
    page.getByText(
      "3 annonces · 1 prête à envoyer · 1 à compléter · 1 à valider",
      { exact: true },
    ),
  ).toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("desktop-statuts-mixtes.png"),
    fullPage: true,
  });
});

for (const width of [1440, 390]) {
  test.describe(`Aperçus On air ${width}px`, () => {
    test.use({ isMobile: width === 390, hasTouch: width === 390 });
    test(`On air : Google affiche l’annonce Search entière à ${width}px`, async ({
      page,
    }, testInfo) => {
      const f = await fixture(page, "on_air");
      Object.assign(f.campaigns[1].ads[0], {
        url: "https://example.test/",
        path1: "facturation",
        path2: "conversation",
      });
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base + "/studio/on-air?campagne=" + f.campaigns[1].id);
      const board = page.getByRole("region", {
        name: "Google SEM",
        exact: true,
      });
      const tile = board.getByRole("button", {
        name: "Ouvrir Beta annonce · Beta",
        exact: true,
      });
      await expect(tile).toContainText("Titre un | Titre deux | Titre trois");
      await expect(tile).toContainText("Description un");
      await expect(tile).toContainText("Marque test");
      await expect(tile).toContainText(
        "https://example.test/facturation/conversation",
      );
      await expect(tile.locator("button,a,input,select")).toHaveCount(0);
      await page.screenshot({
        path: testInfo.outputPath(`search-onair-${width}.png`),
        fullPage: true,
      });
      await tile.click();
      await expect(
        page.getByRole("dialog", { name: "Détail de l’annonce", exact: true }),
      ).toContainText("Titre un");
    });

    test(`On air : vidéos YouTube TikTok chargent seulement leur miniature à ${width}px`, async ({
      page,
    }, testInfo) => {
      const f = await fixture(page, "on_air");
      await page.setViewportSize({ width, height: 900 });
      let c = f.campaigns[1];
      c.ads = [];
      for (const [channel, format] of [
        ["youtube", "instream"],
        ["tiktok", "vertical"],
      ] as const) {
        c = addAd(c, channel, format, actor, now);
        const ad = c.ads.at(-1)!;
        Object.assign(ad, {
          name: "Vidéo " + channel,
          status: "on_air",
          mediaId: "video-" + channel,
          copy: "Message vidéo",
        });
        c.media.push({
          id: "video-" + channel,
          name: "video-" + channel + ".mp4",
          path: "video-" + channel + ".mp4",
          channel,
          mime: "video/mp4",
          bytes: 3200,
          width: 640,
          height: 360,
          duration: 2,
          state: "ready",
          errors: [],
        });
        f.setMediaUrl("video-" + channel, base + "/__ux-video.mp4");
        f.setThumbnailUrl(
          "video-" + channel,
          base + "/deck-demo/cu-generique-square.jpg",
        );
      }
      let videoRequests = 0;
      page.on("request", (request) => {
        if (request.url().includes("/__ux-video.mp4")) videoRequests++;
      });
      f.campaigns[1] = c;
      await page.goto(base + "/studio/on-air?campagne=" + c.id);
      for (const label of ["YouTube", "TikTok"]) {
        const board = page.getByRole("region", { name: label, exact: true });
        await expect(board).toBeVisible();
        await expect(board.locator("video")).toHaveCount(0);
        const poster = board.locator("button img");
        await expect(poster).toBeVisible();
        await expect
          .poll(() =>
            poster.evaluate((el: HTMLImageElement) => el.naturalWidth),
          )
          .toBeGreaterThan(0);
      }
      expect(videoRequests).toBe(0);
      await page.screenshot({
        path: testInfo.outputPath(`videos-onair-${width}.png`),
        fullPage: true,
      });
      await page
        .getByRole("button", {
          name: "Ouvrir Vidéo youtube · Beta",
          exact: true,
        })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Détail de l’annonce",
        exact: true,
      });
      const player = dialog.locator("video");
      await expect(player).toBeVisible();
      expect(
        await player.evaluate(
          (el: HTMLVideoElement) => el.controls && el.playsInline,
        ),
      ).toBe(true);
      await player.evaluate((el: HTMLVideoElement) => el.play());
      await expect
        .poll(() => player.evaluate((el: HTMLVideoElement) => el.paused))
        .toBe(false);
      await player.evaluate((el: HTMLVideoElement) => el.pause());
    });
  });
}

for (const brokenThumbnail of [false, true]) {
  test(`vidéo ${brokenThumbnail ? "miniature expirée" : "historique sans miniature"} ne charge jamais l’original en grille`, async ({
    page,
  }) => {
    const f = await fixture(page, "on_air");
    let c = f.campaigns[1];
    c.ads = [];
    c = addAd(c, "youtube", "instream", actor, now);
    Object.assign(c.ads[0], {
      name: "Historique",
      status: "on_air",
      mediaId: "legacy",
    });
    c.media.push({
      id: "legacy",
      path: "legacy",
      name: "legacy.mp4",
      mime: "video/mp4",
      bytes: 3286,
      width: 640,
      height: 360,
      duration: 2,
      channel: "youtube",
      state: "ready",
      errors: [],
    });
    f.setMediaUrl("legacy", base + "/__ux-video.mp4");
    if (brokenThumbnail) {
      f.setThumbnailUrl("legacy", base + "/__missing-poster.jpg");
      await page.route("**/__missing-poster.jpg", (route) =>
        route.fulfill({ status: 403, body: "Expired" }),
      );
    }
    f.campaigns[1] = c;
    let originalRequests = 0;
    page.on("request", (request) => {
      if (request.url().includes("/__ux-video.mp4")) originalRequests++;
    });
    await page.goto(base + "/studio/on-air?campagne=" + c.id);
    const tile = page.getByRole("button", {
      name: "Ouvrir Historique · Beta",
      exact: true,
    });
    await expect(tile).toContainText("Aperçu vidéo indisponible");
    await expect(tile.locator("video")).toHaveCount(0);
    await expect(tile.locator("img")).toHaveCount(0);
    expect(originalRequests).toBe(0);
    await tile.click();
    await expect(page.getByRole("dialog").locator("video")).toBeVisible();
  });
}

for (const channel of ["google", "facebook"] as const) {
  test(`survol On air ${channel} : zoom doux réversible sans contour ni déplacement`, async ({
    page,
  }, testInfo) => {
    const f = await fixture(page, "on_air", channel === "facebook");
    if (channel === "facebook")
      f.setMediaUrl("ready-media", "/deck-demo/cu-generique-square.jpg");
    await page.goto(base + "/studio/on-air?campagne=" + f.campaigns[1].id);
    const tile = page.getByRole("button", {
      name: "Ouvrir Beta annonce · Beta",
      exact: true,
    });
    if (channel === "facebook") {
      const image = tile.locator("img");
      await expect(image).toHaveAttribute(
        "src",
        "/deck-demo/cu-generique-square.jpg",
      );
      await expect
        .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
        .toBeGreaterThan(0);
    }
    const layout = () =>
      tile.evaluate((el: HTMLElement) => ({
        width: el.offsetWidth,
        height: el.offsetHeight,
        left: el.offsetLeft,
        top: el.offsetTop,
        parentHeight: el.parentElement?.offsetHeight,
      }));
    const before = await layout();
    await expect(tile).toHaveCSS("transform", "none");
    await tile.hover();
    await expect(tile).toHaveCSS("transform", "matrix(1.02, 0, 0, 1.02, 0, 0)");
    await expect(tile).toHaveCSS("transition-duration", "0.22s");
    await expect(tile).toHaveCSS(
      "transition-timing-function",
      "cubic-bezier(0.22, 1, 0.36, 1)",
    );
    await expect(tile).toHaveCSS("box-shadow", "none");
    expect(await layout()).toEqual(before);
    await page.screenshot({
      path: testInfo.outputPath(`hover-${channel}.png`),
    });
    await page.mouse.move(0, 0);
    await expect(tile).toHaveCSS("transform", "none");
    await expect(tile).toHaveCSS("box-shadow", "none");
    expect(await layout()).toEqual(before);
  });

  test(`survol On air ${channel} : réduction des animations respectée`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const f = await fixture(page, "on_air", channel === "facebook");
    if (channel === "facebook")
      f.setMediaUrl("ready-media", "/deck-demo/cu-generique-square.jpg");
    await page.goto(base + "/studio/on-air?campagne=" + f.campaigns[1].id);
    const tile = page.getByRole("button", {
      name: "Ouvrir Beta annonce · Beta",
      exact: true,
    });
    await tile.hover();
    await expect(tile).toHaveCSS("transform", "none");
    await expect(tile).toHaveCSS("transition-duration", "0s");
    await expect(tile).toHaveCSS("box-shadow", "none");
  });
}

test.describe("interaction tactile On air", () => {
  test.use({
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  test("une tuile Google ne conserve pas de contour de survol au toucher", async ({
    page,
  }, testInfo) => {
    const f = await fixture(page, "on_air");
    await page.goto(base + "/studio/on-air?campagne=" + f.campaigns[1].id);
    const tile = page.getByRole("button", {
      name: "Ouvrir Beta annonce · Beta",
      exact: true,
    });
    await tile.tap();
    await expect(
      page.getByRole("dialog", { name: "Détail de l’annonce", exact: true }),
    ).toBeVisible();
    await expect(tile).toHaveCSS("box-shadow", "none");
    await page
      .getByRole("button", { name: "Fermer", exact: true })
      .tap({ timeout: 10000 });
    await expect(tile).toHaveCSS("box-shadow", "none");
    await expect(tile).toHaveCSS("outline-style", "none");
    await expect(tile).toHaveCSS("transform", "none");
    await page.screenshot({ path: testInfo.outputPath("touch-after.png") });
  });
});

test("tuile On air conserve le focus clavier sans contour", async ({
  page,
}) => {
  const f = await fixture(page, "on_air");
  await page.goto(base + "/studio/on-air?campagne=" + f.campaigns[1].id);
  const tile = page.getByRole("button", {
    name: "Ouvrir Beta annonce · Beta",
    exact: true,
  });
  await page.keyboard.press("Tab");
  await tile.focus();
  await expect(tile).toBeFocused();
  expect(await tile.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
  await expect(tile).toHaveCSS("outline-style", "none");
});

for (const width of [1440, 390]) {
  test.describe(`logos officiels ${width}px`, () => {
    test.use({
      isMobile: width === 390,
      hasTouch: width === 390,
      viewport: { width, height: 900 },
    });
    test("canaux et artboards affichent les assets officiels sans recoloration", async ({
      page,
    }, testInfo) => {
      const f = await fixture(page, "on_air");
      const c = f.campaigns[1];
      c.channels = [
        "facebook",
        "instagram",
        "youtube",
        "tiktok",
        "google",
        "display",
      ];
      await page.goto(
        base + `/studio/configuration?campagne=${c.id}&etape=channels`,
      );
      const expected = {
        facebook: "facebook.png",
        instagram: "instagram.svg",
        youtube: "youtube-mono.png",
        tiktok: "tiktok.png",
        google: "google-ads.svg",
      };
      for (const [channel, file] of Object.entries(expected)) {
        const logo = page.locator(`img[data-channel-icon="${channel}"]`);
        await expect(logo).toHaveAttribute("src", `/brands/channels/${file}`);
        await expect(logo).toHaveCSS("filter", "none");
        await expect
          .poll(() =>
            logo.evaluate((img: HTMLImageElement) => img.naturalWidth),
          )
          .toBeGreaterThan(0);
      }
      await page.goto(base + `/studio/on-air?campagne=${c.id}`);
      for (const [channel, file] of Object.entries({
        ...expected,
        youtube: "youtube.png",
        google: "google.svg",
      })) {
        const logo = page.locator(
          `section header img[data-channel-icon="${channel}"]`,
        );
        await expect(logo).toHaveAttribute("src", `/brands/channels/${file}`);
        await expect
          .poll(() =>
            logo.evaluate((img: HTMLImageElement) => img.naturalWidth),
          )
          .toBeGreaterThan(0);
      }
      await page.screenshot({
        path: testInfo.outputPath(`logos-${width}.png`),
        fullPage: true,
      });
      await page
        .getByRole("button", {
          name: "Ouvrir Beta annonce · Beta",
          exact: true,
        })
        .click();
      const wordmark = page.getByRole("dialog").locator('img[alt="Google"]');
      await expect(wordmark).toHaveAttribute(
        "src",
        "/brands/channels/google-wordmark.png",
      );
      await expect
        .poll(() =>
          wordmark.evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBe(272);
    });
  });
}

for (const width of [1440, 390]) {
  test.describe(`visuels seuls On air ${width}px`, () => {
    test.use({
      isMobile: width === 390,
      hasTouch: width === 390,
      viewport: { width, height: 900 },
    });
    test("ratios réels, aucun fond ni cadre et dimensions Display avec GIF animé", async ({
      page,
    }, testInfo) => {
      const f = await fixture(page, "on_air");
      let c = f.campaigns[1];
      c.ads = [];
      const specimens = [
        {
          channel: "facebook",
          format: "square",
          width: 1080,
          height: 1080,
          file: "/deck-demo/cu-generique-square.jpg",
          mime: "image/jpeg",
        },
        {
          channel: "instagram",
          format: "portrait",
          width: 1080,
          height: 1350,
          file: "/deck-demo/cu-generique-portrait.jpg",
          mime: "image/jpeg",
        },
        {
          channel: "display",
          format: "rectangle",
          width: 300,
          height: 250,
          file: "/__animated-banner.gif",
          mime: "image/gif",
        },
        {
          channel: "display",
          format: "billboard",
          width: 970,
          height: 250,
          file: "/deck-demo/cu-970x250.gif",
          mime: "image/gif",
        },
      ] as const;
      await page.route("**/__animated-banner.gif", (route) =>
        route.fulfill({
          path: "tests/studio/fixtures/animated-300x250.gif",
          contentType: "image/gif",
        }),
      );
      for (const [i, item] of specimens.entries()) {
        c = addAd(c, item.channel, item.format, actor, now);
        Object.assign(c.ads.at(-1)!, {
          name: "Format " + i,
          status: "on_air",
          mediaId: "format-" + i,
        });
        c.media.push({
          id: "format-" + i,
          path: "format-" + i,
          name: "format-" + i,
          mime: item.mime,
          bytes: 5000,
          width: item.width,
          height: item.height,
          duration: null,
          channel: item.channel,
          state: "ready",
          errors: [],
        });
        f.setMediaUrl("format-" + i, base + item.file);
      }
      f.campaigns[1] = c;
      await page.goto(base + "/studio/on-air?campagne=" + c.id);
      for (const [i, item] of specimens.entries()) {
        const tile = page.getByRole("button", {
          name: `Ouvrir Format ${i} · Beta`,
          exact: true,
        });
        const img = tile.locator("img");
        await expect(img).toHaveAttribute("src", base + item.file);
        await expect
          .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
          .toBe(item.width);
        const surface = img.locator("..");
        await expect(surface).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await expect(tile).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await expect(tile).toHaveCSS("border-radius", "0px");
        await expect(tile).toHaveCSS("padding", "0px");
        await expect(tile).toHaveCSS("border-width", "0px");
        const box = await surface.boundingBox();
        expect(box!.width / box!.height).toBeCloseTo(
          item.width / item.height,
          2,
        );
        const imageBox = await img.boundingBox();
        expect(imageBox!.width).toBeCloseTo(box!.width, 1);
        expect(imageBox!.height).toBeCloseTo(box!.height, 1);
        if (item.channel === "display") {
          const dimensions = tile.getByText(`${item.width} X ${item.height}`, {
            exact: true,
          });
          await expect(dimensions).toBeVisible();
          await expect(dimensions).toHaveCSS("text-align", "center");
          const caption = await dimensions.boundingBox();
          expect(caption!.y).toBeGreaterThanOrEqual(
            imageBox!.y + imageBox!.height,
          );
        }
      }
      const gif = page
        .getByRole("button", { name: "Ouvrir Format 2 · Beta", exact: true })
        .locator("img");
      const first = (await gif.screenshot()).toString("base64");
      await expect
        .poll(async () => (await gif.screenshot()).toString("base64"), {
          timeout: 4000,
        })
        .not.toBe(first);
      await page.screenshot({
        path: testInfo.outputPath(`visuels-seuls-${width}.png`),
        fullPage: true,
      });
      await page
        .getByRole("button", {
          name: "Ouvrir Format 1 · Beta",
          exact: true,
        })
        .click();
      const detailImage = page
        .getByRole("dialog")
        .locator('img[src$="cu-generique-portrait.jpg"]');
      await expect(detailImage).toBeVisible();
      await expect(detailImage.locator("..")).toHaveCSS(
        "background-color",
        "rgba(0, 0, 0, 0)",
      );
    });
  });
}

test("profil validateur : accueil et URL directe n’exposent pas la création", async ({
  page,
}) => {
  const f = await validatorFixture(page);
  f.campaigns[1].ads[0].status = "on_air";
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Vos campagnes" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Navigation du studio" })
      .getByRole("link", { name: "Configuration", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Créer votre campagne", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link").filter({ hasText: "Alpha" }),
  ).toHaveAttribute("href", /\/studio\/validation\?/);
  await expect(
    page.getByRole("link").filter({ hasText: "Beta" }),
  ).toHaveAttribute("href", /\/studio\/on-air\?/);
  await page
    .getByRole("button", { name: "Partager la campagne Beta", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Copier le lien", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Fermer", exact: true })
    .click();
  f.campaigns[1].ads[0].status = "approved";
  await page.reload();
  await expect(
    page.getByRole("link").filter({ hasText: "Beta" }),
  ).toHaveAttribute("href", /\/studio\/validation\?.*statut=approved/);
  await expect(
    page.getByRole("link").filter({ hasText: "Beta" }),
  ).toContainText("Validée");
  f.campaigns[1].status = "finished";
  await page.reload();
  await expect(
    page.getByRole("link").filter({ hasText: "Beta" }),
  ).toHaveAttribute("href", /\/studio\/terminees\?/);
  await page.addInitScript(() => {
    (window as Window & { sawTable?: boolean }).sawTable = false;
    new MutationObserver(() => {
      if (document.querySelector("table"))
        (window as Window & { sawTable?: boolean }).sawTable = true;
    }).observe(document, { childList: true, subtree: true });
  });
  await page.goto(
    base +
      `/studio/configuration?campagne=${f.campaigns[0].id}&nouvelle=1&etape=editor`,
  );
  await expect(page).toHaveURL(
    new RegExp(`/studio/validation\\?campagne=${f.campaigns[0].id}`),
  );
  expect(
    await page.evaluate(
      () => (window as Window & { sawTable?: boolean }).sawTable,
    ),
  ).toBe(false);
  await expect(page.getByLabel("Nom de campagne", { exact: true })).toHaveCount(
    0,
  );
});

test("préparateur partage un lien de validation authentifiée propre et filtré", async ({
  page,
  context,
  browserName,
}, testInfo) => {
  if (browserName === "webkit") {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      let clipboard = "";
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            clipboard = value;
          },
          readText: async () => clipboard,
        },
      });
    });
  } else {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  }
  const f = await fixture(page);
  f.setActor({ ...actor, role: "preparer" });
  let c = addAd(f.campaigns[1], "facebook", "reel", actor, now);
  Object.assign(c.ads.at(-1)!, {
    name: "Vidéo à valider",
    status: "pending",
    copy: "Message vidéo",
    mediaId: "pending-video",
  });
  c.media.push({
    id: "pending-video",
    name: "video.mp4",
    path: "private-video",
    mime: "video/mp4",
    bytes: 3286,
    width: 1080,
    height: 1920,
    duration: 2,
    channel: "facebook",
    state: "ready",
    errors: [],
  });
  for (const status of ["approved", "on_air", "draft"] as const) {
    c = addAd(c, "facebook", "reel", actor, now);
    Object.assign(c.ads.at(-1)!, {
      name: "Vidéo " + status,
      status,
      copy: "Déjà traitée",
      mediaId: "pending-video",
    });
  }
  f.campaigns[1] = c;
  f.setMediaUrl("pending-video", base + "/__ux-video.mp4");
  f.setThumbnailUrl(
    "pending-video",
    base + "/deck-demo/cu-generique-vertical.jpg",
  );

  await page.goto(
    base +
      `/studio/configuration?campagne=${f.campaigns[1].id}&etape=editor&canal=google&q=parasite`,
  );
  await page
    .getByRole("button", { name: "Partager la campagne Beta", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByText("Connexion requise", { exact: false }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Créer le lien public", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("partage-validation.png"),
    fullPage: true,
  });
  await dialog
    .getByRole("button", { name: "Copier le lien", exact: true })
    .click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const url = new URL(link);
  expect(url.pathname).toBe("/studio/validation");
  expect(Object.fromEntries(url.searchParams)).toEqual({
    campagne: f.campaigns[1].id,
    statut: "pending",
  });
  await dialog
    .getByLabel("Annonces à partager", { exact: true })
    .selectOption("video");
  await dialog
    .getByRole("button", { name: "Copier le lien", exact: true })
    .click();
  expect(
    new URL(
      await page.evaluate(() => navigator.clipboard.readText()),
    ).searchParams.has("media"),
  ).toBe(true);
  expect(
    f.commands.some((command) => command.type === "create_share_link"),
  ).toBe(false);
  await dialog.getByRole("button", { name: "Fermer", exact: true }).click();
  f.setActor(actor);
  await page.evaluate(() => localStorage.clear());
  await context.clearCookies();
  await page.goto(await page.evaluate(() => navigator.clipboard.readText()));
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
  await page
    .getByLabel("E-mail", { exact: true })
    .fill("validator@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Vidéos uniquement ×", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.locator('article[data-channel="facebook"]')).toContainText(
    "Message vidéo",
  );
  await expect(page.locator('article[data-channel="google"]')).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Modifier et valider", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", {
      name: "Demander une modification",
      exact: true,
    }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.getByRole("button", { name: "Approuver", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(0);
  expect(
    f.campaigns[1].ads.find((ad) => ad.name === "Vidéo à valider")?.status,
  ).toBe("approved");
  expect(f.campaigns[1].ads[0].status).toBe("pending");
  await page
    .getByRole("button", { name: "Vidéos uniquement ×", exact: true })
    .click();
  await expect(page.locator('article[data-channel="google"]')).toHaveCount(1);
});

test("tableau V1 : statut en pilule et aucun contour dans le login", async ({
  page,
}) => {
  const f = await fixture(page, "pending", false, false, async (login) => {
    const email = login.getByLabel("E-mail", { exact: true });
    await email.focus();
    await expect(email).toHaveCSS("outline-style", "none");
    await expect(email).toHaveCSS("box-shadow", "none");
  });
  await page.goto(
    base +
      "/studio/configuration?campagne=" +
      f.campaigns[1].id +
      "&canal=google",
  );
  const pill = page.locator('tbody [data-status="pending"]');
  await expect(pill).toHaveText("À valider");
  await expect(pill).toHaveCSS("border-radius", "999px");
  const field = page.getByLabel("Thématique de Beta annonce", { exact: true });
  await field.focus();
  await expect(field).toHaveCSS("outline-style", "none");
  expect(
    await page
      .locator("thead th")
      .evaluateAll((cells) =>
        cells.every((cell) => cell.scrollWidth <= cell.clientWidth + 1),
      ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/studio-editor-pills-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/studio-editor-pills-mobile.png",
    fullPage: true,
  });
});

test("tableau V1 : glisser une ligne en ligne vers le bas persiste son ordre", async ({
  page,
}) => {
  const f = await fixture(page, "on_air");
  const c = addAd(f.campaigns[1], "google", "search", actor, now);
  c.ads[1].name = "Deuxième annonce";
  f.campaigns[1] = c;
  await page.goto(
    base + "/studio/configuration?campagne=" + c.id + "&canal=google",
  );
  const handle = page.getByRole("button", {
    name: "Déplacer Beta annonce",
    exact: true,
  });
  await expect(handle).toBeEnabled();
  const target = page.locator("tr[data-ad-row]").nth(1);
  await handle.dragTo(target, { targetPosition: { x: 50, y: 42 } });
  await expect
    .poll(() => f.campaigns[1].ads.map((a) => a.name))
    .toEqual(["Deuxième annonce", "Beta annonce"]);
  await page.reload();
  await expect(page.locator("tr[data-ad-row]").last()).toHaveAttribute(
    "data-ad-row",
    c.ads[0].id,
  );
});

test("tableau V1 : supprimer une annonce puis une sélection sans supprimer les médias", async ({
  page,
}) => {
  const f = await fixture(page, "draft", true);
  let c = f.campaigns[1];
  c = addAd(c, "facebook", "square", actor, now);
  c.ads[1].name = "Deuxième";
  c = addAd(c, "facebook", "square", actor, now);
  c.ads[2].name = "Troisième";
  f.campaigns[1] = c;
  await page.goto(
    base + "/studio/configuration?campagne=" + c.id + "&canal=facebook",
  );
  page.once("dialog", (d) => d.dismiss());
  await page
    .getByRole("button", { name: "Supprimer Beta annonce", exact: true })
    .click();
  await expect(page.locator("tr[data-ad-row]")).toHaveCount(3);
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Supprimer Beta annonce", exact: true })
    .click();
  await expect(page.locator("tr[data-ad-row]")).toHaveCount(2);
  await page
    .getByRole("checkbox", { name: "Sélectionner Deuxième", exact: true })
    .check();
  await page
    .getByRole("checkbox", { name: "Sélectionner Troisième", exact: true })
    .check();
  page.once("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "Supprimer la sélection", exact: true })
    .click();
  await expect(page.locator("tr[data-ad-row]")).toHaveCount(0);
  expect(f.campaigns[1].media).toHaveLength(1);
  expect(f.commands.filter((c) => c.type === "delete_ads")).toHaveLength(2);
});

test("tableau V1 : gabarits CSV et Excel, erreurs explicites et import de brouillons", async ({
  page,
}) => {
  const f = await fixture(page, "pending");
  const c = f.campaigns[1];
  await page.goto(
    base + "/studio/configuration?campagne=" + c.id + "&canal=google",
  );
  await page
    .getByRole("button", { name: "Importer des annonces", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Importer des annonces",
    exact: true,
  });
  const csvDownload = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Gabarit CSV", exact: true })
    .click();
  const csv = await csvDownload;
  expect(csv.suggestedFilename()).toBe("gabarit-google.csv");
  const headers = (
    await import("../../lib/campaign-studio/workspace/ad-import")
  ).importHeaders("google");
  const file = dialog.getByLabel("Fichier Excel ou CSV");
  await file.setInputFiles({
    name: "invalide.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("Nom;Texte\nNon;Test"),
  });
  await expect(dialog.getByRole("alert")).toContainText("Colonnes incorrectes");
  const ExcelJS = (await import("exceljs")).default;
  const xlsxDownload = page.waitForEvent("download");
  await dialog
    .getByRole("button", { name: "Gabarit Excel", exact: true })
    .click();
  const xlsx = await xlsxDownload;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile((await xlsx.path())!);
  const sheet = workbook.worksheets[0];
  expect((sheet.getRow(1).values as string[]).slice(1)).toEqual(headers);
  sheet.getCell(2, 1).value = "search";
  sheet.getCell(2, 2).value = "Annonce importée";
  sheet.getCell(2, 4).value = "Titre principal";
  sheet.getCell(2, 5).value = "Titre deux";
  sheet.getCell(2, 6).value = "Titre trois";
  sheet.getCell(2, 19).value = "Description une";
  sheet.getCell(2, 20).value = "Description deux";
  await file.setInputFiles({
    name: "annonces.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
  });
  await expect(dialog.getByRole("status")).toHaveText(
    "1 annonce(s) à importer",
  );
  await dialog
    .getByRole("button", { name: "Importer les annonces", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("tr[data-ad-row]")).toHaveCount(2);
  expect(f.campaigns[1].ads[0].status).toBe("pending");
  expect(f.campaigns[1].ads[1].status).toBe("draft");
  expect(f.campaigns[1].ads[1].headlines[0]).toBe("Titre principal");
  await page.reload();
  await expect(page.locator("tr[data-ad-row]")).toHaveCount(2);
  await page
    .getByRole("button", { name: "Importer des annonces", exact: true })
    .click();
  const csvValues = headers.map((header) =>
    header === "Format"
      ? "search"
      : header === "Nom"
        ? "Annonce CSV"
        : header === "Titre 1"
          ? "Titre CSV"
          : "",
  );
  await dialog.getByLabel("Fichier Excel ou CSV").setInputFiles({
    name: "annonces.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(headers.join(";") + "\n" + csvValues.join(";")),
  });
  await expect(dialog.getByRole("status")).toHaveText(
    "1 annonce(s) à importer",
  );
  await dialog
    .getByRole("button", { name: "Importer les annonces", exact: true })
    .click();
  await expect(page.locator("tr[data-ad-row]")).toHaveCount(3);
  expect(f.campaigns[1].ads[2].headlines).toEqual(["Titre CSV"]);
});

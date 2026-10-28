import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { createMediaAds } from "../../lib/campaign-studio/workspace/media-batch";
import { CATALOG, CHANNELS } from "../../lib/campaign-studio/workspace/catalog";
import {
  createCampaign,
  addAd,
} from "../../lib/campaign-studio/workspace/workflow";
import type {
  Actor,
  AdStatus,
} from "../../lib/campaign-studio/workspace/types";

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
    actor,
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
  };
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
    if (url.pathname === "/__ux-video.mp4")
      return route.fulfill({
        path: "tests/studio/fixtures/video-640x360.mp4",
        contentType: "video/mp4",
      });
    if (url.pathname.startsWith("/storage/v1/upload/resumable")) {
      const cors = {
        "Access-Control-Allow-Origin": base,
        "Access-Control-Allow-Methods": "POST,PATCH,HEAD,OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Expose-Headers": "Location,Upload-Offset,Tus-Resumable",
      };
      if (req.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers: cors });
      if (req.method() === "POST")
        return route.fulfill({
          status: 201,
          headers: {
            ...cors,
            Location: url.origin + "/storage/v1/upload/resumable/test",
            "Tus-Resumable": "1.0.0",
            "Upload-Offset": "0",
          },
        });
      return route.fulfill({
        status: 204,
        headers: {
          ...cors,
          "Tus-Resumable": "1.0.0",
          "Upload-Offset": String(req.postDataBuffer()?.length ?? 0),
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
        }
        if (cmd.type === "edit") {
          Object.assign(
            c.ads.find((a) => a.id === cmd.adId)!,
            cmd.fields,
          );
          c.ads.find((a) => a.id === cmd.adId)!.revision++;
          c.revision++;
        }
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
        if (cmd.type === "version" || cmd.type === "duplicate")
          c = addAd(c, "google", "search", actor, now);
        if (cmd.type === "submit") {
          c.ads
            .filter((a) => cmd.adIds.includes(a.id))
            .forEach((a) => (a.status = "pending"));
          result.skipped = [];
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
  await page.getByLabel("E-mail", { exact: true }).fill("audit@example.test");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("test-only-password");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Votre espace de travail" }),
  ).toBeVisible();
  return {
    get campaigns() {
      return data.campaigns;
    },
    empty: () => {
      data.campaigns = [];
    },
    commands,
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
async function openEditor(page: Page, id: string) {
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(id);
  await expect(page.getByRole("article")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Modifier et valider", exact: true })
    .click();
  await expect(page.getByLabel("Titres · un par ligne")).toBeEditable();
}

test("une correction survit à Échap, fermeture, clic extérieur et rechargement", async ({
  page,
}) => {
  const { campaigns } = await fixture(page);
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
  await page.getByRole("button", { name: "Carrousel", exact: true }).click();
  await page.getByLabel("Rechercher une annonce").fill("Beta");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Validées", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
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
  await expect(page.getByLabel("Nom de l’annonce active")).toHaveValue(
    "Alpha annonce",
  );
  await expect(page.getByLabel("Nom de l’annonce active")).not.toHaveValue(
    "Beta annonce",
  );
});

test("double clic et Entrée répétés créent une seule campagne sous 800 ms", async ({
  page,
}) => {
  const f = await fixture(page);
  f.latency(800);
  await page.getByLabel("Nom de la nouvelle campagne").fill("Campagne unique");
  const create = page.getByRole("button", {
    name: "Créer une campagne",
    exact: true,
  });
  await create.dblclick();
  await page.getByLabel("Nom de la nouvelle campagne").press("Enter");
  await expect(page.getByLabel("Campagne à configurer")).toBeVisible();
  expect(f.commands.filter((c) => c.type === "create_campaign")).toHaveLength(
    1,
  );
});

for (const width of [1440, 390, 320]) {
  test(`clavier et modale native à ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    const f = await fixture(page);
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
    expect(outline.style).not.toBe("none");
    expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
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
  await expect(page.getByLabel("Nom de l’annonce active")).toHaveValue(
    "Beta annonce",
  );
  await page.goForward();
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
    page.getByText("Sélectionnez une campagne disponible depuis la Home."),
  ).toBeVisible();
  await expect(page.getByLabel("Nom de l’annonce active")).toHaveCount(0);
});

test("échec de sauvegarde conserve correction, fermeture sûre si stockage indisponible", async ({
  page,
}) => {
  const f = await fixture(page);
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
    .getByText("Choisir des formats ou ajouter des annonces", { exact: true })
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
    .getByRole("button", { name: "Dupliquer", exact: true })
    .first()
    .dblclick();
  await expect(page.getByRole("row")).toHaveCount(4);
  expect(f.commands.filter((c) => c.type === "duplicate")).toHaveLength(1);
  await page
    .getByRole("button", { name: "Dupliquer", exact: true })
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
  const name = page.getByLabel("Nom de la nouvelle campagne");
  await name.fill("Création clavier");
  await name.press("Enter");
  await name.press("Enter");
  await expect(
    page.getByRole("button", { name: "Création…", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Créer une campagne", exact: true }),
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
  await page.getByRole("button", { name: "Envoyer", exact: true }).dblclick();
  await expect(
    page.getByRole("cell", { name: "À valider", exact: true }),
  ).toBeVisible();
  expect(f.commands.filter((c) => c.type === "submit")).toHaveLength(1);
  await page.getByRole("link", { name: "Validation", exact: true }).click();
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
  await expect(page.getByRole("article")).toHaveCount(1);
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
    if (kind === "video") {
      const youtube = page.getByRole("button", { name: /YouTube/ });
      await youtube.click();
      await expect(youtube).toHaveAttribute("aria-pressed", "true");
    }
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
    const media = library.locator(kind === "image" ? "img" : "video");
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
      await media.evaluate((el) => {
        const v = el as HTMLVideoElement;
        v.muted = true;
        return v.play();
      });
      await expect
        .poll(() =>
          media.evaluate((el) => (el as HTMLVideoElement).currentTime),
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
  const f = await fixture(page);
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(f.campaigns[1].id);
  await expect(page.getByRole("article")).toHaveCount(1);
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
  await expect(page.getByLabel("Nom de la nouvelle campagne")).toBeVisible();
  await page
    .getByLabel("Nom de la nouvelle campagne")
    .fill("Première campagne");
  await page.getByLabel("Nom de la nouvelle campagne").press("Enter");
  await expect(page.getByLabel("Campagne à configurer")).toBeVisible();
  expect(f.commands.filter((c) => c.type === "create_campaign")).toHaveLength(
    1,
  );
});

for (const width of [390, 320]) {
  test(`canal actif visible après reload mobile ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
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
  const f = await fixture(page);
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(f.campaigns[1].id);
  await expect(page.getByRole("article")).toHaveCount(1);
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
  await page.getByRole("button", { name: "Créer", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Marque", exact: true }),
  ).toHaveValue("created-brand");
  expect(f.commands.filter((c) => c.type === "create_brand")).toHaveLength(1);
  await expect
    .poll(() => f.campaigns.find((c) => c.name === "Beta")?.brandId)
    .toBe("created-brand");
});

test("vérification média sans invitation à terminer ou revérifier le transfert actif", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.getByRole("link").filter({ hasText: "Beta" }).click();
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
  const f = await fixture(page);
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
  const f = await fixture(page);
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
  const f = await fixture(page);
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
      .getByRole("button", { name: "Beta annonce", exact: true })
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
  const f = await fixture(page);
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page.getByLabel("Filtrer par campagne").selectOption(f.campaigns[1].id);
  await expect(page.getByRole("article")).toHaveCount(1);
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
  const f = await fixture(page);
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
  await page.getByLabel("Nom de la nouvelle campagne").fill("Lot multicanal");
  await page
    .getByRole("button", { name: "Créer une campagne", exact: true })
    .click();
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
  await page.getByLabel("Nom de la nouvelle campagne").fill(name);
  await page
    .getByRole("button", { name: "Créer une campagne", exact: true })
    .click();
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
  await page
    .getByLabel("Nom de la nouvelle campagne")
    .fill("Parcours trois étapes");
  await page
    .getByRole("button", { name: "Créer une campagne", exact: true })
    .click();
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
  await page
    .getByLabel("Nom de la nouvelle campagne")
    .fill("Campagne à compléter");
  await page
    .getByRole("button", { name: "Créer une campagne", exact: true })
    .click();
  const form = page.getByRole("form", {
    name: "Informations de campagne",
    exact: true,
  });
  await form
    .getByLabel("Nom de campagne", { exact: true })
    .fill("Nom conservé après erreur");
  f.fail("campaign", "Enregistrement indisponible.");
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await expect(
    page
      .getByRole("region", { name: "Informations de la campagne", exact: true })
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

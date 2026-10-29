import { test, expect, type Page } from "@playwright/test";
import {
  createCampaign,
  addAd,
} from "../../lib/campaign-studio/workspace/workflow";
import { CATALOG, CHANNELS } from "../../lib/campaign-studio/workspace/catalog";
import type { Actor, Channel } from "../../lib/campaign-studio/workspace/types";
const base = process.env.STUDIO_UX_BASE_URL ?? "http://127.0.0.1:3072";
const actor: Actor = {
  kind: "human",
  id: "11111111-1111-4111-8111-111111111111",
  name: "Test",
  role: "validator",
};
const longCopy =
  "Avec Teccart, développe tes compétences en création et découvre un programme adapté à tes ambitions. 🎓 ".repeat(
    7,
  ) + "FIN DU TEXTE";
async function previewFixture(
  page: Page,
  channel: Channel,
  format: string,
  copy = longCopy,
) {
  const now = new Date().toISOString();
  let campaign = createCampaign("Aperçus", actor, now);
  campaign.brandId = "brand-test";
  campaign.defaultUrl = "https://example.test";
  campaign = addAd(campaign, channel, format, actor, now);
  const ad = campaign.ads[0];
  Object.assign(ad, {
    status: "pending",
    copy,
    headline: "Un programme pour vos ambitions et votre avenir créatif",
    cta: "En savoir plus",
    mediaId: "media-test",
  });
  campaign.media.push({
    id: "media-test",
    name: "visuel.jpg",
    path: "visuel.jpg",
    channel,
    mime: "image/jpeg",
    bytes: 1000,
    width: 1080,
    height: ["story", "reel", "short", "vertical"].includes(format)
      ? 1920
      : 1080,
    duration: null,
    state: "ready",
    errors: [],
  });
  const data = {
    actor,
    brands: [
      {
        id: "brand-test",
        name: "Institut Teccart",
        logo: "",
        website: "https://example.test",
      },
    ],
    campaigns: [campaign],
    members: [],
    agents: [],
    locks: [],
    catalog: CATALOG,
    channels: CHANNELS,
    mediaUrls: { "media-test": base + "/deck-demo/cu-generique-square.jpg" },
  };
  const commands: string[] = [];
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
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
    if (url.pathname === "/api/studio") return route.fulfill({ json: data });
    if (url.pathname === "/api/studio/commands") {
      commands.push(route.request().postDataJSON().type);
      return route.fulfill({ json: { campaign } });
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
    page.getByRole("heading", { name: "Vos campagnes" }),
  ).toBeVisible();
  await page.goto(base + `/studio/validation?campagne=${campaign.id}`);
  const card = page.locator(`[data-workspace-ad="${ad.id}"]`);
  await expect(card).toBeVisible();
  return { card, ad, campaign, commands };
}

for (const width of [390, 1440]) {
  test(`Facebook ${width}: texte replié, Voir plus puis Voir moins sans mutation`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const { card, ad, commands } = await previewFixture(
      page,
      "facebook",
      "square",
    );
    const more = card.getByRole("button", { name: "Voir plus", exact: true });
    await expect(more).toBeVisible();
    await expect(more).toHaveAttribute("aria-expanded", "false");
    await expect(card.getByText(/FIN DU TEXTE/)).toHaveCount(0);
    const copy = card.locator("[data-preview-copy]");
    const box = await copy.boundingBox();
    const line = await copy.evaluate((el) =>
      parseFloat(getComputedStyle(el).lineHeight),
    );
    expect(box!.height).toBeLessThanOrEqual(line * (width === 390 ? 1 : 3) + 1);
    await more.click();
    await expect(card.getByText(longCopy, { exact: true })).toBeVisible();
    await expect(
      card.getByRole("button", { name: "Voir moins", exact: true }),
    ).toHaveAttribute("aria-expanded", "true");
    await card.getByRole("button", { name: "Voir moins", exact: true }).click();
    await expect(more).toBeVisible();
    expect(ad.copy).toBe(longCopy);
    expect(commands).toEqual([]);
    await page.screenshot({
      path: info.outputPath(`facebook-${width}.png`),
      fullPage: true,
    });
  });
}

for (const [channel, format] of [
  ["instagram", "square"],
  ["instagram", "reel"],
  ["facebook", "story"],
  ["tiktok", "vertical"],
] as const) {
  test(`${channel} ${format}: texte borné et lecture intégrale accessible`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const { card } = await previewFixture(page, channel, format);
    const more = card.getByRole("button", { name: "Voir plus", exact: true });
    await expect(more).toBeVisible();
    await expect(card.getByText(/FIN DU TEXTE/)).toHaveCount(0);
    await more.click();
    await expect(card.getByText(longCopy, { exact: true })).toBeVisible();
    await card.getByRole("button", { name: "Voir moins", exact: true }).click();
    await expect(more).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
  });
}

test("Un texte court ne propose pas de faux Voir plus", async ({ page }) => {
  const { card } = await previewFixture(
    page,
    "facebook",
    "square",
    "Bonjour 🎓",
  );
  await expect(card.getByText("Bonjour 🎓", { exact: true })).toBeVisible();
  await expect(
    card.getByRole("button", { name: "Voir plus", exact: true }),
  ).toHaveCount(0);
});

test("Les retours à la ligne déclenchent la troncature même sans texte long", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const { card } = await previewFixture(
    page,
    "facebook",
    "square",
    "Un\nDeux\nTrois\nQuatre",
  );
  await expect(
    card.getByRole("button", { name: "Voir plus", exact: true }),
  ).toBeVisible();
});

for (const format of ["instream", "short"]) {
  test(`YouTube ${format}: description limitée à 90 caractères sans fausse expansion`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    const { card, ad } = await previewFixture(page, "youtube", format);
    const copy = card.locator("[data-preview-copy]");
    await expect(copy).toBeVisible();
    await expect
      .poll(async () => (await copy.innerText()).length)
      .toBeLessThanOrEqual(91);
    await expect(
      card.getByRole("button", { name: "Voir plus", exact: true }),
    ).toHaveCount(0);
    expect(ad.copy).toBe(longCopy);
  });
}

test("Google : 3 titres de 30 caractères, 2 descriptions de 90, source intacte", async ({
  page,
}) => {
  const { card, ad } = await previewFixture(page, "google", "search");
  const longHeadline =
    "Une formation créative pour préparer votre avenir professionnel";
  const longDescription =
    "Découvrez nos formations et rencontrez notre équipe lors des portes ouvertes pour construire votre projet professionnel avec confiance.";
  ad.headlines = Array(15).fill(longHeadline);
  ad.descriptions = Array(4).fill(longDescription);
  await page.reload();
  await expect(card.getByRole("heading")).toHaveText(
    Array(3)
      .fill(longHeadline.slice(0, 29).trimEnd() + "…")
      .join(" | "),
  );
  const descriptions = card.locator("p");
  await expect(descriptions).toHaveCount(2);
  for (const p of await descriptions.all())
    expect((await p.innerText()).length).toBeLessThanOrEqual(90);
  await expect(
    card.getByRole("button", { name: "Voir plus", exact: true }),
  ).toHaveCount(0);
  expect(ad.headlines).toHaveLength(15);
  expect(ad.descriptions[0]).toBe(longDescription);
});

test("La coupure se recalcule au redimensionnement, y compris accents et emojis", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const text = "Créativité 👩🏽‍🎨, formation et avenir : ".repeat(12);
  const { card } = await previewFixture(page, "facebook", "square", text);
  const copy = card.locator("[data-preview-copy]");
  await expect(
    card.getByRole("button", { name: "Voir plus", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  await expect
    .poll(async () =>
      copy.evaluate(
        (el) =>
          el.getBoundingClientRect().height /
          parseFloat(getComputedStyle(el).lineHeight),
      ),
    )
    .toBeLessThanOrEqual(1.05);
  expect(await copy.innerText()).not.toContain("�");
  await card.getByRole("button", { name: "Voir plus", exact: true }).click();
  await expect(card.getByText(text, { exact: true })).toBeVisible();
});

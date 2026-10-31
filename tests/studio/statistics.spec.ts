import { test, expect, type Page } from "@playwright/test";
import { CATALOG, CHANNELS } from "../../lib/campaign-studio/workspace/catalog";

const base = process.env.STUDIO_UX_BASE_URL ?? "http://127.0.0.1:3072";
async function openStatistics(page: Page) {
  const actor = {
    kind: "human",
    id: "11111111-1111-4111-8111-111111111111",
    name: "Test",
    role: "preparer",
  };
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
    if (url.pathname === "/api/studio")
      return route.fulfill({
        json: {
          actor,
          campaigns: [],
          brands: [],
          members: [],
          agents: [],
          locks: [],
          mediaUrls: {},
          catalog: CATALOG,
          channels: CHANNELS,
        },
      });
    if (url.origin === base) return route.continue();
    return route.abort();
  });
  await page.goto(base + "/studio/statistiques");
  await page.getByLabel("E-mail", { exact: true }).fill("audit@example.test");
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill("test-only-password");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
}

test("statistiques connectées : maquette, filtres et classement sans cumul", async ({
  page,
}, info) => {
  const mutations: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("/api/studio/commands")) mutations.push(r.method());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await openStatistics(page);
  const cards = page.getByRole("region", { name: "Chiffres essentiels" });
  await expect(
    cards.getByRole("button", { name: /^Admissions/ }),
  ).toContainText("18");
  await expect(
    cards.getByRole("button", { name: /^Prospects générés/ }),
  ).toContainText("142");
  await expect(
    page.getByText("Données fictives", { exact: true }),
  ).toBeVisible();
  const channels = page.getByRole("table", {
    name: "Performance par canal",
    exact: true,
  });
  const ranking = page.getByRole("table", {
    name: "Classement des campagnes",
    exact: true,
  });
  await expect(channels.locator("tbody tr")).toHaveCount(8);
  await expect(ranking.locator("tbody tr")).toHaveCount(3);
  await expect(ranking.locator("tbody tr").first()).toContainText("AEC hiver");
  const c = await channels.boundingBox(),
    r = await ranking.boundingBox();
  expect(r!.y).toBeGreaterThan(c!.y + c!.height);
  expect(r!.width).toBeLessThan(c!.width);
  const admissions = cards.getByRole("button", { name: /^Admissions/ });
  const tableBefore = (await channels.boundingBox())!.y;
  await admissions.click();
  await expect(admissions).toHaveAttribute("aria-expanded", "true");
  const breakdown = cards.getByRole("region", {
    name: "Détail par canal · Admissions",
    exact: true,
  });
  await expect(breakdown).toBeVisible();
  await breakdown.evaluate((el) =>
    Promise.all(
      el
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    ),
  );
  const lastChannel = await breakdown.locator("dl > div").last().boundingBox();
  const expandedCard = await admissions.locator("..").boundingBox();
  expect(lastChannel!.y + lastChannel!.height).toBeLessThanOrEqual(
    expandedCard!.y + expandedCard!.height,
  );

  await expect(breakdown.locator("dl > div")).toHaveCount(8);
  await expect(breakdown.locator("dl > div").first()).toContainText(
    /Meta Ads.*8/s,
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect
    .poll(async () => (await channels.boundingBox())!.y)
    .toBeGreaterThan(tableBefore + 200);
  await page.screenshot({
    path: info.outputPath("statistics-expanded.png"),
    fullPage: true,
  });
  await admissions.click();
  await expect(admissions).toHaveAttribute("aria-expanded", "false");
  await expect
    .poll(async () => Math.abs((await channels.boundingBox())!.y - tableBefore))
    .toBeLessThan(2);
  for (const label of [
    "Prospects générés",
    "Budget dépensé",
    "Coût par prospect",
    "Conversion en prospects",
  ]) {
    const button = cards.getByRole("button", { name: new RegExp("^" + label) });
    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(
      cards
        .getByRole("region", {
          name: "Détail par canal · " + label,
          exact: true,
        })
        .locator("dl > div"),
    ).toHaveCount(8);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await button.click();
  }
  await channels
    .getByRole("button", { name: "Détail Meta Ads", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("64");
  await page
    .getByRole("button", { name: "Fermer le détail", exact: true })
    .click();
  await page.getByRole("searchbox").fill("YouTube");
  await expect(channels.locator("tbody tr")).toHaveCount(1);
  await expect(channels.locator("tbody")).toContainText("Google Ads");
  await page.getByRole("searchbox").fill("introuvable");
  await expect(channels).toContainText("Aucun canal");
  await page.getByRole("searchbox").fill("");
  await page.getByLabel("Période", { exact: true }).selectOption("day");
  await expect(
    cards.getByRole("button", { name: /^Admissions/ }),
  ).toContainText("2");
  await expect(
    cards.getByRole("button", { name: /^Prospects générés/ }),
  ).toContainText("13");
  await page.getByLabel("Période", { exact: true }).selectOption("all");
  await ranking
    .getByRole("button", { name: "Ouvrir Universel · AEC hiver", exact: true })
    .click();
  await expect(page.getByLabel("Campagne", { exact: true })).toHaveValue("aec");
  await expect(
    cards.getByRole("button", { name: /^Admissions/ }),
  ).toContainText("36");
  await page.getByLabel("Campagne", { exact: true }).selectOption("admissions");
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: info.outputPath("statistics-desktop.png"),
    fullPage: true,
  });
  await page.getByLabel("Campagne", { exact: true }).selectOption("all");
  await expect(cards).toHaveCount(0);
  await expect(channels).toHaveCount(0);
  await expect(ranking).toBeVisible();
  await page.getByRole("searchbox").fill("Portes");
  await expect(ranking.locator("tbody tr")).toHaveCount(1);
  await page.getByRole("searchbox").fill("");
  await page.getByLabel("Campagne", { exact: true }).selectOption("admissions");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(cards).toBeVisible();
  await page.mouse.move(0, 0);
  await page.evaluate(() => {
    (document.activeElement as HTMLElement)?.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({
    path: info.outputPath("statistics-mobile.png"),
    fullPage: true,
  });
  expect(mutations).toEqual([]);
  expect(errors).toEqual([]);
});

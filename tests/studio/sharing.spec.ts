import { test, expect, type Page } from "@playwright/test";
import { CATALOG, CHANNELS } from "../../lib/campaign-studio/workspace/catalog";
import {
  createCampaign,
  addAd,
} from "../../lib/campaign-studio/workspace/workflow";
import type { Actor } from "../../lib/campaign-studio/workspace/types";
const base = process.env.STUDIO_UX_BASE_URL ?? "http://127.0.0.1:3027";
const token = "a".repeat(43);
const actor: Actor = {
  id: "11111111-1111-4111-8111-111111111111",
  kind: "human",
  role: "validator",
  name: "Validation",
};
const campaign = addAd(
  createCampaign("Leyon · Notoriété", actor, new Date().toISOString()),
  "facebook",
  "square",
  actor,
  new Date().toISOString(),
);
campaign.ads[0].copy = "Dites-le. Leyon le facture.";
campaign.ads[0].headline = "Votre facturation par conversation";
campaign.ads[0].cta = "Découvrir";
async function fixture(page: Page) {
  let status: "active" | "revoked" = "revoked";
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
      const access_token =
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
              user,
              access_token,
              refresh_token: "test",
              token_type: "bearer",
              expires_in: 3600,
            },
      });
    }
    if (url.pathname === "/api/studio")
      return route.fulfill({
        json: {
          actor,
          campaigns: [campaign],
          brands: [],
          mediaUrls: {},
          members: [],
          agents: [],
          locks: [],
          catalog: CATALOG,
          channels: CHANNELS,
          shareLinks: [
            { campaign_id: campaign.id, status, created_at: "today" },
          ],
        },
      });
    if (url.pathname === "/api/studio/commands") {
      const command = route.request().postDataJSON();
      status = command.type === "create_share_link" ? "active" : "revoked";
      return route.fulfill({
        json:
          command.type === "create_share_link"
            ? { sharePath: `/partage/${token}` }
            : { revoked: true },
      });
    }
    if (url.pathname === `/api/studio/public/${token}`)
      return route.fulfill({
        status: status === "active" ? 200 : 404,
        json:
          status === "active"
            ? { campaign, brands: [], mediaUrls: {} }
            : { error: "Indisponible" },
      });
    if (url.origin === base) return route.continue();
    return route.abort();
  });
  return {
    activate: () => {
      status = "active";
    },
    revoke: () => {
      status = "revoked";
    },
  };
}
test("validator creates, copies and revokes a campaign link", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await fixture(page);
  await page.goto(base + "/studio");
  await page.getByLabel("E-mail", { exact: true }).fill("audit@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await page
    .getByRole("button", {
      name: `Partager la campagne ${campaign.name}`,
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByLabel("Type de lien", { exact: true })
    .selectOption("presentation");
  await page
    .getByRole("button", { name: "Créer le lien public", exact: true })
    .click();
  await expect(page.getByLabel("Lien public", { exact: true })).toHaveValue(
    base + `/partage/${token}`,
  );
  await page
    .getByRole("button", { name: "Copier le lien", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Lien copié" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    base + `/partage/${token}`,
  );
  await page
    .getByRole("button", { name: "Révoquer le lien", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmer la révocation", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Créer le lien public", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Lien public", { exact: true })).toHaveCount(0);
});
for (const mobile of [false, true])
  test(`public presentation, readonly and revoke refresh (${mobile ? "mobile" : "desktop"})`, async ({
    page,
  }) => {
    if (mobile) await page.setViewportSize({ width: 390, height: 844 });
    const control = await fixture(page);
    control.activate();
    await page.goto(base + `/partage/${token}`);
    await expect(
      page.getByRole("heading", { name: campaign.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Dites-le. Leyon le facture.", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Lecture seule", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".topbar")).toBeHidden();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/share-${mobile ? "mobile" : "desktop"}.png`,
      fullPage: true,
    });
    control.revoke();
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect(
      page.getByRole("heading", {
        name: "Présentation indisponible",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Dites-le. Leyon le facture.", { exact: true }),
    ).toHaveCount(0);
  });

test("public video preview fetches only the revocable thumbnail until playback", async ({
  page,
}) => {
  const c = addAd(
    createCampaign("Vidéo publique", actor, new Date().toISOString()),
    "youtube",
    "instream",
    actor,
    new Date().toISOString(),
  );
  c.ads[0].mediaId = "public-video";
  c.media.push({
    id: "public-video",
    name: "video.mp4",
    path: "private-source",
    mime: "video/mp4",
    bytes: 3286,
    width: 640,
    height: 360,
    duration: 2,
    channel: "youtube",
    state: "ready",
    errors: [],
  });
  let originalRequests = 0;
  await page.route(`**/api/studio/public/${token}`, (route) =>
    route.fulfill({
      json: {
        campaign: c,
        brands: [],
        mediaUrls: {
          "public-video": `/api/studio/public/${token}/media/public-video`,
        },
        thumbnailUrls: {
          "public-video": `/api/studio/public/${token}/media/public-video?thumbnail=1`,
        },
      },
    }),
  );
  await page.route(
    `**/api/studio/public/${token}/media/public-video*`,
    (route) => {
      if (new URL(route.request().url()).searchParams.has("thumbnail"))
        return route.fulfill({
          path: "public/deck-demo/cu-generique-square.jpg",
          contentType: "image/jpeg",
        });
      originalRequests++;
      return route.fulfill({
        path: "tests/studio/fixtures/video-640x360.mp4",
        contentType: "video/mp4",
      });
    },
  );
  await page.goto(base + `/partage/${token}`);
  const play = page.getByRole("button", {
    name: "Lire video.mp4",
    exact: true,
  });
  await expect(play.locator("img")).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  expect(originalRequests).toBe(0);
  await play.click();
  await expect(page.locator("video")).toBeVisible();
  await expect.poll(() => originalRequests).toBeGreaterThan(0);
});

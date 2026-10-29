import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const base = process.env.STUDIO_TEST_BASE_URL ?? "http://127.0.0.1:3002";
test("configuration SEM et validation connectées", async ({ page }) => {
  const users = JSON.parse(await readFile(".env.studio-users.local", "utf8"));
  await page.goto(base + "/studio");
  await page.getByLabel("E-mail", { exact: true }).fill(users[0].email);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill(users[0].password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Vos campagnes" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Créer votre campagne", exact: true })
    .click();
  const campaignName = "Admissions - recette " + Date.now();
  await page.getByLabel("Nom de campagne").fill(campaignName);
  await expect(
    page.getByRole("form", { name: "Informations de campagne", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Créer une marque", exact: true })
    .click();
  await page.getByLabel("Nom", { exact: true }).fill("Marque recette");
  await page
    .getByLabel("Site web", { exact: true })
    .fill("https://example.com");
  await page
    .getByRole("button", { name: "Créer la marque", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Marque", exact: true })
    .selectOption({ label: "Marque recette" });
  await page.locator("summary").filter({ hasText: "Dates et lien" }).click();
  await page.getByLabel("URL commune").fill("https://example.com/admissions");
  await page.getByLabel("URL commune").blur();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page
    .getByRole("group", { name: "Choisir les canaux" })
    .getByRole("button", { name: "Google SEM", exact: true })
    .click();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page.getByLabel(/Annonce responsive Search/).check();
  await page
    .getByRole("button", { name: "Confirmer et compléter les annonces" })
    .click();
  await expect(
    page.getByLabel("Titres · 30 caractères de Nouvelle annonce"),
  ).toBeEditable();
  await page
    .getByLabel("Titres · 30 caractères de Nouvelle annonce")
    .fill("Titre un\nTitre deux\nTitre trois");
  await page
    .getByLabel("Descriptions · 90 caractères de Nouvelle annonce")
    .fill("Description un\nDescription deux");
  await expect(page.getByText("Prête", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Envoyer Nouvelle annonce", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "À valider", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Validation", exact: true }).click();
  await page
    .getByLabel("Filtrer par campagne")
    .selectOption({ label: campaignName });
  await expect(
    page.getByRole("button", { name: "Approuver", exact: true }),
  ).toBeVisible();
  await page.clock.install();
  await page
    .getByRole("button", { name: "Modifier et valider", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Titres · un par ligne")).toBeEditable();
  await page
    .getByLabel("Titres · un par ligne")
    .fill("Titre corrigé\nTitre deux\nTitre trois");
  await page.clock.fastForward(121000);
  await expect(page.getByLabel("Titres · un par ligne")).toBeDisabled();
  await page.getByRole("button", { name: "Reprendre l’édition" }).click();
  await expect(page.getByLabel("Titres · un par ligne")).toBeEditable();
  await expect(page.getByLabel("Titres · un par ligne")).toHaveValue(
    "Titre corrigé\nTitre deux\nTitre trois",
  );
  await page.clock.resume();
  await page
    .getByRole("button", { name: "Enregistrer et valider", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Validées", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Passer On air", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/studio-connected-validation.png",
    fullPage: true,
  });
  await expect(
    page.getByRole("heading", { name: /Titre corrigé/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Passer On air", exact: true })
    .click();
  await page.getByRole("link", { name: "On air", exact: true }).click();
  await page
    .getByLabel("Filtrer par campagne")
    .selectOption({ label: campaignName });
  await page
    .getByRole("button", { name: new RegExp("Ouvrir Nouvelle annonce") })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Créer une nouvelle version",
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: "/tmp/studio-connected-live.png",
    fullPage: true,
  });
});

test("dépôt média, reconnaissance et création de la ligne", async ({
  page,
}) => {
  const users = JSON.parse(await readFile(".env.studio-users.local", "utf8"));
  await page.goto(base + "/studio");
  await page.getByLabel("E-mail", { exact: true }).fill(users[1].email);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill(users[1].password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Vos campagnes" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Créer votre campagne", exact: true })
    .click();
  await page
    .getByLabel("Nom de campagne")
    .fill("Médias - recette " + Date.now());
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page
    .getByRole("group", { name: "Choisir les canaux" })
    .getByRole("button", { name: "Facebook", exact: true })
    .click();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles("public/deck-demo/cu-generique-square.jpg");
  await expect(
    page.getByText("cu-generique-square.jpg", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Créer l’annonce", exact: true })
    .click();
  await expect(page.getByRole("table")).toBeVisible();
  await page.getByRole("button", { name: "Aperçu", exact: true }).click();
  await expect(page.getByLabel("Média de Nouvelle annonce")).not.toHaveValue(
    "",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "/tmp/studio-connected-configuration.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.screenshot({
    path: "/tmp/studio-connected-mobile.png",
    fullPage: true,
  });
});

test("vidéo finale transférée directement et reconnue", async ({ page }) => {
  const users = JSON.parse(await readFile(".env.studio-users.local", "utf8"));
  await page.goto(base + "/studio");
  await page.getByLabel("E-mail", { exact: true }).fill(users[1].email);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill(users[1].password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await page
    .getByRole("link", { name: "Créer votre campagne", exact: true })
    .click();
  await page
    .getByLabel("Nom de campagne")
    .fill("Vidéo - recette " + Date.now());
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page
    .getByRole("group", { name: "Choisir les canaux" })
    .getByRole("button", { name: "YouTube", exact: true })
    .click();
  await page.getByRole("button", { name: "Continuer", exact: true }).click();
  await page
    .locator("input[type=file]")
    .setInputFiles("tests/studio/fixtures/video-640x360.mp4");
  await expect(
    page.getByRole("button", { name: "Créer l’annonce", exact: true }),
  ).toBeEnabled({ timeout: 30000 });
  await expect(page.getByText("640 × 360", { exact: false })).toBeVisible();
  const video = page.locator("video");
  await expect(video).toBeVisible();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.videoWidth))
    .toBe(640);
});

test("contraste des pages connectées sur ordinateur et mobile", async ({
  page,
}) => {
  const users = JSON.parse(await readFile(".env.studio-users.local", "utf8"));
  await page.goto(base + "/studio");
  await page.getByLabel("E-mail", { exact: true }).fill(users[0].email);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill(users[0].password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Vos campagnes" }),
  ).toBeVisible();
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "",
      "/configuration",
      "/validation",
      "/on-air",
      "/terminees",
      "/acces",
    ]) {
      await page.goto(base + "/studio" + route);
      await expect(
        page.getByRole("button", { name: "Se déconnecter" }),
      ).toBeAttached();
      await page.addScriptTag({ path: "node_modules/axe-core/axe.min.js" });
      const violations = await page.evaluate(async () => {
        const axe = (
          window as unknown as {
            axe: {
              run: (options: unknown) => Promise<{
                violations: {
                  id: string;
                  nodes: { html: string; failureSummary: string }[];
                }[];
              }>;
            };
          }
        ).axe;
        return (
          await axe.run({
            runOnly: { type: "rule", values: ["color-contrast"] },
          })
        ).violations;
      });
      expect(violations, `${route} / ${width}`).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        `${route} / ${width}`,
      ).toBe(false);
    }
  }
});

test("connexion commune entre Studio et Social Ads", async ({ page }) => {
  const users = JSON.parse(await readFile(".env.studio-users.local", "utf8"));
  await page.goto(base + "/studio");
  await page.getByLabel("E-mail", { exact: true }).fill(users[0].email);
  await page
    .getByLabel("Mot de passe", { exact: true })
    .fill(users[0].password);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Vos campagnes" }),
  ).toBeVisible();
  await page.goto(base + "/social");
  await expect(
    page.getByRole("heading", { name: "Vos plans d’annonces" }),
  ).toBeVisible();
  const { campaignFixture } =
    await import("../../lib/social-ads/__fixtures__/campaign");
  await page.getByLabel("Classeur de campagne").setInputFiles({
    name: "Recette-social.xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(await campaignFixture()),
  });
  await expect(page.getByText(/12 annonces valides/)).toBeVisible({
    timeout: 30000,
  });
  await page
    .getByRole("button", {
      name: "Créer le plan avec 12 annonces",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("link", { name: "Exporter les textes (.txt)", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  const exportUrl = await page
    .getByRole("link", { name: "Exporter les textes (.txt)", exact: true })
    .getAttribute("href");
  const exported = await page.request.get(base + exportUrl);
  expect(exported.status()).toBe(200);
  expect(await exported.text()).toContain("Formation 1 à découvrir");
  await page
    .getByRole("button", { name: "Générer le lien de validation", exact: true })
    .click();
  await expect(page.getByLabel("Lien de validation")).toHaveValue(
    /\/preview\//,
  );
});

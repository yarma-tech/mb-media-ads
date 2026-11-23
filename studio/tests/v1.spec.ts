import { test, expect } from "@playwright/test";
test("prototype V1 public préservé", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of ["validation", "on-air", "statistiques"]) {
    const response = await page.goto("http://127.0.0.1:3001/studio/" + route);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("button", { name: "Se connecter", exact: true })).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText("n’est pas configuré");
  }
  expect(errors).toEqual([]);
  expect((await request.get("http://127.0.0.1:3001/api/studio")).status()).toBe(401);
});

import { expect, type Locator } from "@playwright/test";

/** Exercise the visible menu, rather than the hidden native form control. */
export async function chooseOption(
  control: Locator,
  value: string | { label: string },
) {
  if (await control.evaluate((el) => el.tagName === "SELECT")) {
    await control.selectOption(value);
    return;
  }
  await control.click();
  const menu = control.page().getByRole("listbox");
  await expect(menu).toBeVisible();
  if (typeof value === "object") {
    await menu.getByRole("option", { name: value.label, exact: true }).click();
  } else {
    const options = menu.getByRole("option");
    const index = await options.evaluateAll(
      (items, chosen) =>
        items.findIndex((item) => item.getAttribute("data-value") === chosen),
      value,
    );
    expect(
      index,
      `Option ${value} disponible dans le menu`,
    ).toBeGreaterThanOrEqual(0);
    await options.nth(index).click();
  }
}
export async function expectFieldValue(
  control: Locator,
  value: string | RegExp,
) {
  if ((await control.getAttribute("data-studio-select")) !== null)
    await expect(control).toHaveAttribute("data-value", value);
  else await expect(control).toHaveValue(value);
}

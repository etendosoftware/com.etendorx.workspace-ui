import type { Locator } from "@playwright/test";
import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";

/** Sample product with a Weight (a numeric field) in its main section; it is never saved. */
const PRODUCT_NAME = "A BOM";
const WEIGHT = "Weight";
const NAME = "Name";
const FIELD_TIMEOUT = 15_000;

/** The "Save Changes" button of the form: enabled only while the record has changes. */
function saveChanges(app: App): Locator {
  return app.page.getByRole("button", { name: "Save Changes" }).first();
}

/** Types `text` in a field like a user and leaves it. */
async function typeAndLeave(app: App, field: Locator, text: string): Promise<void> {
  await field.click();
  await field.press("Control+a");
  await field.pressSequentially(text);
  await app.page.getByRole("textbox", { name: NAME }).first().click();
}

/**
 * "Save Changes" is enabled only when a value really changes (ETP-6338): entering and leaving a numeric field
 * without changing it, or typing the same number with another format, never marks the record as modified. The
 * sample product is only opened; the changes typed in it are never saved.
 */
test.describe("Form - numeric fields do not mark the record as modified without a change @smoke @form", () => {
  let weight: Locator;

  test.beforeEach(async ({ app }) => {
    await app.sidebar.navigateTo("product");
    await app.grid.filter(NAME, PRODUCT_NAME);
    await app.grid.openForm(PRODUCT_NAME);
    await app.breadcrumb.waitFor(PRODUCT_NAME);
    weight = app.field.input(WEIGHT);
    await weight.waitFor({ state: "visible", timeout: FIELD_TIMEOUT });
    await expect(saveChanges(app)).toBeDisabled();
  });

  test("entering and leaving a numeric field keeps Save Changes disabled", async ({ app }) => {
    await weight.click();
    await app.page.getByRole("textbox", { name: NAME }).first().click();

    await expect(saveChanges(app)).toBeDisabled();
  });

  test("typing the same number with another format keeps it disabled", async ({ app }) => {
    const current = Number(await weight.inputValue());

    await typeAndLeave(app, weight, current.toFixed(3));

    await expect(saveChanges(app)).toBeDisabled();
  });

  test("typing a different number enables it", async ({ app }) => {
    const different = String(Number(await weight.inputValue()) + 7);

    await typeAndLeave(app, weight, different);

    await expect(saveChanges(app)).toBeEnabled();
  });
});

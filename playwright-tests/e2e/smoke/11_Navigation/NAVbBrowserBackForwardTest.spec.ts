import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import { PRODUCT, SAMPLE_DOCUMENT } from "../../support/registry/data";

const SALES_ORDER = "Sales Order";
const PRODUCT_WINDOW = "Product";
const DOCUMENT_NO = "Document No.";
const EDITED_SUFFIX = "-X";
/** Time for the history to walk over steps of a window that was closed. */
const WALK_TIMEOUT = 15_000;
/** A record restored from the URL reloads its window and its parents: up to a minute on a busy CI. */
const RELOAD_TIMEOUT = 60_000;

/** Opens in the form the record of the active grid whose `column` shows exactly `value`. */
async function openRecord(app: App, column: string, value: string): Promise<void> {
  await app.grid.filter(column, value);
  await app.grid.openRowForm(app.grid.rowWithCell(value));
  await app.breadcrumb.waitFor(value);
}

/** The order in the form of the Sales Order window, then the product in the form of the Product window. */
async function openOrderThenProduct(app: App, order: string, product: string): Promise<void> {
  await app.sidebar.navigateTo("salesOrder");
  await app.toolbar.disableImplicitFilter();
  await openRecord(app, DOCUMENT_NO, order);
  await app.sidebar.navigateTo("product");
  await openRecord(app, "Name", product);
  await expect(app.windows.closeButtons).toHaveCount(2);
}

/**
 * Browser Back/Forward between windows and records: every place the user moves to (a window opened
 * or brought to the front, a record opened in the form) is a history entry, so Back returns to the
 * previous place and Forward comes back, without closing any window. Read-only: sample records are
 * only opened, and the changes made to a form are discarded.
 */
test.describe("Navigation - browser Back and Forward between windows and records @smoke @nav", () => {
  // Independent tests (read-only: the sample orders are never saved): spread them over the workers instead of
  // running them one after another in one worker, the tail of suite-01-base in CI (ETP-6295)
  test.describe.configure({ mode: "parallel" });

  test("Back and Forward restore the window and the record of each step", async ({ app }) => {
    const order = SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    const product = PRODUCT.RAW_MATERIAL_A.name;
    await openOrderThenProduct(app, order, product);

    // Back leaves the record of the product, then the Product window: the order form is shown again
    await app.page.goBack();
    await app.page.goBack();
    await app.breadcrumb.waitFor(order);
    await expect(app.field.byName("documentNo")).toBeVisible();

    // No window was closed by going back
    await expect(app.windows.closeButtons).toHaveCount(2);

    // Forward comes back to the record of the other window
    await app.page.goForward();
    await app.page.goForward();
    await app.breadcrumb.waitFor(product);
    await expect(app.windows.closeButtons).toHaveCount(2);

    // The window tabs still work after moving through the history
    await app.windows.switchTo(SALES_ORDER);
    await app.breadcrumb.waitFor(order);
    await app.windows.switchTo(PRODUCT_WINDOW);
    await app.breadcrumb.waitFor(product);
  });

  test("Back from a form with unsaved changes asks first: Cancel keeps it, Discard closes the window", async ({
    app,
  }) => {
    const order = SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.disableImplicitFilter();
    await openRecord(app, DOCUMENT_NO, order);
    await app.field.fill(DOCUMENT_NO, `${order}${EDITED_SUFFIX}`);
    const entries = await app.page.evaluate(() => window.history.length);

    // Back asks before leaving the form; Cancel keeps the form, the change and the history as they were
    await app.page.goBack();
    const cancel = app.page.getByTestId("UnsavedChangesWindowsModal__cancel");
    await expect(cancel).toBeVisible();
    await cancel.click();
    await expect(cancel).toBeHidden();
    await expect(app.field.input(DOCUMENT_NO)).toHaveValue(`${order}${EDITED_SUFFIX}`);
    expect(await app.page.evaluate(() => window.history.length)).toBe(entries);

    // Going back again asks again; discarding the window leaves no window and no change saved
    await app.page.goBack();
    await expect(cancel).toBeVisible();
    await app.page.getByRole("button", { name: "Discard", exact: true }).click();
    await app.page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(app.windows.closeButtons).toHaveCount(0);
  });

  test("Back and Forward skip the steps of a window that was closed in the middle", async ({ app }) => {
    const order = SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    const product = PRODUCT.RAW_MATERIAL_A.name;
    await openOrderThenProduct(app, order, product);

    await app.windows.close(SALES_ORDER);
    await expect(app.windows.closeButtons).toHaveCount(1);

    // Back leaves the product form and the grid, then walks over the order steps of the closed window to Home
    await app.page.goBack();
    await app.page.goBack();
    await expect(app.breadcrumb.root.getByText(product)).toBeHidden({ timeout: WALK_TIMEOUT });
    await expect(app.windows.closeButtons).toHaveCount(1);
    await expect(app.windows.tab(SALES_ORDER)).toBeHidden();

    // Forward comes back to the product, and the closed window still does not return
    await app.page.goForward();
    await app.page.goForward();
    await app.breadcrumb.waitFor(product, WALK_TIMEOUT);
    await expect(app.windows.closeButtons).toHaveCount(1);
    await expect(app.windows.tab(SALES_ORDER)).toBeHidden();
  });

  test("Back after reloading the page returns to the previous step", async ({ app }) => {
    const order = SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    const product = PRODUCT.RAW_MATERIAL_A.name;
    await openOrderThenProduct(app, order, product);

    await app.page.reload();
    await app.breadcrumb.waitFor(product, RELOAD_TIMEOUT);

    await app.page.goBack();
    await app.page.goBack();
    await app.breadcrumb.waitFor(order);
    await expect(app.windows.closeButtons).toHaveCount(2);
  });
});

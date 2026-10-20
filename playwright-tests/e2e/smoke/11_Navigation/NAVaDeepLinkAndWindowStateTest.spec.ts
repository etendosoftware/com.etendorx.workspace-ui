import { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";

const SALES_ORDER = "Sales Order";
const PRODUCT = "Product";
/** URL parameters of the deepest tab in form view: window, tab and record of window 0. */
const RECORD_IN_URL = /[?&]wi_0=[^&]+&ti_0=[^&]+&ri_0=[0-9A-F]{32}/;

/** Opens in the form the record of the active grid whose `column` shows exactly `value`. */
async function openRecord(app: App, column: string, value: string): Promise<void> {
  await app.grid.filter(column, value);
  await app.grid.openRowForm(app.grid.rowWithCell(value));
  await app.breadcrumb.waitFor(value);
}

/**
 * Navigation state kept in the URL and across windows: the URL of an open record restores it
 * after a reload and in a fresh browser session (a deep link), and switching between open
 * windows keeps the record each one shows. Read-only: sample records are only opened.
 */
test.describe("Navigation - deep link, reload recovery and open windows @smoke @nav", () => {
  test("restores a record from its URL and keeps the state of each open window", async ({ app, browser, data }) => {
    const order = data.SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    const product = data.PRODUCT.RAW_MATERIAL_A.name;

    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.disableImplicitFilter();
    await openRecord(app, "Document No.", order);
    await expect(app.page).toHaveURL(RECORD_IN_URL);
    const deepLink = app.page.url();

    await app.page.reload();
    await app.breadcrumb.waitFor(order);
    await expect(app.field.byName("documentNo")).toBeVisible();

    // A deep link opened in a new browser session, after logging in
    const context = await browser.newContext();
    try {
      const fresh = new App(await context.newPage());
      await fresh.auth.login();
      await fresh.page.goto(deepLink);
      await fresh.breadcrumb.waitFor(order);
    } finally {
      await context.close();
    }

    // Two open windows keep their own record while switching between them
    await app.sidebar.navigateTo("product");
    await openRecord(app, "Name", product);
    await expect(app.windows.closeButtons).toHaveCount(2);
    await app.windows.switchTo(SALES_ORDER);
    await app.breadcrumb.waitFor(order);
    await app.windows.switchTo(PRODUCT);
    await app.breadcrumb.waitFor(product);
  });
});

/**
 * Navigation state flow shared by the NAVa probe (real backend) and its mocked-backend pilot:
 * the same checks, only the backend behind `/api/**` changes.
 */
import { type BrowserContext, expect } from "@playwright/test";
import { App } from "../components";
import { PRODUCT, SAMPLE_DOCUMENT } from "../registry/data";

const SALES_ORDER = "Sales Order";
const PRODUCT_WINDOW = "Product";
/** URL parameters of the deepest tab in form view: window, tab and record of window 0. */
const RECORD_IN_URL = /[?&]wi_0=[^&]+&ti_0=[^&]+&ri_0=[0-9A-F]{32}/;

/** Opens in the form the record of the active grid whose `column` shows exactly `value`. */
async function openRecord(app: App, column: string, value: string): Promise<void> {
  await app.grid.filter(column, value);
  await app.grid.openRowForm(app.grid.rowWithCell(value));
  await app.breadcrumb.waitFor(value);
}

/**
 * The URL of an open record restores it after a reload and in a fresh browser session (a deep
 * link), and switching between open windows keeps the record each one shows. Read-only.
 * @param app - the logged-in application.
 * @param newContext - creates the browser context of the fresh session.
 */
export async function verifyNavigationState(app: App, newContext: () => Promise<BrowserContext>): Promise<void> {
  const order = SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
  const product = PRODUCT.RAW_MATERIAL_A.name;

  await app.sidebar.navigateTo("salesOrder");
  await app.toolbar.disableImplicitFilter();
  await openRecord(app, "Document No.", order);
  await expect(app.page).toHaveURL(RECORD_IN_URL);
  const deepLink = app.page.url();

  await app.page.reload();
  await expect(app.breadcrumb.root, "the reload did not restore the record of the URL").toContainText(order);
  await expect(app.field.byName("documentNo")).toBeVisible();

  // A deep link opened in a new browser session, after logging in
  const context = await newContext();
  try {
    const fresh = new App(await context.newPage());
    await fresh.auth.login();
    await fresh.page.goto(deepLink);
    await expect(fresh.breadcrumb.root, "the deep link did not open its record").toContainText(order);
  } finally {
    await context.close();
  }

  // Two open windows keep their own record while switching between them
  await app.sidebar.navigateTo("product");
  await openRecord(app, "Name", product);
  await expect(app.windows.closeButtons).toHaveCount(2);
  await app.windows.switchTo(SALES_ORDER);
  await app.breadcrumb.waitFor(order);
  await app.windows.switchTo(PRODUCT_WINDOW);
  await app.breadcrumb.waitFor(product);
}

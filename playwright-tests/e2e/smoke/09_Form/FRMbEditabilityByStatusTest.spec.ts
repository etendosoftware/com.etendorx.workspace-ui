import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";

/** Header fields of a sales order whose read-only logic is `@Processed@='Y'` (property names). */
const PROCESSED_READ_ONLY = ["orderDate", "businessPartner", "priceList", "paymentTerms", "warehouse"];
/** Process button with display logic `@processed@='N'`. */
const COPY_LINES = "Copy Lines";
const PROCESS_MENU_ITEMS = '[data-testid^="ProcessMenuItem__"]:visible';

async function openSampleOrder(app: App, documentNo: string): Promise<void> {
  await app.grid.filter("Document No.", documentNo);
  await app.grid.openRowForm(app.grid.rowWithCell(documentNo));
  await app.breadcrumb.waitFor(documentNo);
}

async function expectHeaderReadOnly(app: App, readOnly: boolean): Promise<void> {
  for (const field of PROCESSED_READ_ONLY) {
    await app.field.expectReadOnly(field, readOnly);
  }
}

/**
 * Field editability by document status: the header of a draft sales order is editable, the one
 * of a booked order is read-only, and the "Copy Lines" process is only offered while the order
 * is not processed. Both orders are sample data and are only read.
 */
test.describe("Form - field editability by document status @smoke @form", () => {
  test("a draft order is editable and a booked one read-only", async ({ app, data, page }) => {
    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.disableImplicitFilter();

    await openSampleOrder(app, data.SAMPLE_DOCUMENT.SALES_ORDER_DRAFT);
    await expectHeaderReadOnly(app, false);
    await app.toolbar.openProcessMenu();
    await expect(page.locator(PROCESS_MENU_ITEMS).filter({ hasText: COPY_LINES })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator(PROCESS_MENU_ITEMS)).toHaveCount(0);

    await app.breadcrumb.openWindowGrid();
    await openSampleOrder(app, data.SAMPLE_DOCUMENT.SALES_ORDER_COMPLETED);
    await expectHeaderReadOnly(app, true);
    await app.toolbar.openProcessMenu();
    await expect(page.locator(PROCESS_MENU_ITEMS).first()).toBeVisible();
    await expect(page.locator(PROCESS_MENU_ITEMS).filter({ hasText: COPY_LINES })).toBeHidden();
  });
});

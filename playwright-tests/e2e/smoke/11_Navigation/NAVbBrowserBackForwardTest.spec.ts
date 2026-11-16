import { expect, test } from "../../support/fixtures";
import { PRODUCT, SAMPLE_DOCUMENT } from "../../support/registry/data";

const SALES_ORDER = "Sales Order";
const PRODUCT_WINDOW = "Product";

/**
 * Browser Back/Forward between windows and records: every place the user moves to (a window opened
 * or brought to the front, a record opened in the form) is a history entry, so Back returns to the
 * previous place and Forward comes back, without closing any window. Read-only: sample records are
 * only opened.
 */
test.describe("Navigation - browser Back and Forward between windows and records @smoke @nav", () => {
  test("Back and Forward restore the window and the record of each step", async ({ app }) => {
    const order = SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    const product = PRODUCT.RAW_MATERIAL_A.name;

    // Step 1: the order in the form of the Sales Order window
    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter("Document No.", order);
    await app.grid.openRowForm(app.grid.rowWithCell(order));
    await app.breadcrumb.waitFor(order);

    // Step 2: another window, with its own record in the form
    await app.sidebar.navigateTo("product");
    await app.grid.filter("Name", product);
    await app.grid.openRowForm(app.grid.rowWithCell(product));
    await app.breadcrumb.waitFor(product);
    await expect(app.windows.closeButtons).toHaveCount(2);

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
});

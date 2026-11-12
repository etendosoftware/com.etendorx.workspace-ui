import { expect, test } from "../../support/fixtures";

const LINES = "Lines";
/** Child tab of the lines whose display logic reads an auxiliary input of the selected line: @PRODUCTTYPE@='S'. */
const RELATED_PRODUCTS = "Related Products";
/** Products of the two lines of the sample draft order 50015: an item and a service. */
const ITEM_LINE = "Distribution good A";
const SERVICE_LINE = "Warranty";

/**
 * Tab display logic follows the row selected in the grid: "Related Products" shows only while the
 * selected line is a service, a value the server computes for that line (an auxiliary input) when
 * it is selected, and it never keeps the visibility of a line selected before. Read-only: the
 * sample order is never changed.
 */
test.describe("Grid - child tab display logic follows the selected row @smoke @grid", () => {
  test("shows a child tab only while the selected line meets its display logic", async ({ app, data }) => {
    const order = data.SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter("Document No.", order);
    await app.grid.setRowSelected(app.grid.rowWithCell(order), true);
    await app.tabs.open(LINES);

    const itemLine = app.grid.rowWithCell(ITEM_LINE);
    const serviceLine = app.grid.rowWithCell(SERVICE_LINE);

    await app.grid.setRowSelected(serviceLine, true);
    await expect(app.tabs.tab(RELATED_PRODUCTS)).toBeVisible();

    await app.grid.setRowSelected(serviceLine, false);
    await app.grid.setRowSelected(itemLine, true);
    await expect(app.tabs.tab(RELATED_PRODUCTS)).toBeHidden();

    await app.grid.setRowSelected(itemLine, false);
    await app.grid.setRowSelected(serviceLine, true);
    await expect(app.tabs.tab(RELATED_PRODUCTS)).toBeVisible();

    // Same rule in the form of the line
    await app.grid.openRowForm(serviceLine);
    await expect(app.tabs.tab(RELATED_PRODUCTS)).toBeVisible();
  });
});

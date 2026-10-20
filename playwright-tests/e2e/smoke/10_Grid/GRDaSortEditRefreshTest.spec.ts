import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";

const LINES = "Lines";
const PRODUCT = "Product";
/** Lines of the sample draft order 50014: "Final good A" sorts first by product, "Insurance" last. */
const FIRST_LINE = { product: "Final good A", quantity: "100", netAmount: "200" };
const LAST_PRODUCT = "Insurance";
/** A line only the other sample draft order (50013) has. */
const OTHER_ORDER_ONLY_PRODUCT = "Transportation";
/** Prefix of the document numbers of both sample orders, to show them in one filtered grid. */
const SAMPLE_ORDERS_PREFIX = "5001";
const SAMPLE_LINE_COUNT = 4;
/** Quantity typed in the grid: the line amount callout (unit price 2) recalculates the net amount. */
const EDITED_LINE = { quantity: "50", netAmount: "100" };
const ORDERED_QUANTITY = "orderedQuantity";

/** The line shows the edited quantity and the net amount the callout recalculated. */
async function expectEditedLine(lineValues: () => Promise<string[]>): Promise<void> {
  await expect.poll(lineValues).toEqual(expect.arrayContaining([EDITED_LINE.quantity, EDITED_LINE.netAmount]));
  await expect.poll(lineValues).not.toContain(FIRST_LINE.netAmount);
}

/** Clones the selected order (with its lines) and waits for the clone to open in the form. */
async function cloneSelectedOrder(app: App, documentNo: string): Promise<void> {
  await app.toolbar.button("copy-record").click();
  await app.page.getByRole("dialog").getByRole("button", { name: "Yes", exact: true }).click();
  await app.breadcrumb.documentNumber();
  await expect(app.breadcrumb.root).not.toContainText(documentNo);
}

/**
 * Grid behaviors: the lines tab follows the selection of the header grid; then, on a clone of a
 * sample order (its own data, so the edits are safe), the clone shows up with its lines, the
 * lines sort by a column, and a quantity edited in the grid fires the line amount callout and
 * survives a refresh.
 */
test.describe("Grid - sort, inline edit with callout, refresh and child tab @smoke @grid", () => {
  test("sorts, edits a line in the grid and follows the parent selection", async ({ app, data }) => {
    const sample = data.SAMPLE_DOCUMENT.SALES_ORDER_DRAFT_WITH_LINES;
    const other = data.SAMPLE_DOCUMENT.SALES_ORDER_DRAFT_WITH_MORE_LINES;
    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter("Document No.", SAMPLE_ORDERS_PREFIX);

    // The lines tab follows the order selected in the header grid
    await app.grid.setRowSelected(app.grid.rowWithCell(other), true);
    await app.tabs.open(LINES);
    await expect(app.grid.rowWithCell(OTHER_ORDER_ONLY_PRODUCT)).toBeVisible();
    await app.grid.setRowSelected(app.grid.rowWithCell(other), false);
    await app.grid.setRowSelected(app.grid.rowWithCell(sample), true);
    await expect(app.grid.rowWithCell(OTHER_ORDER_ONLY_PRODUCT)).toBeHidden();
    await expect(app.grid.rowWithCell(FIRST_LINE.product)).toContainText(FIRST_LINE.quantity);

    // The clone opens in the form with a copy of the lines
    await cloneSelectedOrder(app, sample);
    await app.tabs.open(LINES);
    const lines = app.grid.rows();
    await expect(lines).toHaveCount(SAMPLE_LINE_COUNT);

    // The backend sorts: ascending first, then descending
    await app.grid.sortBy(PRODUCT);
    await expect(lines.first()).toContainText(FIRST_LINE.product);
    await expect(lines.last()).toContainText(LAST_PRODUCT);
    await app.grid.sortBy(PRODUCT);
    await expect(lines.first()).toContainText(LAST_PRODUCT);
    await expect(lines.last()).toContainText(FIRST_LINE.product);

    const line = app.grid.rowWithCell(FIRST_LINE.product);
    const lineValues = () => app.grid.cellTexts(line);
    await expect.poll(lineValues).toEqual(expect.arrayContaining([FIRST_LINE.quantity, FIRST_LINE.netAmount]));
    await app.grid.editRow(line);
    const quantity = app.grid.cellEditor(line, ORDERED_QUANTITY);
    await quantity.fill(EDITED_LINE.quantity);
    await quantity.press("Tab");
    await app.grid.saveRow(line);
    await expectEditedLine(lineValues);

    await app.toolbar.button("refresh", "child").click();
    await expectEditedLine(lineValues);
  });
});

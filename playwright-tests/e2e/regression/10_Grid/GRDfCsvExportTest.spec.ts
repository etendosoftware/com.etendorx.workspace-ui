import { csvColumn, parseCsv } from "../../support/csv";
import { expect, test } from "../../support/fixtures";
import { TABS, WINDOW_IDS } from "../../support/registry/windows";

const DOCUMENT_NO = "Document No.";
/** Prefix of the document numbers of the sample sales orders (50013–50017), the filter of the grid. */
const SAMPLE_ORDERS_PREFIX = "5001";

// The grid saves its sort per user: start from the default order of the orders and leave it so
test.beforeEach(async ({ api }) => {
  await api.resetGridConfiguration(WINDOW_IDS.SALES_ORDER, TABS.SALES_ORDER_HEADER);
});
test.afterEach(async ({ api }) => {
  await api.resetGridConfiguration(WINDOW_IDS.SALES_ORDER, TABS.SALES_ORDER_HEADER);
});

/**
 * "Export to Spreadsheet" exports what the grid shows (ETP-5998): only the records of its column filter, in its
 * descending sort, and all of them. Read-only.
 */
test.describe("Grid - CSV export of a filtered and sorted grid @regression @grid", () => {
  test("exports the filtered records in the grid's descending order", async ({ app }) => {
    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter(DOCUMENT_NO, SAMPLE_ORDERS_PREFIX);
    await app.grid.sortDescending(DOCUMENT_NO);
    const shownRecords = await app.grid.shownRecords();

    const documentNumbers = csvColumn(parseCsv(await app.toolbar.exportCsv()), DOCUMENT_NO);

    // Every record of the grid, none outside its filter, in the order the grid shows them
    expect(documentNumbers).toHaveLength(shownRecords);
    expect(documentNumbers.length).toBeGreaterThan(1);
    const rows = app.grid.rows();
    for (const [index, documentNumber] of documentNumbers.entries()) {
      expect(documentNumber).toContain(SAMPLE_ORDERS_PREFIX);
      await expect.poll(() => app.grid.cellTexts(rows.nth(index))).toContain(documentNumber);
    }
  });
});

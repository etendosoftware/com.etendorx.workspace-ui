import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import { overrideTab } from "../../support/processOverrides";
import { SAMPLE_DOCUMENT } from "../../support/registry/data";
import { TABS, WINDOW_IDS } from "../../support/registry/windows";

const DOCUMENT_NO = "Document No.";
/**
 * Prefix of the document numbers of the sample orders 50010 to 50019, so the grid has several rows and none of
 * them is selected for the user (a grid with one row selects it).
 */
const SAMPLE_ORDERS_PREFIX = "5001";

/** The record buttons of the toolbar the enablement rules of Classic decide on. */
function buttons(app: App) {
  return {
    remove: app.toolbar.button("delete"),
    clone: app.toolbar.button("copy-record"),
    exportCsv: app.toolbar.button("export-csv"),
    attachments: app.toolbar.button("attachment"),
  };
}

/** Opens Sales Order with the sample orders 50010 to 50019 in its grid, once the order `documentNo` shows. */
async function openSampleOrders(app: App, documentNo: string): Promise<void> {
  await app.sidebar.navigateTo("salesOrder");
  await app.toolbar.disableImplicitFilter();
  await app.grid.filter(DOCUMENT_NO, SAMPLE_ORDERS_PREFIX);
  await app.grid.waitForRow(documentNo);
}

/**
 * Enablement of the record buttons of the toolbar, as Classic decides it: Delete, Clone and Attachments follow
 * the selection, Delete and Clone also need a saved record, Export is for the grid and not for the form, and a
 * table that does not allow deleting disables Delete only. Read-only: records are only selected and opened, and
 * the new record of the form is never saved.
 */
test.describe("Grid - toolbar enablement of Delete, Clone, Export and Attachments @smoke @grid", () => {
  test("follows the selection of the grid", async ({ app }) => {
    const draft = SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    await openSampleOrders(app, draft);
    const { remove, clone, exportCsv, attachments } = buttons(app);

    // Nothing selected: only Export (the grid has rows) is available
    await expect(exportCsv).toBeEnabled();
    for (const button of [remove, clone, attachments]) {
      await expect(button).toBeDisabled();
    }

    // A record selected: the record buttons are available
    await app.grid.setRowSelected(app.grid.rowWithCell(draft), true);
    for (const button of [remove, clone, attachments, exportCsv]) {
      await expect(button).toBeEnabled();
    }

    // Selection cleared: back to Export only
    await app.grid.setRowSelected(app.grid.rowWithCell(draft), false);
    for (const button of [remove, clone, attachments]) {
      await expect(button).toBeDisabled();
    }
    await expect(exportCsv).toBeEnabled();
  });

  test("in the form: no Export, and nothing to delete or clone in a record that is not saved", async ({ app }) => {
    const draft = SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    await openSampleOrders(app, draft);
    await app.grid.openForm(draft);
    await app.breadcrumb.waitFor(draft);
    const { remove, clone, exportCsv, attachments } = buttons(app);

    // A saved record: its record buttons are available, but Export belongs to the grid
    for (const button of [remove, clone, attachments]) {
      await expect(button).toBeEnabled();
    }
    await expect(exportCsv).toBeDisabled();

    // A new record has nothing to delete or clone yet, and Export is not for the form
    await app.toolbar.newRecordInForm();
    for (const button of [remove, clone, exportCsv]) {
      await expect(button).toBeDisabled();
    }
  });

  test("a table that does not allow deleting records disables Delete and nothing else", async ({ app, page }) => {
    const draft = SAMPLE_DOCUMENT.SALES_ORDER_DRAFT;
    // The sample data has no such table: the metadata of the Sales Order header says so for this test only
    const override = await overrideTab(page, WINDOW_IDS.SALES_ORDER, TABS.SALES_ORDER_HEADER, {
      deletableRecords: false,
    });
    await openSampleOrders(app, draft);
    expect(override.applied).toBeGreaterThan(0);
    const { remove, clone, exportCsv, attachments } = buttons(app);

    await app.grid.setRowSelected(app.grid.rowWithCell(draft), true);

    await expect(remove).toBeDisabled();
    for (const button of [clone, attachments, exportCsv]) {
      await expect(button).toBeEnabled();
    }
  });
});

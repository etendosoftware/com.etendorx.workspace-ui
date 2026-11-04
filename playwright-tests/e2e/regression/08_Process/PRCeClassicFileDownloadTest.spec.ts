import { readFile } from "node:fs/promises";
import { expect, test } from "../../support/fixtures";
import { TABS } from "../../support/registry/windows";

const RECONCILIATIONS = "Reconciliations";
const RECONCILIATION_DETAILS = "Reconciliation Details";
const DOCUMENT_NO = "Document No.";
/** First bytes of every PDF file. */
const PDF_SIGNATURE = "%PDF-";

/**
 * Classic process popups that answer with a file (ETP-6022). Reconciliation Details renders its
 * report through Classic `renderJR`, whose download page is replaced by a forwarder: the modal shows
 * the success message and the browser downloads the PDF intact. The other file processes of the
 * ticket need modules or configuration the sample data does not have; the pipeline is covered by the
 * unit tests of the metadata module. Read-only: it only prints a sample reconciliation.
 */
test.describe("Process - classic popup file download @regression @process", () => {
  test("downloads the Reconciliation Details PDF and reports success", async ({ app, data, page }) => {
    const account = data.FINANCIAL_ACCOUNT.ACCOUNTING_DOCUMENTS_EURO;
    const reconciliation = data.SAMPLE_DOCUMENT.RECONCILIATION_JUL_2011;
    await app.sidebar.navigateTo("financialAccount");
    await app.grid.filter("Name", account.name);
    await app.grid.selectRow(account.name);
    await app.tabs.open(RECONCILIATIONS);
    const tab = page.getByTestId(`Tab__${TABS.FINANCIAL_ACCOUNT_RECONCILIATION}`);
    await app.grid.filter(DOCUMENT_NO, reconciliation, tab);
    await app.grid.setRowSelected(app.grid.rowWithCell(reconciliation, tab), true);

    const download = page.waitForEvent("download");
    await app.toolbar.inTab(TABS.FINANCIAL_ACCOUNT_RECONCILIATION).process(RECONCILIATION_DETAILS);
    await app.processModal.expectSuccess();

    const file = await download;
    expect(file.suggestedFilename()).toMatch(/\.pdf$/i);
    const content = await readFile(await file.path());
    expect(content.subarray(0, PDF_SIGNATURE.length).toString("latin1")).toBe(PDF_SIGNATURE);
  });
});

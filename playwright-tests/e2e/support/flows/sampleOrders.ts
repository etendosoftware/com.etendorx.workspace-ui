/** Sample sales orders (QA_Testing) a spec only reads: opened in the Sales Order grid and selected. */
import type { App } from "../components";

const DOCUMENT_NO = "Document No.";

/**
 * Opens Sales Order and selects the sample order `documentNo` in its grid. The implicit filter is turned off so
 * booked orders show too.
 */
export async function selectSampleOrder(app: App, documentNo: string): Promise<void> {
  await app.sidebar.navigateTo("salesOrder");
  await app.toolbar.disableImplicitFilter();
  await app.grid.filter(DOCUMENT_NO, documentNo);
  await app.grid.setRowSelected(app.grid.rowWithCell(documentNo), true);
}

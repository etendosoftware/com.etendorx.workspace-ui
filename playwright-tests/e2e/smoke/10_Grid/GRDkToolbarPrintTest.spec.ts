import { expect, test } from "../../support/fixtures";
import { selectSampleOrder } from "../../support/flows/sampleOrders";
import { answerWithFile, answerWithStatus } from "../../support/network";
import { SAMPLE_DOCUMENT } from "../../support/registry/data";
import { FILE_DOWNLOAD_TIMEOUT } from "../../support/wait";

/** The document print service, reached through the ERP proxy of the new UI (Client → Next API → ERP). */
const PRINT_REQUEST = /\/api\/erp\/sws\/com\.etendoerp\.etendorx\.print/;
/** The PDF the print service answers with; simulated, see the spec description. */
const PRINTED_PDF = { contentType: "application/pdf", fileName: "50017.pdf", body: "%PDF-1.4 simulated" };
const SERVER_ERROR = 500;
const SERVER_ERROR_TOAST = "Something went wrong";

/**
 * Toolbar Print of a PrintController document (ETP-6311): the PDF is downloaded through the ERP proxy, and a
 * failed print is shown in the server-error toast without closing the session. Read-only: it prints the booked
 * sample order. The PDF itself is simulated: generating it needs the server to compile the Jasper report, which
 * depends on the installation, not on the new UI. The proxy forwarding of the PDF is covered by the unit tests of
 * the ERP route.
 */
test.describe("Grid - toolbar print of documents @smoke @grid", () => {
  test.beforeEach(async ({ app }) => {
    await selectSampleOrder(app, SAMPLE_DOCUMENT.SALES_ORDER_COMPLETED);
  });

  test("downloads the PDF of the selected order through the ERP proxy", async ({ app, page }) => {
    const print = await answerWithFile(page, PRINT_REQUEST, PRINTED_PDF);

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: FILE_DOWNLOAD_TIMEOUT }),
      app.toolbar.button("print-record").click(),
    ]);

    expect(print.sent).toBe(true);
    expect(download.suggestedFilename()).toBe(PRINTED_PDF.fileName);
  });

  test("shows a failed print in a toast and keeps the session", async ({ app, page }) => {
    const failure = await answerWithStatus(page, PRINT_REQUEST, SERVER_ERROR);

    await app.toolbar.button("print-record").click();

    await app.toast.expectError(SERVER_ERROR_TOAST);
    expect(failure.sent).toBe(true);
    await app.auth.expectStillLoggedIn();
  });
});

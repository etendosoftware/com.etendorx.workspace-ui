import { expect, test } from "../../support/fixtures";
import { blockRequests } from "../../support/network";
import { overrideProcessDefinition } from "../../support/processOverrides";
import { WINDOW_IDS } from "../../support/registry/windows";

/** AD_Reference_ID of "Upload File", the reference of a process parameter that uploads a file. */
const UPLOAD_FILE_REFERENCE = "715C53D4FEA74B28B74F14AE65BC5C16";
const FILE_NAME = "certificate.p12";
/** One byte above the 10 MB of OBUIAPP_ProcessFileUploadMaxSize in the core (1 MB = 1024 × 1024 bytes). */
const OVERSIZED_BYTES = 10 * 1024 * 1024 + 1;
const ADD_PAYMENT_HANDLER = /AddPaymentActionHandler/;

/** A definition with a single Upload File parameter and no scripts: the plain execute path of a process. */
const UPLOAD_ONLY_DEFINITION = {
  parameters: {
    certificate: {
      id: "E2E_PRCG_UPLOAD_FILE",
      name: "Certificate",
      dBColumnName: "certificate",
      reference: UPLOAD_FILE_REFERENCE,
      mandatory: false,
      active: true,
    },
  },
  etmetaOnload: null,
  etmetaOnprocess: null,
};

/**
 * Maximum size of a file uploaded by a process (OBUIAPP_ProcessFileUploadMaxSize), as Classic's
 * OBProcessFileUpload: a larger file is rejected at the execute click with Classic's message, and nothing is
 * sent. The core has no process with a file parameter a probe can run, so the spec gives the Sales Invoice
 * "Add Payment" definition a single Upload File parameter; its handler is blocked and must never be called.
 */
test.describe("Process file upload - maximum size @smoke @process", () => {
  test("rejects a file above the maximum size before sending it", async ({ app, page, data }) => {
    const invoice = data.SAMPLE_DOCUMENT.SALES_INVOICE_PENDING;
    const override = await overrideProcessDefinition(
      page,
      WINDOW_IDS.SALES_INVOICE,
      data.PROCESS.ADD_PAYMENT,
      UPLOAD_ONLY_DEFINITION
    );
    const payment = await blockRequests(page, ADD_PAYMENT_HANDLER);

    await app.sidebar.navigateTo("salesInvoice");
    expect(override.applied, "the Add Payment definition was not found in the window metadata").toBeGreaterThan(0);
    // The invoice is completed: the implicit filter shows drafts only
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter("Document No.", `==${invoice}`);
    await app.grid.setRowSelected(app.grid.rowWithCell(invoice), true);
    await app.toolbar.process("Add Payment");

    await app.processModal.attachFile({
      name: FILE_NAME,
      mimeType: "application/x-pkcs12",
      buffer: Buffer.alloc(OVERSIZED_BYTES),
    });
    await app.processModal.execute();

    await expect(app.processModal.messageBar).toContainText(
      `File ${FILE_NAME} cannot be uploaded as its size exceeds our limits. Max size allowed: 10 MB.`
    );
    expect(payment.sent, "the file was sent to the process handler").toBe(false);
    await app.processModal.close();
  });
});

import { expect, test } from "../../support/fixtures";
import { overrideProcessDefinition } from "../../support/processOverrides";
import { WINDOW_IDS } from "../../support/registry/windows";

/** AD_Reference_ID of "Upload File", the reference of a process parameter that uploads a file. */
const UPLOAD_FILE_REFERENCE = "715C53D4FEA74B28B74F14AE65BC5C16";
const FILE_NAME = "activation.lic";
const ADD_PAYMENT_HANDLER = /AddPaymentActionHandler/;

/** A single Upload File parameter and no scripts: the plain execute path of a process with a file. */
const UPLOAD_ONLY_DEFINITION = {
  parameters: {
    certificate: {
      id: "E2E_PRCH_WINDOW_UPLOAD_FILE",
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
 * Counterpart of the process-from-the-menu spec (ETP-6339): a process with a file opened from a window keeps
 * sending the window, so the server checks the access of that window as before. The request is answered here
 * and never reaches the server, so nothing is created.
 */
test.describe("Process with a file opened from a window @smoke @process", () => {
  test("sends the request with the window it was opened from", async ({ app, page, data }) => {
    const invoice = data.SAMPLE_DOCUMENT.SALES_INVOICE_PENDING;
    const override = await overrideProcessDefinition(
      page,
      WINDOW_IDS.SALES_INVOICE,
      data.PROCESS.ADD_PAYMENT,
      UPLOAD_ONLY_DEFINITION
    );
    const sent: { contentType: string; body: Buffer | null }[] = [];
    await page.route(ADD_PAYMENT_HANDLER, async (route) => {
      const request = route.request();
      sent.push({ contentType: request.headers()["content-type"] ?? "", body: request.postDataBuffer() });
      await route.fulfill({
        json: { responseActions: [{ showMsgInProcessView: { msgType: "success", msgText: "ok" } }] },
      });
    });

    await app.sidebar.navigateTo("salesInvoice");
    expect(override.applied, "the Add Payment definition was not found in the window metadata").toBeGreaterThan(0);
    // The invoice is completed: the implicit filter shows drafts only
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter("Document No.", `==${invoice}`);
    await app.grid.setRowSelected(app.grid.rowWithCell(invoice), true);
    await app.toolbar.process("Add Payment");
    await app.processModal.attachFile({
      name: FILE_NAME,
      mimeType: "application/octet-stream",
      buffer: Buffer.from("key"),
    });
    await app.processModal.execute();

    await expect.poll(() => sent.length, { message: "the process was not executed" }).toBe(1);
    const [request] = sent;
    expect(request.contentType).toContain("multipart/form-data");
    const body = request.body?.toString("latin1") ?? "";
    expect(body, "the file was not sent").toContain(`filename="${FILE_NAME}"`);
    expect(body, "the request lost the window").toMatch(
      new RegExp(`name="windowId"\\r\\n\\r\\n${WINDOW_IDS.SALES_INVOICE}\\r\\n`)
    );
  });
});

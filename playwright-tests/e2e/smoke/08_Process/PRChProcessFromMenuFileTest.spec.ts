import { expect, test } from "../../support/fixtures";

/** AD_Menu_ID of "Create Invoices From Orders": a process opened from the menu, so it belongs to no window. */
const CREATE_INVOICES_MENU_ID = "28D5CB59D59243FAA495AABD3775C692";
const CREATE_INVOICES_PROCESS_ID = "C044DDAA929E40D780C36154FBB968F7";
const CREATE_INVOICES = "Create Invoices From Orders";
/** AD_Reference_ID of "Upload File", the reference of a process parameter that uploads a file. */
const UPLOAD_FILE_REFERENCE = "715C53D4FEA74B28B74F14AE65BC5C16";
const FILE_NAME = "activation.lic";
const PROCESS_DEFINITION = new RegExp(`/api/erp/meta/process/${CREATE_INVOICES_PROCESS_ID}`);
const KERNEL_EXECUTE = /\/api\/erp\/org\.openbravo\.client\.kernel\?(?=.*_action=)(?!.*DefaultsProcessActionHandler)/;

/** A single Upload File parameter and no scripts: the plain execute path of a process with a file. */
const UPLOAD_PARAMETER = {
  id: "E2E_PRCH_UPLOAD_FILE",
  name: "Activation file",
  dBColumnName: "activationFile",
  reference: UPLOAD_FILE_REFERENCE,
  mandatory: false,
  active: true,
};

/**
 * A process with a file parameter opened from the menu (ETP-6339), as "Instance Activation" and its "Install
 * from File". It has no window, so the request must carry no window: with an empty one the server checks the
 * access of a window that does not exist and rejects it, even for a role that has access to the process, and
 * Classic sends it without one. The core has no process with a file parameter a role of the suite can open from
 * the menu, so the spec gives "Create Invoices From Orders" one; the request is answered here and never reaches
 * the server, so nothing is created.
 */
test.describe("Process with a file opened from the menu @smoke @process", () => {
  test("sends the request without a window", async ({ app, page }) => {
    await page.route(PROCESS_DEFINITION, async (route) => {
      const response = await route.fetch();
      const definition = await response.json();
      definition.parameters = { activationFile: UPLOAD_PARAMETER };
      definition.etmetaOnload = null;
      definition.etmetaOnprocess = null;
      await route.fulfill({ response, json: definition });
    });
    const sent: { url: string; contentType: string; body: Buffer | null }[] = [];
    await page.route(KERNEL_EXECUTE, async (route) => {
      const request = route.request();
      sent.push({
        url: request.url(),
        contentType: request.headers()["content-type"] ?? "",
        body: request.postDataBuffer(),
      });
      await route.fulfill({
        json: { responseActions: [{ showMsgInProcessView: { msgType: "success", msgText: "ok" } }] },
      });
    });

    await app.sidebar.openMenuEntry(CREATE_INVOICES, CREATE_INVOICES_MENU_ID);
    await expect(app.processModal.title).toBeVisible();
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
    expect(body, "the request carries a window").not.toContain('name="windowId"');
    expect(request.url).not.toContain("windowId");
  });
});

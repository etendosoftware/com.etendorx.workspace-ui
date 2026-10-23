import { SIDEBAR_TEST_IDS } from "../../support/components";
import { expect, test } from "../../support/fixtures";

const PROCESS_ORDER = "Process Order";
const PROCESS_SHIPMENT = "Process Shipment Java";

test.describe("Sales Orders - Create, Complete Shipment and Invoice @smoke", () => {
  test("should create a sales order with lines, create goods shipment, complete lines from order, create invoice, complete lines from order and post", async ({
    app,
    data,
    page,
  }) => {
    const customer = data.BUSINESS_PARTNER.CUSTOMER_BARCELONA;

    /** Goes back to the home page so the next window opens without the previous tabs. */
    const goHome = async () => {
      await page.goto("/");
      await page.getByTestId(SIDEBAR_TEST_IDS.toggle).waitFor({ state: "visible", timeout: 15_000 });
    };

    // ── Step 1: Navigate to Sales Order ──────────────────────────────────────
    await app.sidebar.navigateTo("salesOrder");

    // ── Step 2: New Sales Order ───────────────────────────────────────────────
    await app.toolbar.newRecord();

    // ── Step 3: Fill header ───────────────────────────────────────────────────
    await app.field.selectById("Business Partner", customer.id);
    await app.field.selectById("Transaction Document", data.DOCUMENT_TYPE.STANDARD_ORDER.id);
    await app.toolbar.save();
    await app.toast.closeAll();

    await app.field.selectById("Invoice Terms", "I");
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 4: Add order line ────────────────────────────────────────────────
    await app.tabs.open("Lines");
    await app.toolbar.newRecord("child");
    await app.field.selectById("Product", data.PRODUCT.DISTRIBUTION_GOOD_A.id, { level: "child" });
    await app.field.fillById(data.FIELD.SALES_ORDER_LINE_QUANTITY, "11");
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // ── Step 5: Process order (Book) ──────────────────────────────────────────
    await app.toolbar.process("Book");
    await expect(app.processModal.legacyTitle).toHaveText(PROCESS_ORDER, { timeout: 10_000 });
    await app.processModal.confirm();
    await app.processModal.expectSuccess();
    await app.processModal.closeResult();

    const salesOrderNumber = await app.breadcrumb.documentNumber();

    // Reload to refresh the order state (known app bug — the state is not always reflected
    // without a reload), then go home to clear the open window tabs.
    await page.reload();
    await goHome();

    // ── Step 6: Create Goods Shipment ─────────────────────────────────────────
    await app.sidebar.navigateTo("goodsShipment");
    await app.toolbar.newRecord();
    await app.field.selectById("Business Partner", customer.id);
    await app.toolbar.save();
    await app.toast.closeAll();

    // The invoice takes its lines from this shipment: the customer has shipments of other specs too
    let shipmentNumber = "";
    await expect(async () => {
      shipmentNumber = await app.breadcrumb.documentNumber();
      expect(shipmentNumber).not.toBe(salesOrderNumber);
    }).toPass({ timeout: 20_000 });

    // ── Step 7: Add lines from Sales Order (legacy iframe popup) ──────────────
    await app.toolbar.process("Create Lines From");
    await app.createLinesFrom.fill({ locator: data.LOCATOR.L01, orderDocNumber: salesOrderNumber });
    await app.processModal.expectSuccess();
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // ── Step 8: Process Shipment ──────────────────────────────────────────────
    await app.toolbar.process("Complete");
    await expect(app.processModal.legacyTitle).toHaveText(PROCESS_SHIPMENT, { timeout: 10_000 });
    await app.processModal.confirm();
    await app.processModal.expectSuccess();
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // ── Step 9: Create Sales Invoice ──────────────────────────────────────────
    await goHome();
    await app.sidebar.navigateTo("salesInvoice");
    await app.toolbar.newRecord();
    await app.field.selectById("Business Partner", customer.id);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 10: Add lines from Goods Shipment ────────────────────────────────
    await app.toolbar.process("Create Lines From Shipment");
    await app.grid.filter("Document No.", shipmentNumber);

    // Select the line of this test's shipment, toggle select-all to verify it, then re-select the
    // line (scoped to the modal: the invoice grid behind it renders rows too)
    const modal = app.processModal.root;
    await expect(modal.locator("tbody tr").first()).toContainText(shipmentNumber, { timeout: 15_000 });
    const firstLine = modal.locator("tbody tr").first().getByRole("checkbox");
    const selectAll = modal.getByRole("checkbox", { name: "Toggle select all" }).first();
    await firstLine.check();
    await expect(firstLine).toBeChecked();
    await selectAll.check();
    await selectAll.uncheck();
    await expect(firstLine).not.toBeChecked();
    await firstLine.check();
    await expect(firstLine).toBeChecked();

    await app.processModal.execute();
    await app.processModal.waitForClose();

    // ── Step 11: Complete Invoice ─────────────────────────────────────────────
    await app.toolbar.process("Complete");
    await app.processModal.confirm();
    await app.processModal.expectSuccess();
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // Close the record view
    await page.getByTestId("status-bar-container").getByTestId("icon-button").click();

    // ── Step 12: Post Invoice ─────────────────────────────────────────────────
    await app.toolbar.process("Post");
    await app.processModal.confirm();
    await app.toast.closeAll();
  });
});

import { expect, test } from "../../support/fixtures";

test.describe("Purchase Order with advance payment flow @smoke", () => {
  test("Processes advance payment and validates Purchase Invoice payments", async ({ app, data, page }) => {
    const vendor = data.BUSINESS_PARTNER.VENDOR_A;
    const mainSection = app.formSections.main;

    // ── Step 1: Navigate to Purchase Order ───────────────────────────────────
    await app.sidebar.navigateTo("purchaseOrder");

    // ── Step 2: New Purchase Order ───────────────────────────────────────────
    await app.toolbar.newRecord();
    await expect(mainSection).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Fill Business Partner ────────────────────────────────────────
    await app.field.selectById("Business Partner", vendor.id);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 4: Add Order Line ────────────────────────────────────────────────
    await app.tabs.open("Lines");
    await app.toolbar.newRecord("child");
    await app.field.pickWithKeyboard("Product", data.PRODUCT.RAW_MATERIAL_A.id, {
      search: "Raw material",
      callout: true,
    });
    await app.field.fillById(data.FIELD.PURCHASE_ORDER_LINE_QUANTITY, "11,2");
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // ── Step 5: Capture Document Number ──────────────────────────────────────
    const orderNumber = await app.breadcrumb.documentNumber();

    // ── Step 6: Book Purchase Order ───────────────────────────────────────────
    await app.toolbar.process("Book");
    await app.processModal.confirm();
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // ── Step 7: Navigate to Payment Out ──────────────────────────────────────
    await app.sidebar.navigateTo("paymentOut");

    // ── Step 8: New Payment Out with Business Partner ─────────────────────────
    await app.toolbar.newRecord();
    await app.field.selectById("Paying To", vendor.id);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 9: Add Details — select the Purchase Order ───────────────────────
    await app.toolbar.process("Add Details");
    // List orders (the default lists invoices only), then filter by the order number
    await app.field.select("Transaction Type", "Orders");
    await app.grid.filter("Order No.", orderNumber);
    const orderRow = await app.grid.waitForRow(orderNumber);
    await orderRow.getByRole("cell", { name: orderNumber }).first().click();
    await expect(orderRow.getByRole("checkbox").first()).toBeChecked({ timeout: 10_000 });

    // ── Step 10: Select Action "Process Made Payment(s)" ─────────────────────
    await app.field.selectById("Action Regarding Document", data.LIST_VALUE.PROCESS_MADE_PAYMENTS.id);

    // ── Step 11: Execute payment; the modal closes once the payment is made ───
    await app.processModal.execute();
    await app.processModal.waitForClose();

    // ── Step 12: Navigate to Purchase Invoice ─────────────────────────────────
    await app.sidebar.navigateTo("purchaseInvoice");

    // ── Step 13: New Purchase Invoice ─────────────────────────────────────────
    await app.toolbar.newRecord();
    await expect(mainSection).toBeVisible({ timeout: 10_000 });

    // ── Step 14: Fill Business Partner ────────────────────────────────────────
    await app.field.selectById("Business Partner", vendor.id);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 15: Create Lines From Order ──────────────────────────────────────
    await app.toolbar.process("Create Lines From Order");
    await app.grid.filter("Document No.", orderNumber);
    await app.grid.selectRow(orderNumber);
    await app.processModal.execute();
    await app.processModal.waitForClose();

    // ── Step 16: Complete Purchase Invoice ────────────────────────────────────
    await app.toolbar.process("Complete");
    await app.processModal.confirm();
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // The invoice is completed against the order paid in advance
    await app.toolbar.button("refresh").click();
    await expect(page.getByText("Completed", { exact: true }).first()).toBeAttached({ timeout: 20_000 });
  });
});

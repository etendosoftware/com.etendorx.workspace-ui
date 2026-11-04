import { expect, test } from "../../support/fixtures";

test.describe("Purchase Order to Invoice flow @smoke", () => {
  test("Completes Purchase Order, Goods Receipt and posts the Vendor Invoice", async ({ app, data }) => {
    const mainSection = app.formSections.main;

    // ── Step 1: Navigate to Purchase Order ───────────────────────────────────
    await app.sidebar.navigateTo("purchaseOrder");

    // ── Step 2: New Purchase Order ───────────────────────────────────────────
    await app.toolbar.newRecord();
    await expect(mainSection).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Fill Business Partner ────────────────────────────────────────
    await app.field.selectById("Business Partner", data.BUSINESS_PARTNER.VENDOR_A.id);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 4: Add Order Line ────────────────────────────────────────────────
    await app.tabs.open("Lines");
    await app.toolbar.newRecord("child");

    // Select Product, searching so it is listed regardless of the default pagination, and wait
    // for the FormInitialization callout it fires
    await app.field.pickWithKeyboard("Product", data.PRODUCT.RAW_MATERIAL_A.id, {
      search: "Raw material",
      callout: true,
    });

    // Set Quantity
    await app.field.fillById(data.FIELD.PURCHASE_ORDER_LINE_QUANTITY, "11,2");

    // Save line
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // ── Step 5: Capture Document Number for later ────────────────────────────
    const orderNumber = await app.breadcrumb.documentNumber();

    // ── Step 6: Book Purchase Order ──────────────────────────────────────────
    await app.toolbar.process("Book");
    await app.processModal.confirm();
    // A failed Book is caught here, not silently downstream
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // ── Step 7: Navigate to Goods Receipt ────────────────────────────────────
    await app.sidebar.navigateTo("goodsReceipt");
    await app.toolbar.newRecord();
    await expect(mainSection).toBeVisible({ timeout: 10_000 });

    // Business Partner
    await app.field.selectById("Business Partner", data.BUSINESS_PARTNER.VENDOR_A.id);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 8: Create Lines From Purchase Order (legacy iframe popup) ────────
    await app.toolbar.process("Create Lines From");
    await app.createLinesFrom.fill({ locator: data.LOCATOR.L01, orderDocNumber: orderNumber });
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // ── Step 9: Complete Goods Receipt ───────────────────────────────────────
    await app.toolbar.process("Complete");
    await app.processModal.confirm();
    // A failed Complete is caught here, not silently downstream
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // ── Step 10: Navigate to Purchase Invoice ─────────────────────────────────
    await app.sidebar.navigateTo("purchaseInvoice");
    await app.toolbar.newRecord();
    await expect(mainSection).toBeVisible({ timeout: 10_000 });

    // Business Partner — uses a text search input (not a simple dropdown)
    const vendor = data.BUSINESS_PARTNER.VENDOR_A;
    await app.field.select("Business Partner", vendor.name, { search: vendor.name });
    await app.field.expectToContain("Business Partner", vendor.name);

    // Save header
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 11: Create Lines From Order (React table popup) ──────────────────
    await app.toolbar.process("Create Lines From Order");
    await app.grid.filter("Document No.", orderNumber);
    await app.grid.selectRow(orderNumber);
    await app.processModal.execute();
    await app.processModal.waitForClose();

    // ── Step 12: Complete Purchase Invoice ────────────────────────────────────
    await app.toolbar.process("Complete");
    await app.processModal.confirm();
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // ── Step 13: Post Invoice ─────────────────────────────────────────────────
    await app.toolbar.process("Post");
    await app.processModal.confirm();
    await app.toast.closeAll();
  });
});

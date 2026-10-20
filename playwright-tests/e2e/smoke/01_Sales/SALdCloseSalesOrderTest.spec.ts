import { expect, test } from "../../support/fixtures";

const PROCESS_ORDER = "Process Order";

test.describe("Sales Orders - Create, Complete and Close @smoke", () => {
  test("should create a sales order, add lines, complete and close it", async ({ app, data }) => {
    // ── Step 1: Navigate to Sales Order ──────────────────────────────────────
    await app.sidebar.navigateTo("salesOrder");

    // ── Step 2: Create New Sales Order ────────────────────────────────────────
    await app.toolbar.newRecord();

    // ── Step 3: Fill header ───────────────────────────────────────────────────
    await app.field.selectById("Business Partner", data.BUSINESS_PARTNER.CUSTOMER_BARCELONA.id);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 4: Add order line ────────────────────────────────────────────────
    await app.tabs.open("Lines");
    await app.toolbar.newRecord("child");
    await app.field.selectById("Product", data.PRODUCT.DISTRIBUTION_GOOD_A.id, { level: "child" });
    await app.field.fillById(data.FIELD.SALES_ORDER_LINE_QUANTITY, "11");

    // Save line
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // ── Step 5: Process Order (Book) ──────────────────────────────────────────
    await app.toolbar.process("Book");
    await expect(app.processModal.legacyTitle).toHaveText(PROCESS_ORDER, { timeout: 10_000 });
    await app.processModal.confirm();

    // Assert the process completed successfully — fails with a clear error if not shown
    await app.processModal.expectSuccess(60_000);
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // ── Step 6: Close the Order ───────────────────────────────────────────────
    // We are already on the booked record — no need to navigate away and re-find it.
    await app.toolbar.process("Close");
    await expect(app.processModal.legacyTitle).toHaveText(PROCESS_ORDER, { timeout: 10_000 });
    await app.processModal.confirm();

    // Assert the process completed successfully — fails with a clear error if not shown
    await app.processModal.expectSuccess(60_000);
    await app.processModal.closeResult();
    await app.toast.closeAll();
  });
});

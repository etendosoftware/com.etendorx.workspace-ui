import { ATTRIBUTE } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import { TABS } from "../../support/registry/windows";

const COSTING_BACKGROUND_PROCESS = "Costing Background process";
const RUN_IMMEDIATELY = "Run Immediately";
const SCHEDULE_PROCESS = "Schedule Process";
const RESCHEDULE_PROCESS = "Reschedule Process";
const SUCCESS_STATUS = "Success";

test.describe("Purchase Order to Landed Cost flow @smoke", () => {
  test("Processes Landed Cost from Goods Receipt and validates cost distribution", async ({ app, data, page }) => {
    const vendor = data.BUSINESS_PARTNER.VENDOR_A;
    const mainSection = app.formSections.main;

    // ── Step 1: Navigate to Purchase Order ───────────────────────────────────
    await app.sidebar.navigateTo("purchaseOrder");

    // ── Step 2: New Purchase Order ───────────────────────────────────────────
    await app.toolbar.newRecord();
    await expect(mainSection).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Fill Business Partner ────────────────────────────────────────
    await app.field.select("Business Partner", vendor.name, { search: vendor.name });
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 4: Add Order Line ────────────────────────────────────────────────
    await app.tabs.open("Lines");
    await app.toolbar.newRecord("child");

    // "Raw material A" has an attribute set (serial number): its value is set on the receipt line
    const product = data.PRODUCT.RAW_MATERIAL_A;
    await app.field.select("Product", product.name, { search: product.name, callout: true, level: "child" });

    await app.field.fillById(data.FIELD.PURCHASE_ORDER_LINE_QUANTITY, "10");
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // ── Step 5: Book Purchase Order ───────────────────────────────────────────
    await app.toolbar.process("Book");
    await app.processModal.confirm();
    await app.processModal.closeResult();
    await app.toast.closeAll();

    const purchaseOrderNumber = await app.breadcrumb.documentNumber();

    // ── Step 6: New Goods Receipt ─────────────────────────────────────────────
    await app.sidebar.navigateTo("goodsReceipt");
    await app.toolbar.newRecord();
    await expect(mainSection).toBeVisible({ timeout: 10_000 });

    // ── Step 7: Fill Business Partner on Goods Receipt ───────────────────────
    await app.field.select("Business Partner", vendor.name, { search: vendor.name });
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 8: Create Lines From Purchase Order (legacy iframe popup) ────────
    await app.toolbar.process("Create Lines From");
    await app.createLinesFrom.fill({ locator: data.LOCATOR.L01, orderDocNumber: purchaseOrderNumber });
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // ── Step 9: Capture Goods Receipt Document Number ─────────────────────────
    const goodsReceiptNumber = await app.breadcrumb.documentNumber();

    // ── Step 10: Set the serial number of the receipt line ───────────────────
    // As in Classic, the order line does not ask for it (the product callout clears the attribute
    // set the field's display logic reads); the receipt line does, and Complete requires it.
    await app.tabs.open("Lines");
    await app.grid.openForm(product.name);
    await app.attributeSelector.open(data.FIELD.GOODS_RECEIPT_LINE_ATTRIBUTE_SET_VALUE);
    await app.attributeSelector.fill(ATTRIBUTE.SERIAL_NUMBER, data.uniqueValue("PROe"));
    await app.attributeSelector.confirm();
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // ── Step 11: Complete Goods Receipt ──────────────────────────────────────
    await app.toolbar.process("Complete");
    await app.processModal.confirm();
    await app.processModal.expectSuccess();
    await app.processModal.closeResult();
    await app.toast.closeAll();

    // ── Step 12: Run the "Costing Background" process for this client ─────────
    // The Landed Cost process needs the receipt costed. The sample data only schedules the
    // costing process for another client, so run it for QA Testing: reuse the request a previous
    // run created, otherwise create one that runs immediately. Then wait for one more
    // successful run in its Process Monitor, which costs the receipt.
    await app.sidebar.navigateTo("processRequest");
    // The list is short (the system processes plus this client's): wait for it and look for the row
    await page.locator("tbody tr:visible").first().waitFor({ state: "visible", timeout: 20_000 });
    const requestExists = await app.grid.row(COSTING_BACKGROUND_PROCESS).isVisible();
    if (requestExists) {
      await app.grid.openForm(COSTING_BACKGROUND_PROCESS);
    } else {
      await app.toolbar.newRecord();
      await app.field.select("Process", COSTING_BACKGROUND_PROCESS, { search: COSTING_BACKGROUND_PROCESS });
      await app.field.select("Timing", RUN_IMMEDIATELY);
      await app.toolbar.save();
      await app.toast.closeAll();
    }

    await app.tabs.open("Process Monitor");
    // The monitor lists the newest run first and renders only the first rows, so compare the newest
    // run before and after scheduling instead of counting rows. A reused request has run before.
    const newestRun = page.getByTestId(`Tab__${TABS.PROCESS_REQUEST_MONITOR}`).locator("tbody tr").first();
    let newestRunBefore = "";
    if (requestExists) {
      await newestRun.waitFor({ state: "visible", timeout: 20_000 });
      newestRunBefore = await newestRun.innerText();
    }
    await app.toolbar.process(requestExists ? RESCHEDULE_PROCESS : SCHEDULE_PROCESS);
    await app.toast.closeAll();
    await expect(async () => {
      await app.toolbar.inTab(TABS.PROCESS_REQUEST_MONITOR).button("refresh").click();
      await expect(newestRun).not.toHaveText(newestRunBefore, { timeout: 2_000 });
      await expect(newestRun).toContainText(SUCCESS_STATUS, { timeout: 2_000 });
    }).toPass({ intervals: [1_000, 2_000, 5_000], timeout: 60_000 });

    // ── Step 13: New Landed Cost ──────────────────────────────────────────────
    await app.sidebar.navigateTo("landedCost");
    await app.toolbar.newRecord();
    await expect(mainSection).toBeVisible({ timeout: 10_000 });

    // ── Step 14: Save Landed Cost header ─────────────────────────────────────
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Step 15: Add Cost Line ─────────────────────────────────────────────────
    await app.tabs.open("Cost");
    await app.toolbar.newRecord("child");
    await app.field.fillById(data.FIELD.LANDED_COST_AMOUNT, "1");
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // ── Step 16: Add Receipt Line ─────────────────────────────────────────────
    await app.tabs.open("Receipt");
    await app.toolbar.newRecord("child");

    // Pick the Goods Receipt, searching it by document number
    await app.field.select("Goods Receipt", goodsReceiptNumber, {
      search: goodsReceiptNumber,
      exact: false,
      fieldId: data.FIELD.LANDED_COST_RECEIPT_GOODS_RECEIPT,
    });

    // Save receipt line
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // ── Step 17: Process Landed Cost ─────────────────────────────────────────
    await app.toolbar.process("Process");
    await app.processModal.executeButton().waitFor({ state: "visible", timeout: 10_000 });
    await app.processModal.execute();

    // ── Step 18: Verify completion ────────────────────────────────────────────
    // Visible text only: the Process Request tab left open behind keeps its monitor log, which
    // repeats the same message, in the DOM
    await expect(
      page
        .getByText(/Process completed success/i)
        .filter({ visible: true })
        .first()
    ).toBeVisible({
      timeout: 30_000,
    });
  });
});

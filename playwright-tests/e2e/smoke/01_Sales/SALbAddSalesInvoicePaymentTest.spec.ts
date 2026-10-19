import { expect, test } from "../../support/fixtures";
import { runAndWaitForResponse } from "../../support/wait";

const DEFAULTS_URL = /DefaultsProcessActionHandler/;
/** Shown by the legacy Process Invoices page when the customer has credit from previous runs. */
const DO_NOT_USE_CREDIT = /Do not use Credit/i;
const CREDIT_DIALOG_TIMEOUT = 20_000;

test.describe("Sales Invoice - Add Payment @smoke", () => {
  test("should create a sales invoice, complete it and add payment", async ({ app, data, page }) => {
    // ── Step 1: Navigate to Sales Invoice ─────────────────────────────────────
    await app.sidebar.navigateTo("salesInvoice");

    // ── Step 2: Create New Sales Invoice ──────────────────────────────────────
    await app.toolbar.newRecord();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Fill Business Partner — "Customer A" ──────────────────────────
    // Customer A has confirmed sales prices for Final good A.
    // Customer Barcelona auto-applies existing credits on completion, hiding "Add Payment".
    const customer = data.BUSINESS_PARTNER.CUSTOMER_A;
    await app.field.select("Business Partner", customer.name, { search: customer.name });

    // Save header to populate defaults
    await app.toolbar.save();
    await app.toast.closeAll();
    // Synchronization: wait for the Draft status so the header is fully rendered before opening Lines
    await expect(page.getByText("Draft", { exact: true }).first()).toBeAttached({ timeout: 60_000 });

    // ── Step 4: Add Invoice Line ───────────────────────────────────────────────
    await app.tabs.open("Lines");
    await app.toolbar.newRecord("child");

    // Select Product: "Final good A" with the keyboard and wait for the FormInitialization
    // callout so the price is populated before setting the quantity
    const product = data.PRODUCT.FINAL_GOOD_A;
    await app.field.pickWithKeyboard("Product", product.id, { search: product.name, callout: true, level: "child" });

    // The callout may still be applying values after its response: the UOM is filled last
    await expect(app.field.container("UOM")).toContainText(/.+/, { timeout: 15_000 });

    // Set Invoiced Quantity: 100 (large qty ensures gross≈220 far exceeds any accumulated
    // Customer A credits from FINb test runs, preventing silent auto-payment of the invoice)
    await app.field.fillById(data.FIELD.SALES_INVOICE_LINE_QUANTITY, "100");

    // Save line
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // ── Step 5: Complete the Invoice ──────────────────────────────────────────
    await app.toolbar.process("Complete");
    await expect(app.processModal.legacyTitle).toContainText("Process Invoices", { timeout: 15_000 });
    await app.processModal.confirm();

    // "Use Credit Payment" sub-dialog — appears when Customer A has existing credits or
    // prepayments from previous FINbInvoiceToPaymentTest runs. "Do not use Credit" keeps the
    // credit from being applied, which would set Payment Complete=Yes and hide "Add Payment".
    await app.processModal.clickLegacyButtonIfShown(DO_NOT_USE_CREDIT, CREDIT_DIALOG_TIMEOUT);
    await app.processModal.finishLegacy();
    await app.toast.closeAll();

    // Refresh to return to the invoice header view and confirm Completed status.
    // Without this, the process menu may target the Lines toolbar instead of the header.
    await app.toolbar.button("refresh").click();
    await expect(page.getByText("Completed", { exact: true }).first()).toBeAttached({ timeout: 20_000 });

    // ── Step 6: Add Payment ───────────────────────────────────────────────────
    await runAndWaitForResponse(page, DEFAULTS_URL, () => app.toolbar.process("Add Payment"));

    // ── Step 7: Configure Payment Transaction ─────────────────────────────────
    await app.field.selector("Action Regarding Document").waitFor({ state: "visible", timeout: 30_000 });
    await page.locator("tbody tr").first().waitFor({ state: "attached", timeout: 30_000 });
    await app.field.select("Action Regarding Document", data.LIST_VALUE.PROCESS_RECEIVED_PAYMENTS.name);
    await app.processModal.execute();

    // Verify payment transaction toast
    await app.toast.expectSuccess(/Created Payment:\s*\d+\./);
  });
});

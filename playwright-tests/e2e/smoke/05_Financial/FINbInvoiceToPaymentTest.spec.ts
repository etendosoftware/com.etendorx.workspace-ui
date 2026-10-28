import type { Locator } from "@playwright/test";
import { expect, test } from "../../support/fixtures";
import { runAndWaitForDatasource, runAndWaitForFormInitialization, runAndWaitForResponse } from "../../support/wait";

const ADD_PAYMENT_URL = /AddPaymentActionHandler/;
const DO_NOT_USE_CREDIT = /Do not use Credit/i;
const CREDIT_DIALOG_TIMEOUT = 20_000;
/** The payment exceeds the invoice by this amount, which must end up as generated credit. */
const OVERPAYMENT = 1.74;
/** As Classic, Execute waits until the overpaid amount says what to do with it: left as credit. */
const OVERPAYMENT_ACTION = "Overpayment Action";
const LEAVE_AS_CREDIT = "Leave the credit to be used later";

/** Numeric value of an amount input ("26,26" or "26.26"). */
const readAmount = async (input: Locator): Promise<number> =>
  Number.parseFloat((await input.inputValue()).replace(",", ".")) || 0;

const roundToCents = (value: number): number => Math.round(value * 100) / 100;

test.describe("Financial Test 2 - Sales Invoice to Payment In @smoke", () => {
  test("Creates Sales Invoice, completes it, creates Payment In and links the invoice", async ({ app, data, page }) => {
    test.setTimeout(360_000);
    const customer = data.BUSINESS_PARTNER.CUSTOMER_A;
    const statusBar = page.getByTestId("status-bar-container").filter({ visible: true });

    // ── Step 1: Navigate to Sales Invoice ────────────────────────────────────
    await app.sidebar.navigateTo("salesInvoice");

    // ── Step 2: Create New Sales Invoice ─────────────────────────────────────
    await app.toolbar.newRecord();
    await expect(app.formSections.main).toBeVisible({ timeout: 10_000 });
    await app.field.select("Business Partner", customer.name, { search: customer.name });

    // Save header to populate defaults
    await app.toolbar.save();
    await app.toast.closeAll();

    // Verify Draft status
    await expect(page.getByText("Draft", { exact: true }).first()).toBeAttached({ timeout: 60_000 });

    // ── Step 3: Add Invoice Line ──────────────────────────────────────────────
    await app.tabs.open("Lines");
    await app.toolbar.newRecord();

    // Product: Final good A, with the keyboard (the search input intercepts pointer events)
    const product = data.PRODUCT.FINAL_GOOD_A;
    await app.field.pickWithKeyboard("Product", product.id, { search: product.name, callout: true, level: "child" });

    // Invoiced Quantity: 13.13
    await app.field.fillById(data.FIELD.SALES_INVOICE_LINE_QUANTITY, "13.13");

    // Save line
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // Verify Net Amount: 26.26
    await expect(page.locator("td").filter({ hasText: "26.26" }).first()).toBeAttached({ timeout: 20_000 });

    // ── Step 4: Complete Sales Invoice ───────────────────────────────────────
    await app.toolbar.process("Complete");
    await expect(app.processModal.legacyTitle).toContainText("Process Invoices", { timeout: 15_000 });
    await app.processModal.confirm();

    // "Use Credit Payment" sub-dialog: give the server up to 20s to show it
    await app.processModal.clickLegacyButtonIfShown(DO_NOT_USE_CREDIT, CREDIT_DIALOG_TIMEOUT);

    // The legacy modal auto-closes after the success message: accept either outcome
    await app.processModal.finishLegacy();
    await app.toast.closeAll();

    // Refresh and capture invoice number
    await app.toolbar.button("refresh").click();
    const invoiceNumber = await app.breadcrumb.documentNumber();

    // Read the invoice outstanding amount (net + taxes) the payment must fully cover. Wait until
    // the field holds the real grand total, not the transient "0" shown while the record reloads
    // after the completion refresh: require the same non-zero value on two consecutive reads.
    const outstandingInput = page.locator('input[name="outstandingAmount"]').first();
    await outstandingInput.waitFor({ state: "attached", timeout: 10_000 });
    let invoiceTotal = 0;
    let previousRead = -1;
    await expect
      .poll(
        async () => {
          const value = await readAmount(outstandingInput);
          const settled = value > 0 && value === previousRead;
          previousRead = value;
          if (settled) {
            invoiceTotal = value;
          }
          return settled ? value : 0;
        },
        { timeout: 15_000 }
      )
      .toBeGreaterThan(0);

    // Payment is intentionally set to invoiceTotal + 1.74 to generate a credit of 1.74.
    // This tests Etendo's overpayment/credit tracking feature.
    const paymentAmount = roundToCents(invoiceTotal + OVERPAYMENT);
    const paymentAmountStr = String(paymentAmount);

    // ── Step 5: Navigate to Payment In ───────────────────────────────────────
    await app.sidebar.navigateTo("paymentIn");

    // ── Step 6: Create new Payment In ────────────────────────────────────────
    // The new record's form initialization renders the form again and closes a dropdown opened before it
    await runAndWaitForFormInitialization(page, () => app.toolbar.newRecord());
    await expect(app.formSections.main).toBeVisible({ timeout: 10_000 });

    // Received From (Business Partner): Customer A
    await app.field.select("Received From", customer.name, { search: customer.name });

    // Save to populate defaults
    await app.toolbar.save();
    await app.toast.closeAll();

    // Amount: invoiceTotal + 1.74
    const amountInput = page.locator('input[name="amount"][aria-label="Amount"]').first();
    const saveButton = app.toolbar.button("save");
    await amountInput.scrollIntoViewIfNeeded();
    await amountInput.fill(paymentAmountStr);
    await expect(amountInput).toHaveValue(paymentAmountStr, { timeout: 5_000 });
    if (!(await saveButton.isEnabled())) {
      // Nudge the change detection by writing a slightly different value first, then the real one.
      await amountInput.fill(String(roundToCents(paymentAmount - 0.01)));
      await amountInput.fill(paymentAmountStr);
      await expect(amountInput).toHaveValue(paymentAmountStr, { timeout: 5_000 });
    }
    await expect(saveButton).toBeEnabled({ timeout: 10_000 });

    // Save Payment In
    await saveButton.click();
    await app.toast.closeAll();

    // Verify Status: Awaiting Payment once the server response populates the status bar
    await expect(statusBar.getByText("Awaiting Payment")).toBeVisible({ timeout: 20_000 });

    // ── Step 7: Open Add Details process ─────────────────────────────────────
    await app.toolbar.process("Add Details");

    // Wait for the Add Details grid to load (scoped to the modal: the invoice grid behind it
    // shows the same document numbers)
    const modal = app.processModal.root;
    await modal.locator("tbody tr").first().waitFor({ state: "attached", timeout: 30_000 });

    // Filter by the full invoice reference
    const fullInvoiceNo = `I/${invoiceNumber}`;
    await app.grid.filter("Invoice No.", fullInvoiceNo);

    // Select the matching row. The invoice is NOT auto-selected for a manually created Payment
    // In (the backend does not pre-flag it), so select it, guarding against toggling it off.
    // Rows of the Add Details grid are virtualized: wait for the row to be attached, not visible
    const targetRow = modal.locator("tbody tr").filter({ hasText: fullInvoiceNo }).first();
    await targetRow.waitFor({ state: "attached", timeout: 30_000 });
    const rowCheckbox = targetRow.getByRole("checkbox", { name: "Toggle select row" });
    await rowCheckbox.scrollIntoViewIfNeeded();
    await rowCheckbox.check();
    await expect(rowCheckbox).toBeChecked({ timeout: 30_000 });

    // Wait for the payment allocation to settle to the full invoice amount before executing:
    // selecting the invoice recomputes "Amount on Invoices and/or Orders" asynchronously, and
    // executing before it settles sends an incomplete payment that never completes.
    const allocatedTotal = page.locator('input[aria-label="Amount on Invoices and/or Orders"]').first();
    await expect
      .poll(() => readAmount(allocatedTotal), { timeout: 15_000 })
      .toBeGreaterThanOrEqual(invoiceTotal - 0.005);

    // ── Step 8: Select action and execute payment ─────────────────────────────
    await runAndWaitForDatasource(page, () => app.field.selector("Action Regarding Document").click());
    const receivedPayments = page.getByTestId(`OptionItem__${data.LIST_VALUE.PROCESS_RECEIVED_PAYMENTS.id}`);
    await receivedPayments.waitFor({ state: "visible", timeout: 15_000 });
    await receivedPayments.click();
    await expect(app.processModal.executeButton(), "Execute is enabled with an unhandled overpayment").toBeDisabled();
    await app.field.select(OVERPAYMENT_ACTION, LEAVE_AS_CREDIT);

    // Wait for the API response — the success toast may auto-dismiss before we can catch it.
    // After a successful payment the process modal closes by itself.
    await runAndWaitForResponse(page, ADD_PAYMENT_URL, () => app.processModal.execute(), 60_000);
    await app.toast.closeAll();

    // ── Step 9: Verify final payment state ───────────────────────────────────
    await app.toolbar.button("refresh").click({ timeout: 30_000 });

    await expect(statusBar.getByText("Payment Received")).toBeVisible({ timeout: 20_000 });
    await expect(statusBar.locator('span[name="generatedCredit"]')).toHaveText("1.74", { timeout: 10_000 });
  });
});

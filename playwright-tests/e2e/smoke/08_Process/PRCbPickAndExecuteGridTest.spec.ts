import type { Locator } from "@playwright/test";
import { expect, test } from "../../support/fixtures";
import { blockRequests } from "../../support/network";
import { overrideProcessDefinition } from "../../support/processOverrides";
import { WINDOW_IDS } from "../../support/registry/windows";
import { runAndWaitForFormInitialization } from "../../support/wait";

const ABORT_MESSAGE = "Aborted by the E2E onProcess";
/** A migrated onProcess (`em_etmeta_onprocess`) whose validation always fails: `{ severity, text }`. */
const ABORTING_ON_PROCESS = `async () => ({ severity: "error", text: "${ABORT_MESSAGE}" })`;
const ADD_PAYMENT_HANDLER = /AddPaymentActionHandler/;
/** Payment amount of the header: selecting the invoice allocates it, not the 4290.00 pending. */
const PAYMENT_AMOUNT = "100";
const EDITED_AMOUNT = "60";
const ALLOCATED_TOTAL = 'input[aria-label="Amount on Invoices and/or Orders"]';
const LINE_AMOUNT = 'input[aria-label="Amount"]';
/** The 40.00 of the payment no invoice takes: as Classic, Execute waits until it says what to do with it. */
const OVERPAYMENT_ACTION = "Overpayment Action";
const LEAVE_AS_CREDIT = "Leave the credit to be used later";

/** Types an amount in the cell editor of a selected row and leaves the cell. */
async function editLineAmount(cell: Locator, amount: string): Promise<void> {
  await cell.fill(amount);
  await cell.press("Tab");
}

/**
 * Pick-and-Execute grid of a process modal: the amount follows the row selection, a numeric cell
 * can be edited, and a migrated onProcess validation stops the execution. The bare core has no
 * migrated onProcess, so the spec injects one into the Add Payment definition the window
 * metadata carries; the payment request is blocked as a safety net and must never be sent.
 */
test.describe("Pick and Execute grid - selection, cell edit and onProcess abort @smoke @process", () => {
  test("allocates the selected invoice and aborts when onProcess fails", async ({ app, page, data }) => {
    const override = await overrideProcessDefinition(page, WINDOW_IDS.PAYMENT_IN, data.PROCESS.ADD_PAYMENT, {
      etmetaOnprocess: ABORTING_ON_PROCESS,
    });
    const payment = await blockRequests(page, ADD_PAYMENT_HANDLER);
    const customer = data.BUSINESS_PARTNER.CUSTOMER_A;

    await app.sidebar.navigateTo("paymentIn");
    // The new record's form initialization re-renders the form: a dropdown opened before it is closed
    await runAndWaitForFormInitialization(page, () => app.toolbar.newRecord());
    await app.field.select("Received From", customer.name, { search: customer.name });
    await app.toolbar.save();
    await app.toast.closeAll();
    await app.field.fill("Amount", PAYMENT_AMOUNT);
    await app.toolbar.save();
    await app.toast.closeAll();

    await app.toolbar.process("Add Details");
    expect(override.applied, "the Add Payment definition was not found in the window metadata").toBeGreaterThan(0);
    const modal = app.processModal.root;
    const invoiceNumber = data.SAMPLE_DOCUMENT.SALES_INVOICE_PENDING;
    await app.grid.filter("Invoice No.", invoiceNumber);
    const invoice = app.grid.rowWithCell(invoiceNumber, modal);
    const lineAmount = invoice.locator(LINE_AMOUNT);
    const allocated = modal.locator(ALLOCATED_TOTAL);

    // Selecting allocates the payment amount, and the amount cell is editable
    await app.grid.setRowSelected(invoice, true);
    await expect(lineAmount).toHaveValue(PAYMENT_AMOUNT);
    await expect(allocated).toHaveValue("100.00");
    await editLineAmount(lineAmount, EDITED_AMOUNT);
    await expect(allocated).toHaveValue("60.00");

    // Deselecting zeroes the line amount: selected again, it gets the default, not the edited one
    await app.grid.setRowSelected(invoice, false);
    await expect(lineAmount).toBeHidden();
    await expect(allocated).toHaveValue("0.00");
    await app.grid.setRowSelected(invoice, true);
    await expect(lineAmount, "the deselected invoice kept its edited amount").toHaveValue(PAYMENT_AMOUNT);
    await editLineAmount(lineAmount, EDITED_AMOUNT);
    await expect(allocated).toHaveValue("60.00");

    await app.field.selector("Action Regarding Document").click();
    await page.getByTestId(`OptionItem__${data.LIST_VALUE.PROCESS_RECEIVED_PAYMENTS.id}`).click();
    await expect(app.field.selector(OVERPAYMENT_ACTION)).toBeVisible();
    await expect(app.processModal.executeButton(), "Execute is enabled with an unhandled difference").toBeDisabled();
    await app.field.select(OVERPAYMENT_ACTION, LEAVE_AS_CREDIT);
    await app.processModal.execute();

    await expect(app.processModal.messageBar).toContainText(ABORT_MESSAGE);
    await expect(app.processModal.title).toBeVisible();
    expect(payment.sent, "onProcess failed but the payment was still sent").toBe(false);
  });
});

import type { Locator, Page } from "@playwright/test";
import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import type * as data from "../../support/registry/data";
import { TABS } from "../../support/registry/windows";

type Data = typeof data;

const SPAIN_CASHBOOK = "Spain Cashbook";
const BP_DEPOSIT = { value: "BPD", name: "BP Deposit" };
/** Quantity of the invoice line: a total above the two deposits' partial amount. */
const INVOICE_QUANTITY = "50";
/** First deposit: part of the invoice. */
const PARTIAL_AMOUNT = 40;
/** Second deposit: the rest of the invoice plus this, left as credit. */
const EXTRA_AMOUNT = 20;
const DO_NOT_USE_CREDIT = /Do not use Credit/i;
const CREDIT_DIALOG_TIMEOUT = 20_000;
const ADD_PAYMENT = "Add Payment";
const RECEIVED_FROM = "Received From";
const ACTUAL_PAYMENT = "Actual Payment";
const EXPECTED_PAYMENT = "Expected Payment";
const ALLOCATED = "Amount on Invoices and/or Orders";
const DIFFERENCE = "There is a difference of";
const OVERPAYMENT_ACTION = "Overpayment Action";
const LEAVE_AS_CREDIT = "Leave the credit to be used later";
const ACTION_REGARDING_DOCUMENT = "Action Regarding Document";
const INVOICE_NO = "Invoice No.";
const LINE_AMOUNT = 'input[aria-label="Amount"]';

/** Asserts the number an input shows ("40", "40.00" and "40.0" are the same amount). */
async function expectAmount(input: Locator, amount: number): Promise<void> {
  await expect.poll(async () => Number(await input.inputValue())).toBe(amount);
}

/** Creates and completes a sales invoice of Customer A; returns its document number. */
async function createCompletedSalesInvoice(app: App, sample: Data, page: Page): Promise<string> {
  const customer = sample.BUSINESS_PARTNER.CUSTOMER_A;
  await app.sidebar.navigateTo("salesInvoice");
  await app.toolbar.newRecord();
  await app.field.select("Business Partner", customer.name, { search: customer.name });
  await app.toolbar.save();
  await app.toast.closeAll();
  await expect(page.getByText("Draft", { exact: true }).first()).toBeAttached({ timeout: 60_000 });
  await app.breadcrumb.documentNumber();
  const invoiceNumber = await app.field.input("Document No.").inputValue();

  await app.tabs.open("Lines");
  await app.toolbar.newRecord("child");
  const product = sample.PRODUCT.FINAL_GOOD_A;
  await app.field.pickWithKeyboard("Product", product.id, { search: product.name, callout: true, level: "child" });
  await expect(app.field.container("UOM")).toContainText(/.+/, { timeout: 15_000 });
  await app.field.fillById(sample.FIELD.SALES_INVOICE_LINE_QUANTITY, INVOICE_QUANTITY);
  await app.toolbar.save("child");
  await app.toast.closeAll();

  await app.toolbar.process("Complete");
  await expect(app.processModal.legacyTitle).toContainText("Process Invoices", { timeout: 15_000 });
  await app.processModal.confirm();
  // Customer A has credit from other specs: it is not used, so the invoice stays pending
  await app.processModal.clickLegacyButtonIfShown(DO_NOT_USE_CREDIT, CREDIT_DIALOG_TIMEOUT);
  await app.processModal.finishLegacy();
  await app.toast.closeAll();
  return invoiceNumber;
}

/**
 * Starts a deposit of Spain Cashbook received from Customer A, as the user does in the Transaction
 * tab: a new BP Deposit whose payment is created with the "+" of Payment (Add Payment). Returns
 * the row of the invoice in the Order/Invoice grid of Add Payment.
 */
async function startDepositPayingInvoice(app: App, sample: Data, invoiceNumber: string): Promise<Locator> {
  const customer = sample.BUSINESS_PARTNER.CUSTOMER_A;
  await app.toolbar.inTab(TABS.FINANCIAL_ACCOUNT_TRANSACTION).newRecord();
  await app.field.pickWithKeyboard("Transaction Type", BP_DEPOSIT.value, {
    search: BP_DEPOSIT.name,
    fieldId: sample.FIELD.FINANCIAL_ACCOUNT_TRANSACTION_TYPE,
  });
  await app.selectorModal(sample.FIELD.FINANCIAL_ACCOUNT_TRANSACTION_PAYMENT).addButton.click();
  await app.processModal.expectTitle(ADD_PAYMENT);
  await app.field.selectById(RECEIVED_FROM, customer.id, { search: customer.name });
  const modal = app.processModal.root;
  await app.grid.filter(INVOICE_NO, invoiceNumber, modal);
  return app.grid.rowWithCell(invoiceNumber, modal);
}

/** Types the amount the customer paid and leaves the field. */
async function setActualPayment(app: App, amount: number): Promise<void> {
  const actualPayment = app.field.input(ACTUAL_PAYMENT);
  await actualPayment.fill(amount.toFixed(2));
  await actualPayment.press("Tab");
}

/** Executes Add Payment: the payment comes back to the transaction, which is saved. */
async function executeAndSaveDeposit(app: App, sample: Data, depositAmount: number): Promise<void> {
  await app.field.selectById(ACTION_REGARDING_DOCUMENT, sample.LIST_VALUE.PROCESS_RECEIVED_PAYMENTS.id);
  await app.processModal.execute();
  await app.processModal.waitForClose();

  // The created payment is the Payment of the transaction, whose callout takes its amount
  await app.field.expectToContain("Payment", sample.BUSINESS_PARTNER.CUSTOMER_A.name);
  await expectAmount(app.field.input("Deposit Amount"), depositAmount);
  await app.toolbar.save();
  await app.toast.closeAll();
}

/**
 * A customer pays a sales invoice with two bank deposits, each registered in the Transaction tab of
 * the financial account with the "+" of Payment, which opens Add Payment, as in Classic:
 * - picking the customer selects nothing; selecting the invoice expects its outstanding amount;
 * - the Actual Payment typed is distributed to the invoice: part of it first, and then the rest
 *   plus an amount no invoice takes, which Overpayment Action leaves as credit;
 * - each payment comes back to its transaction with its amount, and the invoice ends paid.
 */
test.describe("Financial Account - deposits paying a sales invoice @smoke", () => {
  test("pays an invoice partially and then in full with credit, from transaction deposits", async ({
    app,
    data,
    page,
  }) => {
    const invoiceNumber = await createCompletedSalesInvoice(app, data, page);

    await app.sidebar.navigateTo("financialAccount");
    await app.grid.filter("Name", SPAIN_CASHBOOK);
    await app.grid.selectRow(SPAIN_CASHBOOK);
    await app.tabs.open("Transaction");

    // ── First deposit: part of the invoice ────────────────────────────────────
    let invoice = await startDepositPayingInvoice(app, data, invoiceNumber);
    await expect(invoice.getByRole("checkbox").first()).not.toBeChecked();
    await app.grid.setRowSelected(invoice, true);
    const expectedPayment = app.field.input(EXPECTED_PAYMENT);
    await expect.poll(async () => Number(await expectedPayment.inputValue())).toBeGreaterThan(PARTIAL_AMOUNT);
    const outstanding = Number(await expectedPayment.inputValue());
    // Selected with nothing paid yet: the invoice takes nothing and there is no difference
    await expectAmount(invoice.locator(LINE_AMOUNT), 0);
    await expectAmount(app.field.input(DIFFERENCE), 0);

    await setActualPayment(app, PARTIAL_AMOUNT);
    await expectAmount(invoice.locator(LINE_AMOUNT), PARTIAL_AMOUNT);
    await expectAmount(app.field.input(ALLOCATED), PARTIAL_AMOUNT);
    await expectAmount(app.field.input(DIFFERENCE), 0);
    await expect(app.field.selector(OVERPAYMENT_ACTION)).toBeHidden();
    await executeAndSaveDeposit(app, data, PARTIAL_AMOUNT);

    // ── Second deposit: the rest of the invoice and some credit ───────────────
    const rest = Math.round((outstanding - PARTIAL_AMOUNT) * 100) / 100;
    const secondDeposit = rest + EXTRA_AMOUNT;
    invoice = await startDepositPayingInvoice(app, data, invoiceNumber);
    await app.grid.setRowSelected(invoice, true);
    await expectAmount(app.field.input(EXPECTED_PAYMENT), rest);

    await setActualPayment(app, secondDeposit);
    await expectAmount(invoice.locator(LINE_AMOUNT), rest);
    await expectAmount(app.field.input(ALLOCATED), rest);
    await expectAmount(app.field.input(DIFFERENCE), EXTRA_AMOUNT);
    await app.field.select(OVERPAYMENT_ACTION, LEAVE_AS_CREDIT);
    await executeAndSaveDeposit(app, data, secondDeposit);

    // ── The invoice is paid ───────────────────────────────────────────────────
    await app.sidebar.navigateTo("salesInvoice");
    await app.grid.filter("Document No.", invoiceNumber);
    await app.grid.openForm(invoiceNumber);
    await expect(page.locator('span[name="paymentComplete"]:visible')).toHaveText("Yes", { timeout: 20_000 });
  });
});

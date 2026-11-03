import { expect, test } from "../../support/fixtures";
import { TABS } from "../../support/registry/windows";

const BUSINESS_PARTNER = "Business Partner";
const NAME_COLUMN = "Name";
const SPAIN_CASHBOOK = "Spain Cashbook";
const TRANSACTION_TYPE = "Transaction Type";
const BP_DEPOSIT = { value: "BPD", name: "BP Deposit" };
const ADD_PAYMENT = "Add Payment";
/** Add Payment opened for a deposit of the account: a payment received into the account. */
const RECEIVED_IN = "Received In";
const DEPOSIT_TO = "Deposit To";
const RECEIVED_FROM = "Received From";
const ACTUAL_PAYMENT = "Actual Payment";
const ACTION_REGARDING_DOCUMENT = "Action Regarding Document";
const PAYMENT = "Payment";
const DEPOSIT_AMOUNT = "Deposit Amount";
const DIFFERENCE = "There is a difference of";
const OVERPAYMENT_ACTION = "Overpayment Action";
const LEAVE_AS_CREDIT = "Leave the credit to be used later";
/** Time for the process scripts and the display logic to react to a typed amount. */
const SETTLE_TIMEOUT = 10_000;
const AMOUNT_TIMEOUT = 60_000;

/** An amount unique to the run, below 1000 so it shows without a group separator ("123.45"). */
function uniqueAmount(): string {
  return (100 + (Date.now() % 80_000) / 100).toFixed(2);
}

/**
 * The buttons a selector field shows next to it in a form, from its selector definition: the
 * magnifying glass (the selector has grid fields) opens a popup with the records filtered per
 * column, and the "+" (the selector has a process) opens the process that creates the record and
 * writes it back into the field. The form record is never saved; the "+" creates a payment received
 * from a customer with nothing pending, left as credit.
 */
test.describe("Form - selector search popup and add button @smoke @form", () => {
  test("the magnifying glass of a selector picks the record filtered in its popup", async ({ app, data }) => {
    const customer = data.BUSINESS_PARTNER.CUSTOMER_A.name;
    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.newRecord();

    const lookup = app.selectorModal(data.FIELD.SALES_ORDER_BUSINESS_PARTNER);
    await lookup.open();
    await expect(lookup.dialog).toContainText(BUSINESS_PARTNER);
    await lookup.filter(NAME_COLUMN, customer);
    await lookup.pick(customer);

    await expect(lookup.dialog).toBeHidden();
    await app.field.expectToContain(BUSINESS_PARTNER, customer);
  });

  test("the + of a selector creates the record in its process, and the record comes back to the form", async ({
    app,
    data,
  }) => {
    const customer = data.BUSINESS_PARTNER.CUSTOMER_GERMANY;
    const amount = uniqueAmount();
    await app.sidebar.navigateTo("financialAccount");
    await app.grid.filter(NAME_COLUMN, SPAIN_CASHBOOK);
    await app.grid.selectRow(SPAIN_CASHBOOK);
    await app.tabs.open("Transaction");
    await app.toolbar.inTab(TABS.FINANCIAL_ACCOUNT_TRANSACTION).newRecord();
    await app.field.pickWithKeyboard(TRANSACTION_TYPE, BP_DEPOSIT.value, {
      search: BP_DEPOSIT.name,
      fieldId: data.FIELD.FINANCIAL_ACCOUNT_TRANSACTION_TYPE,
    });

    const payment = app.selectorModal(data.FIELD.FINANCIAL_ACCOUNT_TRANSACTION_PAYMENT);
    await expect(payment.searchButton).toBeVisible();
    await payment.addButton.click();

    // Add Payment opens for this transaction: a payment received into the account
    await app.processModal.expectTitle(ADD_PAYMENT);
    await app.field.expectToContain("Document", RECEIVED_IN);
    await app.field.expectToContain(DEPOSIT_TO, SPAIN_CASHBOOK);
    await app.field.selectById(RECEIVED_FROM, customer.id, { search: customer.name });

    // The amount typed stays once the process scripts reacted to it (no invoice takes it: all of it is
    // a difference, left as credit). Typed again until the field that asks what to do with it shows:
    // on a busy server, the answer to the display logic asked when the customer was picked can arrive
    // after the one asked for the amount, and hide that field again.
    const actualPayment = app.field.input(ACTUAL_PAYMENT);
    await expect(async () => {
      await actualPayment.fill("");
      await actualPayment.fill(amount);
      await actualPayment.press("Tab");
      await expect(app.field.input(DIFFERENCE)).toHaveValue(amount, { timeout: SETTLE_TIMEOUT });
      await expect(app.field.selector(OVERPAYMENT_ACTION)).toBeVisible({ timeout: SETTLE_TIMEOUT });
    }).toPass({ timeout: AMOUNT_TIMEOUT });
    await expect(actualPayment).toHaveValue(amount);

    await app.field.selectById(ACTION_REGARDING_DOCUMENT, data.LIST_VALUE.PROCESS_RECEIVED_PAYMENTS.id);
    // As Classic, the amount no invoice takes asks what to do with it: it is left as credit
    await app.field.select(OVERPAYMENT_ACTION, LEAVE_AS_CREDIT);
    await app.processModal.execute();
    await app.processModal.waitForClose();

    // The created payment is the Payment of the transaction, whose callout takes its amount
    await app.field.expectToContain(PAYMENT, customer.name);
    await expect(app.field.input(DEPOSIT_AMOUNT)).toHaveValue(amount);
  });
});

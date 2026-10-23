import { expect, test } from "../../support/fixtures";
import { TABS } from "../../support/registry/windows";

const BUSINESS_PARTNER = "Business Partner";
const NAME_COLUMN = "Name";
const SPAIN_CASHBOOK = "Spain Cashbook";
const BP_WITHDRAWAL = { value: "BPW", name: "BP Withdrawal" };
const ADD_PAYMENT = "Add Payment";
/** Add Payment opened for a withdrawal of the account: a payment made, deposited to the account. */
const PAID_OUT = "Paid Out";
const DEPOSIT_TO = "Deposit To";

/**
 * The buttons a selector field shows next to it in a form, from its selector definition: the
 * magnifying glass (the selector has grid fields) opens a popup with the records filtered per
 * column, and the "+" (the selector has a process) opens the process that creates the record.
 * No record is saved.
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

  test("the + of a selector opens the process that creates its record, in the context of the form", async ({
    app,
    data,
  }) => {
    await app.sidebar.navigateTo("financialAccount");
    await app.grid.filter(NAME_COLUMN, SPAIN_CASHBOOK);
    await app.grid.selectRow(SPAIN_CASHBOOK);
    await app.tabs.open("Transaction");
    await app.toolbar.inTab(TABS.FINANCIAL_ACCOUNT_TRANSACTION).newRecord();
    await app.field.pickWithKeyboard("Transaction Type", BP_WITHDRAWAL.value, {
      search: BP_WITHDRAWAL.name,
      fieldId: data.FIELD.FINANCIAL_ACCOUNT_TRANSACTION_TYPE,
    });

    const payment = app.selectorModal(data.FIELD.FINANCIAL_ACCOUNT_TRANSACTION_PAYMENT);
    await expect(payment.searchButton).toBeVisible();
    await payment.addButton.click();

    // Add Payment opens for this transaction: a payment made from the account
    await app.processModal.expectTitle(ADD_PAYMENT);
    await app.field.expectToContain("Document", PAID_OUT);
    await app.field.expectToContain(DEPOSIT_TO, SPAIN_CASHBOOK);

    // Closing it creates nothing and keeps the transaction being edited
    await app.processModal.close();
    await app.field.expectToContain("Transaction Type", BP_WITHDRAWAL.name);
  });
});

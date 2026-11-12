import { expect, test } from "../../support/fixtures";
import { TABS, WINDOW_IDS } from "../../support/registry/windows";
import { runAndCaptureGridFetch } from "../../support/wait";

/** Datasource params of the default sort (the tab order-by clause) and of a manual sort. */
const ORDER_BY = "_orderBy";
const SORT_BY = "_sortBy";
const NAME = "Name";
const COSTING = "Costing";
const AVERAGE_COST_TRANSACTIONS = "Average Cost Transactions";
const TRANSACTION = "Transaction";
const DESCRIPTION = "Description";
const DOCUMENT_NO = "Document No.";
const TRANSACTIONS = "Transactions";
const MOVEMENT_DATE = "Movement Date";
/**
 * Classic default sort of Product › Transactions (no order-by clause): the last grid field with a record sort
 * number, Movement Date, not the lowest one (Storage Bin).
 */
const TRANSACTIONS_DEFAULT_SORT = "movementDate";
/** Ending date of the open average costing of the sample Laptop, the one its transactions belong to. */
const OPEN_COSTING_ENDING_DATE = "12/31/9999";

/** Order-by clauses of the tabs (AD_Tab.HQLOrderByClause), sent untouched as in classic. */
const CLAUSE = {
  AVERAGE_COST_TRANSACTIONS: "trx.movementDate, trx.transactionProcessDate",
  FINANCIAL_ACCOUNT_TRANSACTION: "dateAcct, lineNo",
  PAYMENT_IN_HEADER: "-documentNo",
} as const;

/** Tabs whose sort the tests read or change: the grid saves it per user, so start and end from the default. */
const SORTED_TABS = [
  [WINDOW_IDS.PRODUCT, TABS.PRODUCT_AVERAGE_COST_TRANSACTIONS],
  [WINDOW_IDS.FINANCIAL_ACCOUNT, TABS.FINANCIAL_ACCOUNT_TRANSACTION],
  [WINDOW_IDS.PAYMENT_IN, TABS.PAYMENT_IN_HEADER],
  [WINDOW_IDS.PRODUCT, TABS.PRODUCT_TRANSACTIONS],
] as const;

test.beforeEach(({ api }) => api.resetGridConfigurations(SORTED_TABS));
test.afterEach(({ api }) => api.resetGridConfigurations(SORTED_TABS));

/**
 * Default sort of a grid as classic (ETP-4641): the whole tab order-by clause travels as `_orderBy` and
 * `_sortBy` only carries a manual sort, which takes precedence; a tab without a clause is sorted by the classic
 * default field (`OBViewGridComponent.getSortField`). Read-only, on sample data.
 */
test.describe("Grid - default sort as classic @regression @grid", () => {
  test("loads a query-based tab sorted by a multi-column clause of aliases", async ({ app, data, page }) => {
    const product = data.PRODUCT.LAPTOP;
    await app.sidebar.navigateTo("product");
    await app.grid.filter(NAME, product.name);
    await app.grid.selectRow(product.name);
    await app.tabs.open(COSTING);
    const costing = page.getByTestId(`Tab__${TABS.PRODUCT_COSTING}`);

    // The first child tab fetches its records when its parent is selected, before it is opened
    const params = await runAndCaptureGridFetch(page, TABS.PRODUCT_AVERAGE_COST_TRANSACTIONS, async () => {
      await app.grid.setRowSelected(app.grid.rowWithCell(OPEN_COSTING_ENDING_DATE, costing), true);
      await app.tabs.open(AVERAGE_COST_TRANSACTIONS);
    });

    expect(params[ORDER_BY]).toBe(CLAUSE.AVERAGE_COST_TRANSACTIONS);
    expect(params[SORT_BY]).toBeUndefined();
    // The server accepts the clause: the tab shows its transactions instead of an error
    const transactions = page.getByTestId(`Tab__${TABS.PRODUCT_AVERAGE_COST_TRANSACTIONS}`);
    await expect(app.grid.rows(transactions).first()).toBeVisible();
  });

  test("sends every column of the clause and lets a manual sort override it", async ({ app, data, page }) => {
    const account = data.FINANCIAL_ACCOUNT.ACCOUNTING_DOCUMENTS_DOLLAR;
    await app.sidebar.navigateTo("financialAccount");
    await app.grid.filter(NAME, account.name);

    const defaultParams = await runAndCaptureGridFetch(page, TABS.FINANCIAL_ACCOUNT_TRANSACTION, async () => {
      await app.grid.selectRow(account.name);
      await app.tabs.open(TRANSACTION);
    });

    expect(defaultParams[ORDER_BY]).toBe(CLAUSE.FINANCIAL_ACCOUNT_TRANSACTION);
    expect(defaultParams[SORT_BY]).toBeUndefined();

    const manualParams = await runAndCaptureGridFetch(page, TABS.FINANCIAL_ACCOUNT_TRANSACTION, () =>
      app.grid.sortBy(DESCRIPTION)
    );

    expect(manualParams[SORT_BY]).toBe("description");
    expect(manualParams[ORDER_BY]).toBe(CLAUSE.FINANCIAL_ACCOUNT_TRANSACTION);
  });

  test("shows the default descending sort on its column", async ({ app, page }) => {
    const params = await runAndCaptureGridFetch(page, TABS.PAYMENT_IN_HEADER, () =>
      app.sidebar.navigateTo("paymentIn")
    );

    expect(params[ORDER_BY]).toBe(CLAUSE.PAYMENT_IN_HEADER);
    expect(params[SORT_BY]).toBeUndefined();
    await expect(app.grid.sortIndicator(DOCUMENT_NO, "descending")).toBeVisible();
  });

  test("sorts a tab without an order-by clause by the classic default field", async ({ app, data, page }) => {
    const product = data.PRODUCT.LAPTOP;
    await app.sidebar.navigateTo("product");
    await app.grid.filter(NAME, product.name);

    const params = await runAndCaptureGridFetch(page, TABS.PRODUCT_TRANSACTIONS, async () => {
      await app.grid.selectRow(product.name);
      await app.tabs.open(TRANSACTIONS);
    });

    expect(params[SORT_BY]).toBe(TRANSACTIONS_DEFAULT_SORT);
    expect(params[ORDER_BY]).toBeUndefined();
    await expect(app.grid.sortIndicator(MOVEMENT_DATE, "ascending")).toBeVisible();
  });
});

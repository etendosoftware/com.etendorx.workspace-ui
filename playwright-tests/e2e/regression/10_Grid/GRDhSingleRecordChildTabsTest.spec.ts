import { expect, test } from "../../support/fixtures";
import { TABS, WINDOW_IDS } from "../../support/registry/windows";
import { datasourceCriteria, runAndCaptureGridFetch } from "../../support/wait";

const DOCUMENT_NO = "Document No.";
/** Grid column of the business partner name in the Business Partner window. */
const COMMERCIAL_NAME = "Commercial Name";
const ACCOUNTING = "Accounting";
const CUSTOMER = "Customer";
/** Criterion classic sends for a subtab without a link column: the tab's where clause filters by the parent. */
const DUMMY_CRITERION = "_dummy";
const ID = "id";
/** Default order of the Accounting tabs (AD_Tab.HQLOrderByClause). */
const ACCOUNTING_ORDER_BY = "accountingSchema.name, accountingDate, abs(debit) desc, credit desc, value";

/** Tabs the tests open: start and end from their default grid configuration (sort, columns). */
const OPENED_TABS = [
  [WINDOW_IDS.SALES_INVOICE, TABS.SALES_INVOICE_ACCOUNTING],
  [WINDOW_IDS.BUSINESS_PARTNER, TABS.BUSINESS_PARTNER_CUSTOMER],
] as const;

test.beforeEach(({ api }) => api.resetGridConfigurations(OPENED_TABS));
test.afterEach(({ api }) => api.resetGridConfigurations(OPENED_TABS));

/**
 * Single-record (SR) child tabs filter by their parent as classic `OBViewTab.getParentProperty` does (ETP-4641):
 * an Accounting tab (no link column) through its where clause, a tab on its parent's table by `id`. Read-only, on
 * sample data.
 */
test.describe("Grid - single-record child tabs filtered by their parent @regression @grid", () => {
  test("lists the accounting entries of a posted document", async ({ app, data, page }) => {
    const invoice = data.SAMPLE_DOCUMENT.SALES_INVOICE_POSTED;
    await app.sidebar.navigateTo("salesInvoice");
    await app.toolbar.disableImplicitFilter();
    await app.grid.filter(DOCUMENT_NO, invoice);

    const params = await runAndCaptureGridFetch(page, TABS.SALES_INVOICE_ACCOUNTING, async () => {
      await app.grid.setRowSelected(app.grid.rowWithCell(invoice), true);
      await app.tabs.open(ACCOUNTING);
    });

    const fieldNames = datasourceCriteria(params).map((criterion) => criterion.fieldName);
    expect(fieldNames).toContain(DUMMY_CRITERION);
    expect(fieldNames).not.toContain(ID);
    expect(params._orderBy).toBe(ACCOUNTING_ORDER_BY);
    const accounting = page.getByTestId(`Tab__${TABS.SALES_INVOICE_ACCOUNTING}`);
    await expect(app.grid.rows(accounting).first()).toBeVisible();
  });

  test("keeps filtering a tab on its parent's table by the parent id", async ({ app, data, page }) => {
    const businessPartner = data.BUSINESS_PARTNER.CUSTOMER_A;
    await app.sidebar.navigateTo("businessPartner");
    await app.grid.filter(COMMERCIAL_NAME, businessPartner.name);

    const params = await runAndCaptureGridFetch(page, TABS.BUSINESS_PARTNER_CUSTOMER, async () => {
      await app.grid.setRowSelected(app.grid.rowWithCell(businessPartner.name), true);
      await app.tabs.open(CUSTOMER);
    });

    expect(datasourceCriteria(params)).toContainEqual(
      expect.objectContaining({ fieldName: ID, value: businessPartner.id })
    );
    // The tab shows the selected business partner itself
    await expect(page.getByTestId(`Tab__${TABS.BUSINESS_PARTNER_CUSTOMER}`)).toContainText(businessPartner.name);
  });
});

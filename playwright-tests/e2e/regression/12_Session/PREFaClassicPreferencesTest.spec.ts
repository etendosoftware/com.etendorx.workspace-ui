import type { ApiData, SavedRecord } from "../../support/api/ApiData";
import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import {
  addWindowPreferences,
  reloginToReadPreferences,
  removePreferences,
  type WindowPreference,
} from "../../support/flows/preferences";
import { overridePreferences, overrideSessionRole } from "../../support/processOverrides";
import { TABS, WINDOW_IDS } from "../../support/registry/windows";
import { collectGridFetches, runAndCaptureGridFetch } from "../../support/wait";

const NAME = "Name";
const PRICE = "Price";
const ACCOUNTING = "Accounting";
const TRANSLATION = "Translation";
const AUDIT = /^Audit$/;
const LINKED_ITEMS = /^Linked Items$/;
const NOTES = /^Notes/;
const NOTE_INPUT = "New note";
const YES = "Y";
const NO = "N";
/** User level of a role without administration rights (organization only). */
const REGULAR_USER_LEVEL = "  O";
const PAGE_SIZE = 5;
const LOGOUT_TARGET = "e2e-logout-redirect";
const SINGLE_RECORD_PREFERENCE = "OBUIAPP_ShowSingleRecordFilterMsg";
const IMPLICIT_FILTER_PREFERENCE = "OBUIAPP_ShowImplicitFilterMsg";
const IMPLICIT_FILTER_TEXT = "This grid is filtered using";
const FILTER_MESSAGE = "GridFilterMessage__container";
/** Element of the sample chart of accounts, with more than a thousand accounts. */
const MAIN_ACCOUNT = "Main Account";
const ELEMENT_VALUE = "Element Value";
const SEARCH_KEY = "Search Key";
const BROAD_FILTER = "1";
const PRECISE_FILTER = "57001";
/** What an empty grid shows instead of its rows. */
const EMPTY_GRID_TEXT = "No records to show";
/** `TreeDatasourceFetchLimit` as the core ships it (System level). */
const CORE_TREE_FETCH_LIMIT = 200;
/** Start of `OBUIAPP_TooManyNodes`. */
const TOO_MANY_NODES_TEXT = "This query criteria returns a number of nodes larger than the established limit";
const SAVED_PREFERENCE_REQUEST = /\/api\/erp\/meta\/preferences/;

/** Address that opens `recordId` of `tabId` in a new window instance (the URL state the UI restores). */
function recordLink(windowId: string, tabId: string, recordId: string): string {
  return `/window?wi_0=${windowId}_${Date.now()}&ti_0=${tabId}&ri_0=${recordId}`;
}

const preferences: SavedRecord[] = [];
/** Set by the tests that click "Never show this message again", which stores the preference for the user. */
let restoreSingleRecordMessage = false;
let restoreImplicitFilterMessage = false;

// Removed while the page is still open, also when the test failed or timed out
test.afterEach(async ({ api }) => {
  await removePreferences(api, preferences);
  if (restoreSingleRecordMessage) {
    // Stored in the System client as classic does, so it is set back instead of deleted
    await api.savePreference(SINGLE_RECORD_PREFERENCE, "Y");
    restoreSingleRecordMessage = false;
  }
  if (restoreImplicitFilterMessage) {
    await api.savePreference(IMPLICIT_FILTER_PREFERENCE, "Y");
    restoreImplicitFilterMessage = false;
  }
});

/**
 * Classic interface preferences applied by the new UI (ETP-6356). Window preferences are created for the
 * user of the suite and a window no other regression spec reads (Product, Goods Transaction); a preference
 * that cannot be scoped to a window (StartPage, LogoutRedirectURL) is added to the answer the page loads
 * only, since created for real it would reach every spec logged in as the same user meanwhile.
 */
test.describe("Session - Classic interface preferences @regression @session", () => {
  /** Creates `values` for `windowId` and logs in again so the session reads them. */
  async function setWindowPreferences(app: App, api: ApiData, windowId: string, values: WindowPreference[]) {
    preferences.push(...(await addWindowPreferences(api, windowId, values)));
    await reloginToReadPreferences(app);
  }

  test("hides accounting and translation tabs with ShowAcct and ShowTrl set to No", async ({ app, api, data }) => {
    const laptop = data.PRODUCT.LAPTOP.name;
    /** Selects the product in the grid, which shows its child tabs under it. */
    const showProductTabs = async () => {
      await app.sidebar.navigateTo("product");
      await app.grid.filter(NAME, laptop);
      await app.grid.setRowSelected(app.grid.rowWithCell(laptop), true);
      await expect(app.tabs.tab(PRICE), "the child tabs of the product were not shown").toBeVisible();
    };

    // The admin user ships with both preferences set to Yes
    await showProductTabs();
    await expect(app.tabs.tab(ACCOUNTING)).toBeVisible();
    await expect(app.tabs.tab(TRANSLATION)).toBeVisible();

    await setWindowPreferences(app, api, WINDOW_IDS.PRODUCT, [
      { name: "ShowAcct", value: NO, propertyList: false },
      { name: "ShowTrl", value: NO, propertyList: false },
    ]);
    await showProductTabs();
    await expect(app.tabs.tab(ACCOUNTING)).toHaveCount(0);
    await expect(app.tabs.tab(TRANSLATION)).toHaveCount(0);
  });

  test("opens the audit section and hides linked items and the note input of a read-only tab", async ({
    app,
    api,
    data,
    page,
  }) => {
    const movement = recordLink(
      WINDOW_IDS.GOODS_TRANSACTION,
      TABS.GOODS_TRANSACTION,
      data.GOODS_TRANSACTION.LAPTOP_RECEIPT.id
    );
    const openNotes = async () => {
      await app.formSections.open(NOTES);
      return page.getByLabel(NOTE_INPUT);
    };

    await page.goto(movement);
    await expect(app.formSections.main).toBeVisible();
    await expect(app.formSections.header(AUDIT)).toHaveAttribute("aria-expanded", "false");
    await expect(app.formSections.header(LINKED_ITEMS)).toBeVisible();
    await expect(await openNotes()).toBeVisible();

    await setWindowPreferences(app, api, WINDOW_IDS.GOODS_TRANSACTION, [
      { name: "ShowAuditDefault", value: YES, propertyList: false },
      { name: "OBUIAPP_DisableLinkedItemsSection", value: YES, propertyList: true },
      { name: "DisableNotesForReadOnlyTabs", value: YES, propertyList: true },
    ]);
    await page.goto(movement);
    await expect(app.formSections.main).toBeVisible();
    await expect(app.formSections.header(AUDIT)).toHaveAttribute("aria-expanded", "true");
    await expect(app.formSections.header(LINKED_ITEMS)).toHaveCount(0);
    await expect(await openNotes()).toHaveCount(0);
  });

  test("pages the grid by dataPageSize and fills its height without scrolling", async ({ app, api }) => {
    await setWindowPreferences(app, api, WINDOW_IDS.GOODS_TRANSACTION, [
      { name: "dataPageSize", value: String(PAGE_SIZE), propertyList: true },
    ]);
    const fetches = collectGridFetches(app.page, TABS.GOODS_TRANSACTION);
    await app.sidebar.navigateTo("goodsTransaction");

    // Five rows leave no scroll bar: the grid asks for the next pages by itself, five records at a time
    await expect.poll(() => fetches.length, { message: "the grid did not ask for a second page" }).toBeGreaterThan(1);
    // The datasource request sends the row range as text
    expect(fetches[0]).toMatchObject({ _startRow: "0", _endRow: String(PAGE_SIZE) });
    expect(fetches[1]).toMatchObject({ _startRow: String(PAGE_SIZE), _endRow: String(2 * PAGE_SIZE) });
    await expect.poll(() => app.grid.rows().count()).toBeGreaterThan(PAGE_SIZE);
  });

  test("lets only administrators personalize the window with the preference set to No", async ({
    app,
    api,
    data,
    page,
  }) => {
    const movement = recordLink(
      WINDOW_IDS.GOODS_TRANSACTION,
      TABS.GOODS_TRANSACTION,
      data.GOODS_TRANSACTION.LAPTOP_RECEIPT.id
    );
    const personalizeForm = app.toolbar.button("personalize-form");
    const saveView = page.getByTestId("SaveViewMenu__save-button");
    await setWindowPreferences(app, api, WINDOW_IDS.GOODS_TRANSACTION, [
      { name: "OBUIAPP_WindowPersonalization_Override", value: NO, propertyList: true },
    ]);

    // The role of the suite is a client administrator: it keeps every option
    await page.goto(movement);
    await expect(personalizeForm).toBeEnabled();
    await app.sidebar.navigateTo("goodsTransaction");
    await app.savedViews.open();
    await expect(saveView).toBeVisible();

    // The same user seen as a regular one only picks views
    const role = await overrideSessionRole(page, { userLevel: REGULAR_USER_LEVEL });
    await page.goto(movement);
    await expect(personalizeForm).toBeDisabled();
    expect(role.applied, "the session was not loaded again").toBeGreaterThan(0);
    await app.sidebar.navigateTo("goodsTransaction");
    await app.savedViews.open();
    await expect(page.getByTestId("SaveViewMenu__reset-button")).toBeVisible();
    await expect(saveView).toHaveCount(0);
  });

  test("opens the StartPage record and a new record after a login", async ({ app, data }) => {
    const startPage = { StartPage: `/?tabId=${TABS.PRODUCT_HEADER}&recordId=${data.PRODUCT.LAPTOP.id}` };
    const override = await overridePreferences(app.page, startPage);

    await app.auth.logout();
    await app.auth.login();
    await app.breadcrumb.waitFor(data.PRODUCT.LAPTOP.name);
    await expect(app.field.input(NAME)).toHaveValue(data.PRODUCT.LAPTOP.name);

    startPage.StartPage = `/?tabId=${TABS.PRODUCT_HEADER}&command=NEW`;
    await app.auth.logout();
    await app.auth.login();
    await expect(app.formSections.main).toBeVisible();
    await expect(app.field.input(NAME)).toHaveValue("");
    expect(override.applied).toBeGreaterThan(1);
  });

  test("goes to LogoutRedirectURL after logging out from the profile", async ({ app, baseURL }) => {
    const target = `${baseURL}/?${LOGOUT_TARGET}`;
    await overridePreferences(app.page, { LogoutRedirectURL: target });
    // The preferences are read at login
    await app.auth.logout();
    await app.auth.login();

    await app.auth.logout();
    await expect(app.page).toHaveURL(new RegExp(LOGOUT_TARGET));
  });

  test("shows the classic filter messages and stops showing them when the user asks", async ({ app, data, page }) => {
    const message = page.getByTestId(FILTER_MESSAGE);
    const order = recordLink(WINDOW_IDS.SALES_ORDER, TABS.SALES_ORDER_HEADER, data.SAMPLE_ORDER.COMPLETED.id);
    /** Opens the sample order from a link and goes back to the grid, which keeps that record only. */
    const openOrderGridFromLink = async () => {
      await page.goto(order);
      await app.breadcrumb.waitFor(data.SAMPLE_DOCUMENT.SALES_ORDER_COMPLETED);
      await app.toolbar.button("cancel").click();
    };

    // The top tab of a transactional window applies its default filter
    await app.sidebar.navigateTo("salesOrder");
    await expect(message).toContainText(IMPLICIT_FILTER_TEXT);

    await openOrderGridFromLink();
    await expect(message).toContainText("filtered for the last document viewed");
    const saved = page.waitForResponse(
      (response) => SAVED_PREFERENCE_REQUEST.test(response.url()) && response.request().method() === "POST"
    );
    restoreSingleRecordMessage = true;
    await page.getByTestId("GridFilterMessage__action").click();
    expect((await saved).ok(), "the preference was not stored").toBe(true);
    await expect(message).toHaveCount(0);

    // Stored for the user: a new session does not show it either
    await app.auth.logout();
    await app.auth.login();
    await openOrderGridFromLink();
    await expect(app.grid.rows()).toHaveCount(1);
    await expect(message).toHaveCount(0);
  });
  test("hides the implicit filter message when closed, with the funnel and for good", async ({ app, page }) => {
    const message = page.getByTestId(FILTER_MESSAGE);
    /** Waits until the Sales Order grid shows its records with the default filter on. */
    const expectFilteredOrders = async () => {
      await expect(app.grid.rows().first()).toBeVisible();
      expect(await app.toolbar.isImplicitFilterOn(), "the default filter is off").toBe(true);
    };
    const reloadSalesOrders = async () => {
      await runAndCaptureGridFetch(page, TABS.SALES_ORDER_HEADER, () => page.reload());
      await expectFilteredOrders();
    };

    await app.sidebar.navigateTo("salesOrder");
    await expect(message).toContainText(IMPLICIT_FILTER_TEXT);

    // Closed, it stays hidden while the window is open, and comes back with the next load
    await page.getByTestId("GridFilterMessage__close").click();
    await expect(message).toHaveCount(0);
    await reloadSalesOrders();
    await expect(message).toContainText(IMPLICIT_FILTER_TEXT);

    // Turning the default filter off removes the message; turning it on shows it again
    await app.toolbar.disableImplicitFilter();
    await expect(message).toHaveCount(0);
    await app.toolbar.button("filter").click();
    await expect(message).toContainText(IMPLICIT_FILTER_TEXT);

    // "Never show this message again" is read back from the server on the next load, as classic
    const saved = page.waitForResponse(
      (response) => SAVED_PREFERENCE_REQUEST.test(response.url()) && response.request().method() === "POST"
    );
    restoreImplicitFilterMessage = true;
    await page.getByTestId("GridFilterMessage__action").click();
    expect((await saved).ok(), "the preference was not stored").toBe(true);
    await expect(message).toHaveCount(0);
    // Opened again from the menu the window starts over, with its default filter
    await app.sidebar.navigateTo("salesOrder");
    await expectFilteredOrders();
    await reloadSalesOrders();
    await expect(message).toHaveCount(0);
  });

  test("refuses a tree filter that matches more nodes than TreeDatasourceFetchLimit", async ({ app, page }) => {
    const tab = page.getByTestId(`Tab__${TABS.ACCOUNT_TREE_ELEMENT_VALUE}`);
    await app.sidebar.navigateTo("accountTree");
    await app.grid.selectRow(MAIN_ACCOUNT);
    await app.tabs.open(ELEMENT_VALUE);
    await app.toolbar.inTab(TABS.ACCOUNT_TREE_ELEMENT_VALUE).button("toggle-tree-view").click();

    // The core ships the limit at 200 nodes: hundreds of accounts of the element contain a 1
    const tooMany = await runAndCaptureGridFetch(page, TABS.ACCOUNT_TREE_ELEMENT_VALUE, () =>
      app.grid.filter(SEARCH_KEY, BROAD_FILTER, tab)
    );
    expect(tooMany._endRow).toBe(String(CORE_TREE_FETCH_LIMIT));
    await app.toast.expectError(TOO_MANY_NODES_TEXT);
    await expect(tab.getByText(EMPTY_GRID_TEXT)).toBeVisible();
    await expect(app.grid.filterInput(SEARCH_KEY, tab)).toHaveValue(BROAD_FILTER);

    // A filter that matches a few accounts shows them in the tree
    await app.grid.filter(SEARCH_KEY, PRECISE_FILTER, tab);
    await expect(tab.getByText(EMPTY_GRID_TEXT)).toHaveCount(0);
    await expect(app.grid.rows(tab).first()).toBeVisible();
  });
});

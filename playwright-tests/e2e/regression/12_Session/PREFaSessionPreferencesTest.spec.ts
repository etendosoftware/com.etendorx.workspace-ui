import { expect, test } from "../../support/fixtures";
import { recordLink } from "../../support/flows/navigation";
import { restoreShownPreferences, SAVED_PREFERENCE_REQUEST } from "../../support/flows/preferences";
import { overridePreferences } from "../../support/processOverrides";
import { TABS, WINDOW_IDS } from "../../support/registry/windows";
import { runAndCaptureGridFetch } from "../../support/wait";

const NAME = "Name";
const LOGOUT_TARGET = "e2e-logout-redirect";
const SINGLE_RECORD_PREFERENCE = "OBUIAPP_ShowSingleRecordFilterMsg";
const IMPLICIT_FILTER_PREFERENCE = "OBUIAPP_ShowImplicitFilterMsg";
const IMPLICIT_FILTER_TEXT = "This grid is filtered using";
const FILTER_MESSAGE = "GridFilterMessage__container";

/** Set by the tests that click "Never show this message again", which stores the preference for the user. */
const shownPreferences = new Set<string>();

// Set back while the page is still open, also when the test failed or timed out
test.afterEach(async ({ api }) => {
  await restoreShownPreferences(api, shownPreferences);
});

// PREFa is split in three files so its parts run side by side instead of being the last spec of
// suite-05-regression (ETP-6295): ...ProductPreferences (Product window and tree), ...ReadOnlyTabPreferences
// (Goods Transaction window) and ...SessionPreferences (login, logout and filter messages). Each file changes
// preferences that only its own tests read.
/**
 * Classic interface preferences applied by the new UI (ETP-6356) at login and logout, and the filter messages
 * of the grid. StartPage and LogoutRedirectURL are added to the answer the page loads only, since created for
 * real they would reach every spec logged in as the same user meanwhile. The two filter message tests run in
 * this order: the second one turns off the message the first one shows.
 */
test.describe("Session - Classic interface preferences at login and in the filter messages @regression @session", () => {
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
    shownPreferences.add(SINGLE_RECORD_PREFERENCE);
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
    shownPreferences.add(IMPLICIT_FILTER_PREFERENCE);
    await page.getByTestId("GridFilterMessage__action").click();
    expect((await saved).ok(), "the preference was not stored").toBe(true);
    await expect(message).toHaveCount(0);
    // Opened again from the menu the window starts over, with its default filter
    await app.sidebar.navigateTo("salesOrder");
    await expectFilteredOrders();
    await reloadSalesOrders();
    await expect(message).toHaveCount(0);
  });
});

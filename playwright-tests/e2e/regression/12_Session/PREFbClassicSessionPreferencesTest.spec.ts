import type { Page } from "@playwright/test";
import type { SavedRecord } from "../../support/api/ApiData";
import { AUTH_TEST_IDS } from "../../support/components/Auth";
import { expect, NO_SESSION, test } from "../../support/fixtures";
import { addWindowPreferences, reloginToReadPreferences, removePreferences } from "../../support/flows/preferences";
import { overridePreferences } from "../../support/processOverrides";
import { WINDOWS, WINDOW_IDS } from "../../support/registry/windows";

const TAX_CATEGORY = /Tax Category/;
const UNIT_OF_MEASURE = /Unit of Measure/;
/** A tax category of the sample data, opened but never saved. */
const SAMPLE_TAX_CATEGORY = "VAT 20%";
const DESCRIPTION = "Description";
const UNSAVED_PROMPT = {
  cancel: "SaveDiscardCancelModal__cancel",
  discard: "SaveDiscardCancelModal__discard",
};
const LOGIN_CONFIG = "**/api/auth/login-config";
const SSO_CONFIG = "**/api/auth/sso/config";
/** Provider of the mocked middleware: its link button is `SSOProvider__<name>`. */
const SSO_PROVIDER = "Google";
/** Address of the mocked middleware: the `.invalid` domain never resolves, every request to it is answered here. */
const MIDDLEWARE_URL = "https://sso.e2e.invalid";
const PROVIDER_LOGOUT = /^https:\/\/sso\.e2e\.invalid\/logout/;
const ALLOW_SSO_LOGIN = "ETRX_AllowSSOLogin";

const preferences: SavedRecord[] = [];

// Removed while the page is still open, also when the test failed or timed out
test.afterEach(async ({ api }) => {
  await removePreferences(api, preferences);
});

/** Answers the single sign-on configuration as a server with the Etendo middleware configured. */
async function mockMiddlewareSso(page: Page, baseURL: string): Promise<void> {
  await page.route(SSO_CONFIG, (route) =>
    route.fulfill({
      json: {
        enabled: true,
        authType: "Middleware",
        middlewareUrl: MIDDLEWARE_URL,
        redirectUri: baseURL,
        accountId: "e2e",
        providers: [{ id: "google-oauth2", name: SSO_PROVIDER }],
      },
    })
  );
}

/** Answers every request to the mocked middleware and counts the logouts sent to it. */
async function countProviderLogouts(page: Page): Promise<{ sent: number }> {
  const state = { sent: 0 };
  await page.route(`${MIDDLEWARE_URL}/**`, (route) => {
    if (PROVIDER_LOGOUT.test(route.request().url())) {
      state.sent++;
    }
    return route.fulfill({ contentType: "text/html", body: "" });
  });
  return state;
}

/**
 * Classic preferences of the session (ETP-6356): one tab per window (`AllowMultiTab`), the account link
 * and provider logout of single sign-on (`ETRX_AllowSSOLogin`) and the forced login address
 * (`ForcedLoginURL`). The window preference is created for the user and Tax Category only, a window no
 * other regression spec opens. The core has no single sign-on and a forced login address would reach every
 * spec (and the classic login): their server answers are mocked for the page only.
 */
test.describe("Session - Classic session preferences @regression @session", () => {
  test("reopening an open window replaces it, asking first about its unsaved changes", async ({ app, page }) => {
    await app.sidebar.navigateTo("taxCategory");
    await app.sidebar.navigateTo("unitOfMeasure");
    await app.sidebar.navigateTo("taxCategory");
    // The open Tax Category is reused: same place in the bar, in front
    expect(await app.windows.titles()).toEqual([
      expect.stringMatching(TAX_CATEGORY),
      expect.stringMatching(UNIT_OF_MEASURE),
    ]);

    await app.grid.openForm(SAMPLE_TAX_CATEGORY);
    await app.field.fill(DESCRIPTION, `${SAMPLE_TAX_CATEGORY} - not saved`);
    const reopenTaxCategory = () => app.sidebar.openMenuEntry(WINDOWS.taxCategory.search, WINDOWS.taxCategory.menuId);

    // Cancel keeps the record and its change
    await reopenTaxCategory();
    await page.getByTestId(UNSAVED_PROMPT.cancel).click();
    await expect(app.field.input(DESCRIPTION)).toHaveValue(`${SAMPLE_TAX_CATEGORY} - not saved`);

    // Discard drops the change and shows the window again, in its grid and in the same place
    await reopenTaxCategory();
    await page.getByTestId(UNSAVED_PROMPT.discard).click();
    await expect(app.grid.row(SAMPLE_TAX_CATEGORY)).toBeVisible();
    await expect(app.formSections.main).toBeHidden();
    expect(await app.windows.titles()).toEqual([
      expect.stringMatching(TAX_CATEGORY),
      expect.stringMatching(UNIT_OF_MEASURE),
    ]);
  });

  test("opens a new tab of the window with AllowMultiTab set to Yes", async ({ app, api }) => {
    preferences.push(
      ...(await addWindowPreferences(api, WINDOW_IDS.TAX_CATEGORY, [
        { name: "AllowMultiTab", value: "Y", propertyList: true },
      ]))
    );
    await reloginToReadPreferences(app);

    await app.sidebar.navigateTo("taxCategory");
    await app.sidebar.navigateTo("taxCategory");
    await expect(app.windows.closeButtons).toHaveCount(2);

    // Other windows keep one tab
    await app.sidebar.navigateTo("unitOfMeasure");
    await app.sidebar.navigateTo("unitOfMeasure");
    await expect(app.windows.closeButtons).toHaveCount(3);
  });

  test("offers the account link and closes the provider session only with ETRX_AllowSSOLogin", async ({
    app,
    baseURL,
    page,
  }) => {
    const values = { [ALLOW_SSO_LOGIN]: "Y" };
    const override = await overridePreferences(page, values);
    await mockMiddlewareSso(page, baseURL ?? "");
    const logouts = await countProviderLogouts(page);
    const linkButton = page.getByTestId(`SSOProvider__${SSO_PROVIDER}`);
    const openProfile = () => page.getByTestId(AUTH_TEST_IDS.profileMenu).click();
    const logOutFromOpenProfile = () => page.getByTestId(AUTH_TEST_IDS.logout).click();

    // Read again from the server on the next load
    await page.reload();
    await openProfile();
    await expect(linkButton).toBeVisible();
    await logOutFromOpenProfile();
    await expect.poll(() => logouts.sent, { message: "the provider session was not closed" }).toBe(1);

    values[ALLOW_SSO_LOGIN] = "N";
    await app.auth.login();
    await openProfile();
    await expect(page.getByTestId(AUTH_TEST_IDS.logout)).toBeVisible();
    await expect(linkButton).toHaveCount(0);
    await logOutFromOpenProfile();
    await expect(page.locator("#username")).toBeVisible();
    expect(logouts.sent).toBe(1);
    expect(override.applied).toBeGreaterThan(1);
  });
});

test.describe("Session - forced login address @regression @session", () => {
  test.use({ session: NO_SESSION });

  test("the login page goes to ForcedLoginURL only when it is an address of the new UI", async ({ baseURL, page }) => {
    const origin = new URL(baseURL ?? "").origin;
    let forcedLoginUrl = `${origin}/?e2e-forced-login`;
    await page.route(LOGIN_CONFIG, (route) => route.fulfill({ json: { forcedLoginUrl } }));

    await page.goto("/");
    await expect(page).toHaveURL(forcedLoginUrl);
    await expect(page.locator("#username")).toBeVisible();

    // An address of the classic login is left alone: following it would leave the new UI
    forcedLoginUrl = `${origin}/etendo/security/Login`;
    const answered = page.waitForResponse((response) => response.url().includes("/api/auth/login-config"));
    await page.goto("/");
    await answered;
    await expect(page.locator("#username")).toBeVisible();
    expect(page.url()).not.toContain("security/Login");
  });
});

import { expect, test } from "../../support/fixtures";
import { selectSampleOrder } from "../../support/flows/sampleOrders";
import { answerWithStatus } from "../../support/network";
import { SAMPLE_DOCUMENT } from "../../support/registry/data";
import { WINDOWS } from "../../support/registry/windows";
import { runAndWaitForResponse } from "../../support/wait";

/** Requests answered with a simulated status: the grid configuration of a window and the grid data. */
const GRID_CONFIGURATION = /\/api\/erp\/meta\/grid-configuration/;
const GRID_DATA = /\/api\/datasource(\?|$)/;
/** The session of the user, read through the API client when the application loads. */
const SESSION = /\/api\/erp\/meta\/session/;
/** The logout, which asks the server to revoke the token of the session. */
const LOGOUT = /\/api\/auth\/logout/;
const TOKEN_KEY = "token";
/** A request made outside the API clients (through `sessionAwareFetch`): the email configuration of a record. */
const EMAIL_CONFIGURATION = /\/api\/erp\/meta\/email\/config/;
const SERVER_ERROR = 500;
const UNAUTHORIZED = 401;

const SERVER_ERROR_TOAST = "Something went wrong";
const GENERIC_LOGOUT = "System Error - Session Closed";
const SESSION_EXPIRED = "Session expired due to inactivity";
const ONE_MINUTE_IN_SECONDS = 60;

const WINDOW = WINDOWS.businessPartner;

/**
 * Session rule (ETP-6311), as in Classic: a server error is shown and the user keeps working; only an
 * authentication failure (401) closes the session. A screen that shows its own error does not get the
 * toast as well. Failures are simulated on one request, so no data or configuration changes.
 */
test.describe("Session - server errors keep the session @smoke @session", () => {
  // Independent tests (each test only breaks its own token and page): spread them over the workers instead of
  // running them one after another in one worker, the tail of suite-01-base in CI (ETP-6295)
  test.describe.configure({ mode: "parallel" });

  test("shows a server error in a toast and keeps the user on the same screen", async ({ app, page }) => {
    const failure = await answerWithStatus(page, GRID_CONFIGURATION, SERVER_ERROR);

    // The failure can already come from the preload on hover: wait for the toast while the window opens, it
    // dismisses itself after a few seconds
    await Promise.all([app.toast.expectError(SERVER_ERROR_TOAST), app.sidebar.navigateTo("businessPartner")]);
    expect(failure.sent).toBe(true);
    await app.auth.expectStillLoggedIn();
    await app.breadcrumb.waitFor(WINDOW.breadcrumb);
  });

  test("closes the session with its message on a 401", async ({ app, page }) => {
    const rejection = await answerWithStatus(page, SESSION, UNAUTHORIZED);

    // The session is read again on every load, through the API client
    await page.reload();

    await app.auth.expectLoggedOutWith(GENERIC_LOGOUT);
    expect(rejection.sent).toBe(true);
  });

  test("closes the session on a 401 from a request made outside the API clients", async ({ app, page }) => {
    await selectSampleOrder(app, SAMPLE_DOCUMENT.SALES_ORDER_COMPLETED);
    const rejection = await answerWithStatus(page, EMAIL_CONFIGURATION, UNAUTHORIZED);

    await app.toolbar.button("send-mail").click();

    await app.auth.expectLoggedOutWith(GENERIC_LOGOUT);
    expect(rejection.sent).toBe(true);
  });

  test("closes the session when a token revoked by a logout is used again", async ({ app, page }) => {
    const revokedToken = await page.evaluate((key) => localStorage.getItem(key) ?? "", TOKEN_KEY);
    await runAndWaitForResponse(page, LOGOUT, () => app.auth.logout());

    // The token of the closed session is put back, as if it had been copied before the logout
    await page.evaluate(([key, token]) => localStorage.setItem(key, token), [TOKEN_KEY, revokedToken]);
    const session = await runAndWaitForResponse(page, SESSION, () => page.reload());

    expect(session.status()).toBe(UNAUTHORIZED);
    await app.auth.expectLoggedOutWith(GENERIC_LOGOUT);
  });

  test("closes the session with the session-expired message when the token expired", async ({ app, page }) => {
    // Same token with an expiration in the past: the server rejects it (its signature no longer
    // matches) and the client knows it expired.
    await page.evaluate(
      ({ key, secondsAgo }) => {
        const token = localStorage.getItem(key) ?? "";
        const [header, payload, signature] = token.split(".");
        const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        claims.exp = Math.floor(Date.now() / 1000) - secondsAgo;
        const expired = btoa(JSON.stringify(claims)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        localStorage.setItem(key, `${header}.${expired}.${signature}`);
      },
      { key: TOKEN_KEY, secondsAgo: ONE_MINUTE_IN_SECONDS }
    );

    await page.reload();

    await app.auth.expectLoggedOutWith(SESSION_EXPIRED);
  });

  test("does not add the toast to a screen that shows its own error", async ({ app, page }) => {
    const failure = await answerWithStatus(page, GRID_DATA, SERVER_ERROR);

    await app.sidebar.navigateTo("businessPartner");

    await app.grid.expectLoadError();
    expect(failure.sent).toBe(true);
    await app.toast.expectNoError(SERVER_ERROR_TOAST);
    await app.auth.expectStillLoggedIn();
  });
});

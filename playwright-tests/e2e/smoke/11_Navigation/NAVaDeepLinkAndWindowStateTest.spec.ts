import { test } from "../../support/fixtures";
import { verifyNavigationState } from "../../support/flows/navigation";

/**
 * Navigation state kept in the URL and across windows: the URL of an open record restores it
 * after a reload and in a fresh browser session (a deep link), and switching between open
 * windows keeps the record each one shows. Read-only: sample records are only opened. The same
 * flow runs against recorded responses in `e2e/mocked/` (mocked-backend pilot).
 */
test.describe("Navigation - deep link, reload recovery and open windows @smoke @nav", () => {
  test("restores a record from its URL and keeps the state of each open window", async ({ app, browser }) => {
    await verifyNavigationState(app, () => browser.newContext());
  });
});

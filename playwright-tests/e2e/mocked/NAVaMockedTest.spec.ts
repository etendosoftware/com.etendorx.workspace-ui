import { verifyNavigationState } from "../support/flows/navigation";
import { test } from "../support/mock/fixture";

/**
 * Mocked-backend pilot: the NAVa navigation flow (deep link, reload recovery, open windows) on
 * recorded `/api/**` responses, with no ERP running. Regenerate the recordings with
 * `pnpm pw:record` when the backend responses or the flow change.
 */
test.describe("Mocked - navigation state on recorded responses @mocked @nav", () => {
  test("restores a record from its URL and keeps the state of each open window", async ({
    app,
    browser,
    mockedBackend,
  }) => {
    await verifyNavigationState(app, async () => {
      const context = await browser.newContext();
      await mockedBackend.attach(context);
      return context;
    });
  });
});

import { expect, LOGIN_ONLY, test } from "../../support/fixtures";

// Regression for ETP-3768: opening the Client window (root SR tab) must auto-resolve
// the record id from displayRecords so the FormView mounts with FIC-populated values
// for both the main tab and its Information SR subtab. Previously, root SR tabs forced
// FormView to mount with recordId="" and the FIC never fired.
test.describe("Client Window SR FormView Regression @smoke", () => {
  test.use({ session: LOGIN_ONLY });

  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (err) => {
      if (!/Hydration failed/i.test(err.message)) throw err;
    });
  });

  test("opens Client window FormView with populated values for main tab and Information subtab", async ({
    app,
    page,
  }) => {
    await app.sidebar.openMenuEntry("client", "148");
    await page.waitForURL(/wi_0=109/, { timeout: 30_000 });

    const clientNameInput = page.locator('input[name="name"]:visible').first();
    await clientNameInput.waitFor({ state: "visible", timeout: 30_000 });

    await expect(clientNameInput).not.toHaveValue("");
    await expect(page.locator('input[name="searchKey"]:visible').first()).not.toHaveValue("");
    await expect(page.locator('input[name="description"]:visible').first()).not.toHaveValue("");

    const informationTab = page.getByRole("button", { name: /^Information$/ }).first();
    await informationTab.waitFor({ state: "visible", timeout: 10_000 });
    await informationTab.click();

    const creationDates = page.locator('input[name="creationDate"]:visible');
    await expect(creationDates).toHaveCount(2, { timeout: 15_000 });

    const mainCreation = await creationDates.nth(0).inputValue();
    const subCreation = await creationDates.nth(1).inputValue();
    expect(mainCreation).not.toBe("");
    expect(subCreation).not.toBe("");
  });
});

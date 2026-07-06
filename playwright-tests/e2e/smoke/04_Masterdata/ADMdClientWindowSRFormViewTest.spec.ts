import { test, expect, type Page } from "@playwright/test";
import { cleanupEtendo, openSidebarAndGetSearch } from "../../helpers/etendo.helpers";
import { DEFAULT_USER, DEFAULT_PASSWORD } from "../../../playwright.config";

// Local login that waits for the sidebar toggle (`.h-14 button`) instead of the
// fragile `.h-14 > div > .transition > svg` chain in the shared helper, which is
// currently broken across the repo.
async function loginStable(page: Page) {
  await page.goto("/");
  await page.locator("#username").waitFor({ state: "visible", timeout: 10_000 });
  await page.locator("#username").clear();
  await page.locator("#username").fill(DEFAULT_USER);
  await page.locator("#password").clear();
  await page.locator("#password").fill(DEFAULT_PASSWORD);
  await page.locator('[data-testid="Button__602739"]').first().click();
  // Dev-server first compilation of /window can take ~60s — wait for the URL to leave "/"
  // or for the sidebar toggle to appear, whichever happens first.
  await Promise.race([
    page.waitForURL((url) => !url.pathname.match(/^\/?$/), { timeout: 90_000 }),
    page.locator(".h-14 button").first().waitFor({ state: "visible", timeout: 90_000 }),
  ]);
}

// Regression for ETP-3768: opening the Client window (root SR tab) must auto-resolve
// the record id from displayRecords so the FormView mounts with FIC-populated values
// for both the main tab and its Information SR subtab. Previously, root SR tabs forced
// FormView to mount with recordId="" and the FIC never fired.
test.describe("Client Window SR FormView Regression @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
    page.on("pageerror", (err) => {
      if (!/Hydration failed/i.test(err.message)) throw err;
    });
  });

  test("opens Client window FormView with populated values for main tab and Information subtab", async ({ page }) => {
    await loginStable(page);
    await page.waitForTimeout(1_000);

    const searchInput = await openSidebarAndGetSearch(page);
    await searchInput.click({ force: true });
    await searchInput.clear();
    await searchInput.fill("client");

    await page
      .waitForFunction(() => !document.querySelector("div.absolute.h-screen.w-screen"), { timeout: 20_000 })
      .catch(() => null);

    const clientMenu = page.locator('[data-testid="MenuTitle__148"]').first();
    await clientMenu.waitFor({ state: "visible", timeout: 10_000 });
    await clientMenu.evaluate((el) => (el as HTMLElement).click());

    await page.waitForURL(/wi_0=109/, { timeout: 30_000 });

    const clientNameInput = page.locator('input[name="name"]:visible').first();
    await clientNameInput.waitFor({ state: "visible", timeout: 30_000 });

    await expect(clientNameInput).not.toHaveValue("");
    await expect(page.locator('input[name="searchKey"]:visible').first()).not.toHaveValue("");
    await expect(page.locator('input[name="description"]:visible').first()).not.toHaveValue("");

    const informationTab = page
      .locator("button")
      .filter({ hasText: /^Information$/ })
      .first();
    await informationTab.waitFor({ state: "visible", timeout: 10_000 });
    await informationTab.click();
    await page.waitForTimeout(2_000);

    const creationDates = page.locator('input[name="creationDate"]:visible');
    await expect(creationDates).toHaveCount(2, { timeout: 15_000 });

    const mainCreation = await creationDates.nth(0).inputValue();
    const subCreation = await creationDates.nth(1).inputValue();
    expect(mainCreation).not.toBe("");
    expect(subCreation).not.toBe("");
  });
});

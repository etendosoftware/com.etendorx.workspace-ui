import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  navigateByMenuTestId,
  clickNewRecord,
  closeToastIfPresent,
} from "../../helpers/etendo.helpers";

test.describe("User Management - Create user and assign role @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
    // Ignore hydration errors — same behaviour as cy.on("uncaught:exception", ...)
    page.on("pageerror", (err) => {
      if (!/Hydration failed/i.test(err.message)) {
        throw err;
      }
    });
  });

  test("Create user, assign role and verify login access", async ({ page }) => {
    const pwd = "1234567Ag!";
    const username = `qa_${Date.now()}`;
    const name = username;

    await loginToEtendo(page, "admin", "admin");
    await page.waitForTimeout(1_000);

    // Switch to QA role
    await selectRoleOrgWarehouse(page);

    // Open drawer + navigate to Users window (MenuTitle__147)
    await navigateByMenuTestId(page, "us", "MenuTitle__147");
    await page.waitForTimeout(1_000);

    await clickNewRecord(page);
    await page.waitForTimeout(1_000);

    // Fill Name + trigger blur to run callout that auto-fills username
    const nameInput = page.locator('input[name="name"]');
    await nameInput.waitFor({ state: "visible", timeout: 10_000 });
    await nameInput.clear();
    await nameInput.fill(name);
    await nameInput.blur();
    await page.waitForTimeout(1_000);

    // Username (may be auto-filled; we overwrite just like Cypress does)
    const usernameInput = page.locator('input[name="username"]');
    await usernameInput.waitFor({ state: "visible", timeout: 10_000 });
    await usernameInput.clear();
    await usernameInput.fill(username);

    // Password — type character by character with delay (preserved from Cypress
    // because validation runs on each keystroke)
    const passwordInput = page.locator('input[name="password"]');
    await passwordInput.click();
    await passwordInput.clear();
    await passwordInput.pressSequentially(pwd, { delay: 120 });
    await expect(passwordInput).toHaveValue(pwd);
    await passwordInput.blur();

    // Save header
    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await page.waitForTimeout(1_000);
    await closeToastIfPresent(page);
    await page.waitForTimeout(1_000);

    // Open "User Roles" tab
    await page.locator('button[aria-label="User Roles"]').click();
    await page.waitForTimeout(1_000);

    // New User Role
    await page.locator('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span').click();
    await page.waitForTimeout(1_000);

    // Select Role
    await page.locator('[aria-label="Role"] > div[tabindex="0"]').click();
    await page.waitForTimeout(1_000);
    await page.locator('[data-testid="OptionItem__FA057013C10148828D2430F66F42EF1A"] > .truncate').click();
    await page.waitForTimeout(1_000);

    // Save line (second save button = line level)
    await page.locator("button.toolbar-button-save").nth(1).click();
    await page.waitForTimeout(1_000);
    await closeToastIfPresent(page);
    await page.waitForTimeout(1_000);

    // Logout
    await page.locator('[data-testid="PersonIcon__120cc9"]').click();
    await page.waitForTimeout(1_000);
    await page.locator('[data-testid="IconButton__d71b83"]').click();
    await page.waitForTimeout(1_000);

    // Login with newly created user
    await loginToEtendo(page, username, pwd);
    await page.waitForTimeout(1_000);

    // Ensure drawer is open so MenuTitle__166 becomes visible
    const searchInput = page.locator('input[placeholder="Search"]').first();
    await searchInput.waitFor({ state: "visible", timeout: 10_000 });
    if (await searchInput.isDisabled()) {
      await page.locator(".h-14 > div > .transition > svg").click();
      await page.waitForFunction(
        () => {
          const el = document.querySelector<HTMLInputElement>('input[placeholder="Search"]');
          return el !== null && !el.disabled;
        },
        { timeout: 5_000 }
      );
    }

    await expect(
      page.locator('[data-testid="MenuTitle__166"] > .flex.overflow-hidden > .relative > .ml-2').first()
    ).toBeVisible({ timeout: 15_000 });
  });
});

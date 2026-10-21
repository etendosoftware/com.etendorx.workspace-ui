import { expect, test } from "../../support/fixtures";
import { runAndWaitForFormInitialization } from "../../support/wait";

/** "Sales Management" menu folder: only shown to roles with sales access. */
const SALES_MANAGEMENT_MENU = { id: "166", name: "Sales Management" };

test.describe("User Management - Create user and assign role @smoke", () => {
  test.beforeEach(async ({ page }) => {
    // Ignore hydration errors — same behaviour as cy.on("uncaught:exception", ...)
    page.on("pageerror", (err) => {
      if (!/Hydration failed/i.test(err.message)) {
        throw err;
      }
    });
  });

  test("Create user, assign role and verify login access", async ({ app, data, page }) => {
    const pwd = "1234567Ag!";
    const username = data.uniqueValue("qa");
    const name = username;

    // Navigate to Users window
    await app.sidebar.navigateTo("user");
    await app.toolbar.newRecord();

    // Fill Name + blur to run the callout that auto-fills the username
    const nameInput = page.locator('input[name="name"]');
    await nameInput.waitFor({ state: "visible", timeout: 10_000 });
    await nameInput.fill(name);
    await runAndWaitForFormInitialization(page, () => nameInput.blur());

    // Username (may be auto-filled; we overwrite just like Cypress does)
    const usernameInput = page.locator('input[name="username"]');
    await usernameInput.waitFor({ state: "visible", timeout: 10_000 });
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
    await app.toolbar.save();
    await app.toast.closeAll();

    // New User Role
    await app.tabs.open("User Roles");
    await app.toolbar.newRecord("child");
    await app.field.selectById("Role", data.ROLE.QA_TESTING_SALES_ADMIN.id);

    // Save line
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // Login with the newly created user
    await app.auth.logout();
    await app.auth.login(username, pwd);

    // The new role gives access to Sales Management
    await app.sidebar.open();
    await expect(
      app.sidebar.menuEntry(SALES_MANAGEMENT_MENU.id).getByText(SALES_MANAGEMENT_MENU.name, { exact: true })
    ).toBeVisible({ timeout: 15_000 });
  });
});

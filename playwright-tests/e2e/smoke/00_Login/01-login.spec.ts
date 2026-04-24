import { test, expect } from "@playwright/test";
import { cleanupEtendo, loginToEtendo } from "../../helpers/etendo.helpers";
import { DEFAULT_USER, DEFAULT_PASSWORD } from "../../../playwright.config";

test.describe("Login Tests - Etendo @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("should display login page correctly", async ({ page }) => {
    await page.goto("/");

    // Verify login elements
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Log In" })).toBeVisible();

    // Check that fields are empty
    await expect(page.locator("#username")).toHaveValue("");
    await expect(page.locator("#password")).toHaveValue("");
  });

  test("should login successfully with valid credentials", async ({ page }) => {
    await loginToEtendo(page, DEFAULT_USER, DEFAULT_PASSWORD);

    // Verify that the main interface loaded
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Log In");
  });

  test("should handle invalid credentials", async ({ page }) => {
    await page.goto("/");

    await page.locator("#username").waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("#username").fill("invalid");
    await page.locator("#password").fill("invalid");
    await page.getByRole("button", { name: "Log In" }).click();

    // Verify that the error message is displayed
    await expect(page.getByText("Login failed")).toBeVisible({ timeout: 10_000 });
  });
});

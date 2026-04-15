import { test, expect } from "@playwright/test";
import { loginToEtendo, cleanupEtendo, navigateToSalesOrder } from "../../helpers/etendo.helpers";

test.describe("Sales Order - Display logic and field visibility @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Displays required fields and hides delivery notes according to display logic", async ({ page }) => {
    // ── Login ────────────────────────────────────────────────────────────────
    await loginToEtendo(page);

    // ── Step 1: Navigate to Sales Order ──────────────────────────────────────
    await navigateToSalesOrder(page);

    // ── Step 2: New Record ────────────────────────────────────────────────────
    const newBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newBtn.click();

    // ── Step 3: Assert required fields are visible ────────────────────────────
    await expect(
      page.locator('[aria-describedby="Organization-help"] > .w-1\\/3 > .overflow-hidden')
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.locator('[aria-describedby="Transaction Document-help"] > .w-1\\/3 > .overflow-hidden')
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      page.locator('[aria-describedby="Document No.-help"] > .w-1\\/3 > .overflow-hidden')
    ).toBeVisible({ timeout: 10_000 });

    // ── Step 4: Assert Delivery Notes field is hidden per display logic ────────
    await expect(page.locator('[aria-describedby="Delivery Notes-help"]')).not.toBeAttached();
  });
});

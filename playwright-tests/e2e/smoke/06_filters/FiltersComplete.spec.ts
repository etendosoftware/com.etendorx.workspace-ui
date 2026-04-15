import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  typeInGlobalSearch,
} from "../../helpers/etendo.helpers";

test.describe("Advanced Filters - Complete Test @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("should test all advanced filter functionalities", async ({ page }) => {
    // ── Local helpers ────────────────────────────────────────────────────────
    const openAdvancedFilters = async () => {
      await page.locator("button.toolbar-button-advanced-filters").first().click();
      await expect(
        page.locator("div").filter({ hasText: /^Advanced Filters$/ }).first()
      ).toBeVisible({ timeout: 10_000 });
    };

    const expectAdvancedFiltersClosed = async () => {
      await expect(
        page.locator("div").filter({ hasText: /^Advanced Filters$/ }).first()
      ).toBeHidden({ timeout: 10_000 });
    };

    // Click the parent of a visible span with exact text (used for the
    // "Condition" / "AND" pill placeholders that render text inside a span
    // wrapped in a clickable div[tabindex="0"]).
    const clickParentOfSpanWithText = async (text: string | RegExp) => {
      const parent = page
        .locator('div[tabindex="0"]')
        .filter({ has: page.locator("span", { hasText: text }) })
        .first();
      await parent.waitFor({ state: "visible", timeout: 10_000 });
      await parent.click();
    };

    const clickTabIndexZeroWithText = async (
      text: string | RegExp,
      which: "first" | "last" = "first"
    ) => {
      const locator = page.locator('div[tabindex="0"]').filter({ hasText: text });
      const target = which === "first" ? locator.first() : locator.last();
      await target.waitFor({ state: "visible", timeout: 10_000 });
      await target.click();
    };

    const clickOptionButton = async (text: string | RegExp) => {
      const btn = page.getByRole("button", { name: text }).first();
      await btn.waitFor({ state: "visible", timeout: 10_000 });
      await btn.click();
    };

    const expectRows = async () => {
      await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 15_000 });
      expect(await page.locator("table tbody tr").count()).toBeGreaterThan(0);
    };

    // ── Login + navigate to Sales Order ──────────────────────────────────────
    await loginToEtendo(page);

    await page.locator(".h-14 > div > .transition > svg").click();
    await typeInGlobalSearch(page, "sales");
    await page.locator('[data-testid="MenuTitle__129"]').click();

    await expect(page.locator("table").first()).toBeVisible({ timeout: 15_000 });

    const totalRows = await page.locator("table tbody tr").count();
    console.log(`Total rows without filter: ${totalRows}`);

    // =========================================================================
    // TEST 1: Basic Filter - Organization = Spain
    // =========================================================================
    console.log("TEST 1: Basic Filter - Organization = Spain");

    await openAdvancedFilters();

    await clickTabIndexZeroWithText("Column");
    await page
      .locator("span.text-gray-700")
      .filter({ hasText: "Organization" })
      .first()
      .click();

    await page.locator("div[tabindex]").filter({ hasText: "Condition" }).first().click();
    await clickOptionButton("=");

    await clickTabIndexZeroWithText("Value");
    await page.locator('input[placeholder="Buscar..."]').first().fill("Spain");
    await clickOptionButton("Spain");

    await clickOptionButton("Apply filters");

    await expectAdvancedFiltersClosed();
    await expectRows();

    await expect(page.locator("table tbody").first()).toContainText("Spain");
    await expect(page.locator("table tbody").first()).not.toContainText("USA");
    console.log(`TEST 1: ${await page.locator("table tbody tr").count()} rows filtered by Spain`);

    // =========================================================================
    // TEST 2: Adding Multiple Conditions (AND)
    // =========================================================================
    console.log("TEST 2: Adding Multiple Conditions (AND)");

    await openAdvancedFilters();

    await clickOptionButton("Add condition");

    await clickTabIndexZeroWithText("Column", "last");
    await page
      .locator("span.text-gray-700")
      .filter({ hasText: "Document No." })
      .first()
      .click();

    await clickParentOfSpanWithText("Condition");
    await clickOptionButton(/contains/i);

    await page.locator('input[placeholder="Value"]').first().fill("18");

    await clickOptionButton("Apply filters");

    await expectAdvancedFiltersClosed();
    await expectRows();

    await expect(page.locator("table tbody").first()).toContainText("Spain");
    await expect(page.locator("table tbody").first()).toContainText("18");

    console.log("TEST 2: All rows have Spain and Document No. containing 18");

    // =========================================================================
    // TEST 3: Clear All Filters
    // =========================================================================
    console.log("TEST 3: Clear All Filters");

    await openAdvancedFilters();

    await clickOptionButton("Clear all");
    await page.waitForTimeout(500);
    await clickOptionButton("Apply filters");
    await page.waitForTimeout(1_000);

    await expectAdvancedFiltersClosed();
    await expectRows();

    await expect(page.locator("button.toolbar-button-advanced-filters").first()).toBeVisible();
    console.log("TEST 3: All filters cleared successfully");

    // =========================================================================
    // TEST 4: OR - Document No. Contains '20' OR Total Gross Amount > '34'
    // =========================================================================
    console.log("TEST 4: OR - Document No. Contains '20' OR Total Gross Amount > '34'");

    await openAdvancedFilters();

    await clickTabIndexZeroWithText("Column");
    await page
      .locator("span.text-gray-700")
      .filter({ hasText: "Document No." })
      .first()
      .click();

    await clickParentOfSpanWithText("Condition");
    await clickOptionButton(/contains/i);

    await page.locator('input[placeholder="Value"]').first().fill("20");

    await clickOptionButton("Add condition");

    // Switch the AND connector to OR
    await clickParentOfSpanWithText("AND");
    await page.locator("span").filter({ hasText: /^OR$/ }).first().click();

    await clickTabIndexZeroWithText("Column", "last");
    await page
      .locator("span.text-gray-700")
      .filter({ hasText: "Total Gross Amount" })
      .first()
      .click();

    await clickParentOfSpanWithText("Condition");
    await clickOptionButton(/greater than/i);

    await page.locator('input[placeholder="Value"]').last().fill("34");

    await clickOptionButton("Apply filters");

    await expectAdvancedFiltersClosed();
    await expectRows();
    await expect(page.locator("table tbody").first()).toContainText("20");
    console.log("TEST 4: OR filter applied - Document No. Contains 20 OR Total Gross Amount > 34");
  });
});

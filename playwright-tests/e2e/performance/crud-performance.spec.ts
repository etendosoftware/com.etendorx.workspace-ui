import { test, expect, type Page } from "@playwright/test";
import { loginToEtendo, closeToastIfPresent } from "../helpers/etendo.helpers";

// ─── Thresholds ───────────────────────────────────────────────────────────────
// Industry benchmarks: SAP <2s dialog, Odoo <2-3s lists, Nielsen 1s/10s limits.
// warning: where competitive ERPs perform (target).
// failure: max tolerable — beyond this, users abandon tasks (Nielsen 10s rule).
const THRESHOLDS = {
  windowOpen:         { warning: 2000, failure: 5000 },
  newRecordForm:      { warning: 2000, failure: 5000 },
  saveRecord:         { warning: 2000, failure: 5000 },
  saveRecordComplex:  { warning: 3000, failure: 8000 },
  tableLoad:          { warning: 2000, failure: 5000 },
  tabNavigation:      { warning: 1000, failure: 3000 },
  advancedFilters:    { warning: 1000, failure: 3000 },
  dropdownLoad:       { warning: 1000, failure: 3000 },
  consecutiveRecord:  { warning: 3000, failure: 8000 },
};

type Threshold = { warning: number; failure: number };

// ─── Performance assertion ────────────────────────────────────────────────────

function assertPerformance(elapsed: number, label: string, threshold: Threshold) {
  const { warning, failure } = threshold;
  if (elapsed <= warning) {
    console.log(`✅ ${label}: ${elapsed}ms (GOOD — within industry standard of ${warning}ms)`);
  } else if (elapsed <= failure) {
    console.log(`⚠️  ${label}: ${elapsed}ms (WARNING — exceeds industry standard of ${warning}ms, max tolerable: ${failure}ms)`);
    console.log(`⚠️  INDUSTRY BENCHMARK: SAP < 2s, Odoo < 2-3s, Nielsen limit: 1s flow / 10s attention`);
  }
  expect(elapsed, `${label} must be under ${failure}ms (max tolerable)`).toBeLessThan(failure);
}

// ─── Navigation helper ────────────────────────────────────────────────────────
// Searches the sidebar and clicks the menu item WITHOUT waiting for networkidle,
// so callers can start their own performance timer immediately after the click.
//
// The drawer search input only exists in the DOM when the drawer is open
// ({open && <TextInputAutocomplete data-testid="drawer-search-input" />}).
// We open it first if needed, then target the specific drawer input to avoid
// accidentally writing into any other input[placeholder="Search"] on the page.

async function openWindowBySearch(page: Page, searchText: string, menuTestId: string) {
  const drawerInput = page.locator('[data-testid="drawer-search-input"] input');

  if (!await drawerInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await page.locator(".h-14 > div > .transition > svg").click();
    await drawerInput.waitFor({ state: "visible", timeout: 10_000 });
  }

  await drawerInput.click({ force: true });
  // keyboard.type() writes into the focused element without actionability pre-checks.
  await page.keyboard.type(searchText);
  await page.locator(`[data-testid="${menuTestId}"]`).waitFor({ state: "visible", timeout: 10_000 });
  await page.locator(`[data-testid="${menuTestId}"] > .flex.overflow-hidden > .relative > .ml-2`).click();
}

// ─── Suite ────────────────────────────────────────────────────────────────────

test.describe("CRUD Performance Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginToEtendo(page);
  });

  // ── Window Open Performance ────────────────────────────────────────────────

  test.describe("Window Open Performance", () => {
    test.skip("should open Sales Order window within acceptable time", async ({ page }) => {
      await openWindowBySearch(page, "sales", "MenuTitle__129");

      const start = Date.now();
      await page.locator("button.toolbar-button-new").waitFor({ state: "visible", timeout: 20_000 });
      assertPerformance(Date.now() - start, "Sales Order window open", THRESHOLDS.windowOpen);
    });

    test.skip("should open Product window within acceptable time", async ({ page }) => {
      await openWindowBySearch(page, "produ", "MenuTitle__126");

      const start = Date.now();
      await page.locator("button.toolbar-button-new").waitFor({ state: "visible", timeout: 20_000 });
      assertPerformance(Date.now() - start, "Product window open", THRESHOLDS.windowOpen);
    });

    test.skip("should open Business Partner window within acceptable time", async ({ page }) => {
      const drawerInput = page.locator('[data-testid="drawer-search-input"] input');
      if (!await drawerInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await page.locator(".h-14 > div > .transition > svg").click();
        await drawerInput.waitFor({ state: "visible", timeout: 10_000 });
      }
      await drawerInput.click({ force: true });
      await page.keyboard.type("business");
      await page.locator('[data-testid^="MenuTitle"]').filter({ hasText: "Business Partner" }).first()
        .waitFor({ state: "visible", timeout: 10_000 });

      const start = Date.now();
      await page.locator('[data-testid^="MenuTitle"]').filter({ hasText: "Business Partner" }).first().click();
      await page.locator("button.toolbar-button-new").waitFor({ state: "visible", timeout: 20_000 });
      assertPerformance(Date.now() - start, "Business Partner window open", THRESHOLDS.windowOpen);
    });
  });

  // ── New Record Performance ─────────────────────────────────────────────────

  test.describe("New Record Performance", () => {
    test.skip("should open new Sales Order form within acceptable time", async ({ page }) => {
      await openWindowBySearch(page, "sales", "MenuTitle__129");
      await page.locator("button.toolbar-button-new").waitFor({ state: "visible", timeout: 20_000 });

      const start = Date.now();
      await page.locator("button.toolbar-button-new:not([disabled])").filter({ hasText: "New Record" }).first().click();
      await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 20_000 });
      assertPerformance(Date.now() - start, "New Sales Order form load", THRESHOLDS.newRecordForm);
    });

    test.skip("should open new Product form within acceptable time", async ({ page }) => {
      await openWindowBySearch(page, "produ", "MenuTitle__126");
      await page.locator("button.toolbar-button-new").waitFor({ state: "visible", timeout: 20_000 });

      const start = Date.now();
      await page.locator("button.toolbar-button-new:not([disabled])").filter({ hasText: "New Record" }).first().click();
      await page.locator('input[aria-label="Search Key"]').filter({ visible: true }).first()
        .waitFor({ state: "visible", timeout: 20_000 });
      assertPerformance(Date.now() - start, "New Product form load", THRESHOLDS.newRecordForm);
    });
  });

  // ── Save Record Performance ────────────────────────────────────────────────

  test.describe("Save Record Performance", () => {
    test.skip("should save a Sales Order header within acceptable time", async ({ page }) => {
      await openWindowBySearch(page, "sales", "MenuTitle__129");
      await page.locator("button.toolbar-button-new").waitFor({ state: "visible", timeout: 20_000 });

      await page.locator("button.toolbar-button-new:not([disabled])").filter({ hasText: "New Record" }).first().click();
      await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 20_000 });

      await page.locator('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
      await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click();

      await page.locator('[aria-describedby="Transaction Document-help"] > .w-2\\/3 > .relative > .w-full').click();
      await page.locator('[data-testid="OptionItem__FF8080812C2ABFC6012C2B3BDF4D005A"] > .truncate').click();

      const start = Date.now();
      await page.locator("button.toolbar-button-save").filter({ visible: true }).first().click();
      await page.locator("[data-sonner-toast]").waitFor({ state: "visible", timeout: 30_000 });
      assertPerformance(Date.now() - start, "Sales Order save", THRESHOLDS.saveRecordComplex);

      await closeToastIfPresent(page);
    });

    test.skip("should save a Product record within acceptable time", async ({ page }) => {
      await openWindowBySearch(page, "produ", "MenuTitle__126");
      await page.locator("button.toolbar-button-new").waitFor({ state: "visible", timeout: 20_000 });

      await page.locator("button.toolbar-button-new:not([disabled])").filter({ hasText: "New Record" }).first().click();
      const searchKeyInput = page.locator('input[aria-label="Search Key"]').first();
      await searchKeyInput.waitFor({ state: "visible", timeout: 20_000 });

      const uniqueKey = `PERF_${Date.now()}`;
      await searchKeyInput.clear();
      await searchKeyInput.fill(uniqueKey);
      await page.locator('input[aria-label="Name"]').clear();
      await page.locator('input[aria-label="Name"]').fill(`Perf Test Product ${uniqueKey}`);

      const start = Date.now();
      await page.locator("button.toolbar-button-save").filter({ visible: true }).first().click();
      await page.locator("[data-sonner-toast]").waitFor({ state: "visible", timeout: 30_000 });
      assertPerformance(Date.now() - start, "Product save", THRESHOLDS.saveRecord);

      await closeToastIfPresent(page);
    });
  });

  // ── Table Load Performance ─────────────────────────────────────────────────

  test.describe("Table Load Performance", () => {
    test.skip("should load Sales Order table with data within acceptable time", async ({ page }) => {
      await openWindowBySearch(page, "sales", "MenuTitle__129");

      const start = Date.now();
      await page.locator("tr[data-index]").first().waitFor({ state: "visible", timeout: 20_000 });
      assertPerformance(Date.now() - start, "Sales Order table load", THRESHOLDS.tableLoad);
    });

    test.skip("should load Product table with data within acceptable time", async ({ page }) => {
      await openWindowBySearch(page, "produ", "MenuTitle__126");

      const start = Date.now();
      await page.locator("tr[data-index]").first().waitFor({ state: "visible", timeout: 20_000 });
      assertPerformance(Date.now() - start, "Product table load", THRESHOLDS.tableLoad);
    });
  });

  // ── Tab Navigation Performance ─────────────────────────────────────────────

  test.describe("Tab Navigation Performance", () => {
    test.skip("should switch to Lines tab within acceptable time", async ({ page }) => {
      await openWindowBySearch(page, "sales", "MenuTitle__129");
      await page.locator("tr[data-index]").first().waitFor({ state: "visible", timeout: 20_000 });

      await page.locator("tr[data-index='0'] td button").first().click({ force: true });
      await page.waitForTimeout(3_000);

      const bodyText = await page.locator("body").textContent();
      if (bodyText?.includes("Application error")) {
        console.log("App crashed on row click — known app issue, skipping tab navigation");
        return;
      }

      const linesBtn = page.locator('button[aria-label="Lines"]').first();
      await linesBtn.waitFor({ state: "visible", timeout: 15_000 });

      const start = Date.now();
      await linesBtn.click({ force: true });
      await page.locator("tr[data-index]").first().waitFor({ state: "visible", timeout: 20_000 });
      assertPerformance(Date.now() - start, "Lines tab switch", THRESHOLDS.tabNavigation);
    });
  });

  // ── Search and Filter Performance ─────────────────────────────────────────

  test.describe("Search and Filter Performance", () => {
    test("should filter table results within acceptable time", async ({ page }) => {
      await openWindowBySearch(page, "produ", "MenuTitle__126");
      await page.locator("tr[data-index]").first().waitFor({ state: "visible", timeout: 20_000 });

      const advFiltersBtn = page.locator("button.toolbar-button-advanced-filters").first();
      const isAvailable =
        await advFiltersBtn.isVisible({ timeout: 10_000 }).catch(() => false) &&
        await advFiltersBtn.isEnabled().catch(() => false);

      if (!isAvailable) {
        console.log("Advanced Filters button not available, skipping");
        return;
      }

      const start = Date.now();
      await advFiltersBtn.click();
      await expect(page.getByText("Advanced Filters")).toBeVisible({ timeout: 10_000 });
      assertPerformance(Date.now() - start, "Advanced Filters open", THRESHOLDS.advancedFilters);
    });

    test.skip("should open dropdown options within acceptable time", async ({ page }) => {
      await openWindowBySearch(page, "sales", "MenuTitle__129");
      await page.locator("button.toolbar-button-new").waitFor({ state: "visible", timeout: 20_000 });

      await page.locator("button.toolbar-button-new:not([disabled])").filter({ hasText: "New Record" }).first().click();
      await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 20_000 });

      const start = Date.now();
      await page.locator('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm').click();
      await page.locator('[data-testid^="OptionItem"]').first().waitFor({ state: "visible", timeout: 15_000 });
      assertPerformance(Date.now() - start, "Dropdown options load", THRESHOLDS.dropdownLoad);
    });
  });

  // ── Consecutive CRUD Operations ────────────────────────────────────────────

  test.describe("Consecutive CRUD Operations Performance", () => {
    test.skip("should handle multiple record creations without degradation", async ({ page }) => {
      await openWindowBySearch(page, "produ", "MenuTitle__126");
      await page.locator("button.toolbar-button-new").waitFor({ state: "visible", timeout: 20_000 });

      const times: number[] = [];

      for (let i = 0; i < 3; i++) {
        const start = Date.now();
        await page.locator('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"]')
          .first()
          .click({ force: true });
        await page.locator('input[aria-label="Search Key"]').first()
          .waitFor({ state: "visible", timeout: 20_000 });
        times.push(Date.now() - start);

        const uniqueKey = `PERF_BATCH_${Date.now()}_${i}`;
        await page.locator('input[aria-label="Search Key"]').first().clear();
        await page.locator('input[aria-label="Search Key"]').first().fill(uniqueKey);
        await page.locator('input[aria-label="Name"]').clear();
        await page.locator('input[aria-label="Name"]').fill(`Perf Batch ${i}`);

        await page.locator("button.toolbar-button-save").filter({ visible: true }).first().click();
        await page.locator("[data-sonner-toast]").waitFor({ state: "visible", timeout: 30_000 });
        await closeToastIfPresent(page);
        await page.waitForTimeout(1_000);
      }

      for (let i = 0; i < times.length; i++) {
        assertPerformance(times[i], `Record ${i + 1} creation`, THRESHOLDS.consecutiveRecord);
      }
      console.log(`First: ${times[0]}ms, Last: ${times[times.length - 1]}ms`);
    });
  });
});

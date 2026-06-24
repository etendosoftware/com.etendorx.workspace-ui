import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  typeInGlobalSearch,
  disableImplicitFilter,
  openSidebarAndGetSearch,
} from "../../helpers/etendo.helpers";

test.describe("LinkedItems Navigation @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
    // Equivalent to Cypress `cy.on("uncaught:exception", () => false)`
    page.on("pageerror", () => {
      /* swallow uncaught page errors */
    });
  });

  test(
    "Navigates to Sales Order, Goods Shipment and Purchase Invoice, verifying LinkedItems navigation",
    { timeout: 360_000 },
    async ({ page }) => {
      await loginToEtendo(page);
      await selectRoleOrgWarehouse(page);

      // ── Small helpers (local to this test) ───────────────────────────────────
      const ensureDrawerOpen = async () => {
        await openSidebarAndGetSearch(page);
      };

      const navigateViaSearch = async (searchText: string, menuText: string | RegExp) => {
        await ensureDrawerOpen();
        await typeInGlobalSearch(page, searchText);

        const menuItem = page.locator('[data-testid^="MenuTitle__"]').filter({ hasText: menuText }).first();
        await menuItem.waitFor({ state: "visible", timeout: 10_000 });
        await menuItem.scrollIntoViewIfNeeded();
        await menuItem.click({ force: true });
        await page.waitForURL(/\/window/, { timeout: 15_000 });
      };

      const filterByDocumentNo = async (value: string) => {
        // Disable implicit filter (e.g. processed='N') before applying our filter
        await disableImplicitFilter(page);

        const filterInput = page.locator('input[placeholder="Filter Document No...."]').locator("visible=true").first();
        await filterInput.waitFor({ state: "visible", timeout: 15_000 });
        await filterInput.clear();
        await filterInput.fill(value);
        await filterInput.press("Enter");
        // Wait for the table to re-render with filtered results before proceeding
        await page
          .locator("tr:visible")
          .filter({ hasText: value })
          .first()
          .waitFor({ state: "visible", timeout: 15_000 });
      };

      const openRowFormByText = async (rowText: string | RegExp) => {
        // Re-query inside expect.toPass to handle DOM detachment
        // caused by column virtualisation re-renders.
        await expect(async () => {
          const btn = page
            .locator("tr:visible")
            .filter({ hasText: rowText })
            .first()
            .locator('button[data-testid^="form-button-"]');
          await btn.scrollIntoViewIfNeeded();
          await btn.click();
        }).toPass({ intervals: [500, 1_000, 2_000], timeout: 15_000 });
      };

      const openLinkedItemsTab = async () => {
        // UsedByLink request may be skipped if the result is cached — use catch to avoid
        // failing the test when no new network call is made.
        const reqPromise = page
          .waitForRequest((req) => req.url().includes("UsedByLink") && req.method() === "POST", { timeout: 5_000 })
          .catch(() => null);
        const btn = page
          .locator("button:visible")
          .filter({ hasText: /^Linked Items$/ })
          .first();
        await btn.waitFor({ state: "visible", timeout: 15_000 });
        await btn.scrollIntoViewIfNeeded();
        await Promise.all([reqPromise, btn.click()]);
      };

      const clickLinkedItemButton = async (label: string) => {
        const btn = page.locator("button:visible").filter({ hasText: label }).first();
        await btn.waitFor({ state: "visible", timeout: 15_000 });
        await btn.scrollIntoViewIfNeeded();
        await btn.click();
      };

      const clickParagraphWithText = async (pattern: string | RegExp, extraSelector?: string) => {
        const base = extraSelector ? page.locator(extraSelector) : page.locator("p:visible");
        const el = base.filter({ hasText: pattern }).first();
        await el.waitFor({ state: "visible", timeout: 15_000 });
        await el.scrollIntoViewIfNeeded();
        await el.click();
      };

      // =========================================================================
      // PART 1: Sales Order
      // =========================================================================
      await navigateViaSearch("sales order", "Sales Order");
      await filterByDocumentNo("50012");
      await openRowFormByText("50012");

      await openLinkedItemsTab();
      await clickLinkedItemButton("Sales Quotation - Line Tax");
      await clickParagraphWithText(/50012.*Exempt.*VAT/);

      await expect(
        page
          .locator("span:visible")
          .filter({ hasText: /^Sales Quotation$/ })
          .first()
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        page
          .locator("button:visible")
          .filter({ hasText: /^Line Tax$/ })
          .first()
      ).toBeVisible({ timeout: 10_000 });

      // =========================================================================
      // PART 2: Goods Shipment
      // =========================================================================
      await navigateViaSearch("goods shipment", "Goods Shipment");

      await page.waitForTimeout(1_000);
      await filterByDocumentNo("500014");

      // Column virtualisation: scroll the table to the right so the pinned
      // actions column with the form button becomes visible.
      await page
        .locator(".MuiTableContainer-root:visible")
        .first()
        .evaluate((el) => {
          (el as HTMLElement).scrollLeft = (el as HTMLElement).scrollWidth;
        });

      await openRowFormByText("2014");

      await openLinkedItemsTab();
      await clickLinkedItemButton("Goods Shipment - Lines");
      await clickParagraphWithText(/500014.*Customer A.*costing Product 2/);

      await expect(
        page
          .locator("p:visible")
          .filter({ hasText: /^Goods Shipment$/ })
          .first()
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        page
          .locator("button:visible")
          .filter({ hasText: /^Lines$/ })
          .first()
      ).toBeVisible({ timeout: 10_000 });

      // =========================================================================
      // PART 3: Purchase Invoice
      // =========================================================================
      await navigateViaSearch("purchase invoice", "Purchase Invoice");
      await filterByDocumentNo("10000017");
      await openRowFormByText("10000017");

      await openLinkedItemsTab();
      await clickLinkedItemButton("Purchase Invoice - Basic Discounts");
      await clickParagraphWithText("10000017");

      // Navigate through the blue link
      await clickParagraphWithText("10000017", "p.text-sm.text-blue-600");

      await expect(
        page
          .locator(":is(p, span):visible")
          .filter({ hasText: /^Purchase Invoice$/ })
          .first()
      ).toBeVisible({ timeout: 15_000 });
      await expect(
        page
          .locator("button:visible")
          .filter({ hasText: /^Basic Discounts$/ })
          .first()
      ).toBeVisible({ timeout: 10_000 });
    }
  );
});

import { test, expect } from "@playwright/test";
import { loginToEtendo, cleanupEtendo, selectRoleOrgWarehouse, typeInGlobalSearch } from "../../helpers/etendo.helpers";

test.describe("LinkedItems Navigation @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
    // Equivalent to Cypress `cy.on("uncaught:exception", () => false)`
    page.on("pageerror", () => {
      /* swallow uncaught page errors */
    });
  });

  test("Navigates to Sales Order, Goods Shipment and Purchase Invoice, verifying LinkedItems navigation", async ({
    page,
  }) => {
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);

    // ── Small helpers (local to this test) ───────────────────────────────────
    const ensureDrawerOpen = async () => {
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
      const filterInput = page
        .locator('input.w-full[placeholder="Filter Document No...."]')
        .locator("visible=true")
        .first();
      await filterInput.waitFor({ state: "visible", timeout: 15_000 });
      await filterInput.clear();
      await filterInput.fill(value);
      await filterInput.press("Enter");
      await page.waitForTimeout(1_000);
    };

    const openRowFormByText = async (rowText: string | RegExp) => {
      const row = page.locator("tr").filter({ hasText: rowText }).first();
      await row.waitFor({ state: "visible", timeout: 10_000 });
      await row.scrollIntoViewIfNeeded();
      await row.locator('button[data-testid^="form-button-"]').click();
    };

    const openLinkedItemsTab = async () => {
      const reqPromise = page.waitForRequest((req) => req.url().includes("UsedByLink") && req.method() === "POST", {
        timeout: 20_000,
      });
      const btn = page
        .locator("button")
        .filter({ hasText: /^Linked Items$/ })
        .first();
      await btn.waitFor({ state: "visible", timeout: 15_000 });
      await btn.scrollIntoViewIfNeeded();
      await Promise.all([reqPromise, btn.click()]);
    };

    const clickLinkedItemButton = async (label: string) => {
      const btn = page.locator("button").filter({ hasText: label }).first();
      await btn.waitFor({ state: "visible", timeout: 15_000 });
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
    };

    const clickParagraphWithText = async (pattern: string | RegExp, extraSelector?: string) => {
      const base = extraSelector ? page.locator(extraSelector) : page.locator("p");
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
        .locator("span")
        .filter({ hasText: /^Sales Quotation$/ })
        .first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page
        .locator("button")
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
      .locator(".MuiTableContainer-root")
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
        .locator("p")
        .filter({ hasText: /^Goods Shipment$/ })
        .first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page
        .locator("button")
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
        .locator("p")
        .filter({ hasText: /^Purchase Invoice$/ })
        .first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page
        .locator("button")
        .filter({ hasText: /^Basic Discounts$/ })
        .first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

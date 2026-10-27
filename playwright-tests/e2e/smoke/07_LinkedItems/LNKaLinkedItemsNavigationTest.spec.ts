import type { Page } from "@playwright/test";
import { expect, test } from "../../support/fixtures";
import type { WindowKey } from "../../support/registry/windows";

const DOCUMENT_NO_COLUMN = "Document No.";
/** Entries of the Linked Items list: `LinkedItem__<record id>`. */
const LINKED_ITEMS = '[data-testid^="LinkedItem__"]:visible';
/**
 * A linked record opens in a new window only once its whole tab hierarchy is restored: up to a
 * minute on a busy CI.
 */
const NAVIGATION_TIMEOUT = 60_000;
/** The server looks for the linked records in every table that references the record: slow on a busy CI. */
const CATEGORIES_TIMEOUT = 60_000;
/** Child tabs of the opened record load after its window is shown. */
const TAB_TIMEOUT = 30_000;

/** Visible button with exactly `text`: section and category tabs are buttons with role="tab". */
const buttonWithText = (page: Page, text: string | RegExp) =>
  page.locator("button:visible").filter({ hasText: text }).first();

test.describe("LinkedItems Navigation @smoke", () => {
  test.beforeEach(async ({ page }) => {
    // Equivalent to Cypress `cy.on("uncaught:exception", () => false)`
    page.on("pageerror", () => {
      /* swallow uncaught page errors */
    });
  });

  test("Navigates to Sales Order, Goods Shipment and Purchase Invoice, verifying LinkedItems navigation", async ({
    app,
    page,
  }) => {
    // ── Small helpers (local to this test) ───────────────────────────────────
    const openWindow = async (key: WindowKey) => {
      await app.sidebar.navigateTo(key);
      await page.waitForURL(/\/window/, { timeout: 15_000 });
    };

    const filterByDocumentNo = async (value: string) => {
      // Disable implicit filter (e.g. processed='N') before applying our filter
      await app.toolbar.disableImplicitFilter();
      await app.grid.filter(DOCUMENT_NO_COLUMN, value);
      // Wait for the table to re-render with filtered results before proceeding
      await app.grid.waitForRow(value);
    };

    const openLinkedItemsTab = async () => {
      const btn = buttonWithText(page, /^Linked Items$/);
      await btn.waitFor({ state: "visible", timeout: 15_000 });
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
    };

    /** Opens a category of linked records: the categories are asked to the server once the section opens. */
    const clickLinkedItemButton = async (label: string) => {
      const btn = buttonWithText(page, label);
      await btn.waitFor({ state: "visible", timeout: CATEGORIES_TIMEOUT });
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
    };

    /**
     * Opens the linked record `item` and waits until its window is the active one. Until then the
     * window it was opened from is still shown, and a window opened meanwhile is discarded when
     * the linked one is restored.
     */
    const openLinkedItem = async (item: string | RegExp) => {
      const openWindows = await app.windows.closeButtons.count();
      const entry = page.locator(LINKED_ITEMS).filter({ hasText: item }).first();
      await entry.waitFor({ state: "visible", timeout: 15_000 });
      await entry.scrollIntoViewIfNeeded();
      await entry.click();
      await expect(app.windows.closeButtons).toHaveCount(openWindows + 1, { timeout: NAVIGATION_TIMEOUT });
      await app.breadcrumb.waitFor(item, NAVIGATION_TIMEOUT);
    };

    // =========================================================================
    // PART 1: Sales Order
    // =========================================================================
    await openWindow("salesOrder");
    await filterByDocumentNo("50012");
    await app.grid.openForm("50012");

    await openLinkedItemsTab();
    await clickLinkedItemButton("Sales Quotation - Line Tax");
    await openLinkedItem(/50012.*Exempt.*VAT/);

    await expect(
      page
        .locator("span:visible")
        .filter({ hasText: /^Sales Quotation$/ })
        .first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(buttonWithText(page, /^Line Tax$/)).toBeVisible({ timeout: TAB_TIMEOUT });

    // =========================================================================
    // PART 2: Goods Shipment
    // =========================================================================
    await openWindow("goodsShipment");
    await filterByDocumentNo("500014");

    // Column virtualisation: scroll the table to the right so the pinned
    // actions column with the form button becomes visible.
    await app.grid.scrollToRightEnd();

    await app.grid.openForm("2014");

    await openLinkedItemsTab();
    await clickLinkedItemButton("Goods Shipment - Lines");
    await openLinkedItem(/500014.*Customer A.*costing Product 2/);

    await expect(
      page
        .locator("p:visible")
        .filter({ hasText: /^Goods Shipment$/ })
        .first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(buttonWithText(page, /^Lines$/)).toBeVisible({ timeout: TAB_TIMEOUT });

    // =========================================================================
    // PART 3: Purchase Invoice
    // =========================================================================
    await openWindow("purchaseInvoice");
    await filterByDocumentNo("10000017");
    await app.grid.openForm("10000017");

    await openLinkedItemsTab();
    await clickLinkedItemButton("Purchase Invoice - Basic Discounts");
    await openLinkedItem("10000017");

    await expect(
      page
        .locator(":is(p, span):visible")
        .filter({ hasText: /^Purchase Invoice$/ })
        .first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(buttonWithText(page, /^Basic Discounts$/)).toBeVisible({ timeout: TAB_TIMEOUT });
  });
});

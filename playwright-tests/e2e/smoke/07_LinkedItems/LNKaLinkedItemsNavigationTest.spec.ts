import type { Page } from "@playwright/test";
import { expect, test } from "../../support/fixtures";
import type { WindowKey } from "../../support/registry/windows";

const DOCUMENT_NO_COLUMN = "Document No.";
/** Entries of the Linked Items list: `LinkedItem__<record id>`. */
const LINKED_ITEMS = '[data-testid^="LinkedItem__"]:visible';

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

    const clickLinkedItemButton = async (label: string) => {
      const btn = buttonWithText(page, label);
      await btn.waitFor({ state: "visible", timeout: 15_000 });
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
    };

    const clickParagraphWithText = async (pattern: string | RegExp) => {
      const el = page.locator("p:visible").filter({ hasText: pattern }).first();
      await el.waitFor({ state: "visible", timeout: 15_000 });
      await el.scrollIntoViewIfNeeded();
      await el.click();
    };

    // =========================================================================
    // PART 1: Sales Order
    // =========================================================================
    await openWindow("salesOrder");
    await filterByDocumentNo("50012");
    await app.grid.openForm("50012");

    await openLinkedItemsTab();
    await clickLinkedItemButton("Sales Quotation - Line Tax");
    await clickParagraphWithText(/50012.*Exempt.*VAT/);

    await expect(
      page
        .locator("span:visible")
        .filter({ hasText: /^Sales Quotation$/ })
        .first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(buttonWithText(page, /^Line Tax$/)).toBeVisible({
      timeout: 10_000,
    });

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
    await clickParagraphWithText(/500014.*Customer A.*costing Product 2/);

    await expect(
      page
        .locator("p:visible")
        .filter({ hasText: /^Goods Shipment$/ })
        .first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(buttonWithText(page, /^Lines$/)).toBeVisible({
      timeout: 10_000,
    });

    // =========================================================================
    // PART 3: Purchase Invoice
    // =========================================================================
    await openWindow("purchaseInvoice");
    await filterByDocumentNo("10000017");
    await app.grid.openForm("10000017");

    await openLinkedItemsTab();
    await clickLinkedItemButton("Purchase Invoice - Basic Discounts");
    await clickParagraphWithText("10000017");

    // Navigate through the linked record entry
    await page.locator(LINKED_ITEMS).filter({ hasText: "10000017" }).first().click();

    await expect(
      page
        .locator(":is(p, span):visible")
        .filter({ hasText: /^Purchase Invoice$/ })
        .first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(buttonWithText(page, /^Basic Discounts$/)).toBeVisible({
      timeout: 10_000,
    });
  });
});

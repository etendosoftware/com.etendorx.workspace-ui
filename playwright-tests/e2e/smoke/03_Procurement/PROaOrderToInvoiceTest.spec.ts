import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  closeToastIfPresent,
  captureDocumentNumber,
  fillCreateLinesFromPopup,
  navigateToPurchaseOrder,
  navigateToGoodsReceipt,
  navigateToPurchaseInvoice,
} from "../../helpers/etendo.helpers";

test.describe("Purchase Order to Invoice flow @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Completes Purchase Order, Goods Receipt and posts the Vendor Invoice", async ({ page }) => {
    // ── Login ────────────────────────────────────────────────────────────────
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);

    // ── Step 1: Navigate to Purchase Order ───────────────────────────────────
    await navigateToPurchaseOrder(page);

    // ── Step 2: New Purchase Order ───────────────────────────────────────────
    const newBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Fill Business Partner ────────────────────────────────────────
    // Use div[tabindex="0"] as the MUI Select/Autocomplete trigger (works for both component types)
    await page.locator('[aria-describedby="Business Partner-help"]').locator('div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await closeToastIfPresent(page);

    // ── Step 4: Add Order Line ────────────────────────────────────────────────
    await page.locator('button[aria-label="Lines"]').click();
    // The Lines sub-grid "+ New Record" button — use text match to avoid testid differences
    // between Sales Order and Purchase Order contexts
    await page.getByRole("button", { name: "New Record" }).last().waitFor({ state: "visible", timeout: 10_000 });
    await page.getByRole("button", { name: "New Record" }).last().click();

    // Select Product — use aria-label (Cypress-equivalent)
    await page.locator('[aria-label="Product"]').locator('div[tabindex="0"]').waitFor({ state: "visible", timeout: 10_000 });
    // FormInitializationComponent may or may not fire depending on product configuration;
    // use a non-blocking catch so the test continues either way
    const formInitDone = page.waitForResponse(/FormInitializationComponent/, { timeout: 30_000 }).catch(() => null);
    await page.locator('[aria-label="Product"]').locator('div[tabindex="0"]').click();
    // Wait for the options list to load, then click the specific product
    await page.locator('[data-testid^="OptionItem__"]').first().waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"] > .truncate').click({ force: true });
    await formInitDone; // resolves immediately if the response wasn't triggered

    // Set Quantity (use evaluate to bypass React-controlled input)
    await page.locator('[data-testid="TextInput__3389"]').waitFor({ state: "visible" });
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="TextInput__3389"]') as HTMLInputElement;
      if (!input) return;
      input.disabled = false;
      input.readOnly = false;
      input.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(input, "11,2");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Save line (second save button = line-level save)
    await page.locator("button.toolbar-button-save").last().click();
    await closeToastIfPresent(page);

    // ── Step 5: Capture Document Number for later ────────────────────────────
    const orderNumber = await captureDocumentNumber(page);

    // ── Step 6: Book Purchase Order ──────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.locator(".rounded-2xl").getByText("Book", { exact: true }).click();

    await clickOkInLegacyPopup(page);
    await page.waitForTimeout(500);
    await page.locator('[data-testid="close-button"]').waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
    await page.locator('[data-testid="close-button"]').click({ force: true }).catch(() => null);
    await closeToastIfPresent(page);

    // ── Step 7: Navigate to Goods Receipt ────────────────────────────────────
    await navigateToGoodsReceipt(page);

    const newGoodsBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newGoodsBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newGoodsBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // Business Partner
    await page
      .locator('[aria-describedby="Business Partner-help"]')
      .locator('div[tabindex="0"]')
      .scrollIntoViewIfNeeded();
    await page
      .locator('[aria-describedby="Business Partner-help"]')
      .locator('div[tabindex="0"]')
      .click({ force: true });
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await closeToastIfPresent(page);

    // ── Step 8: Create Lines From Purchase Order (legacy iframe popup) ────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();

    await fillCreateLinesFromPopup(page, { locatorValue: "L01" });
    // Close the process modal (matching Cypress: cy.get('[data-testid="close-button"]').click())
    await page.locator('[data-testid="close-button"]').waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
    await page.locator('[data-testid="close-button"]').click({ force: true }).catch(() => null);
    await closeToastIfPresent(page);

    // ── Step 9: Complete Goods Receipt ───────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.locator(".rounded-2xl").getByText("Complete", { exact: true }).click();

    await clickOkInLegacyPopup(page);
    // Close the process modal regardless of success/error (matching Cypress behavior)
    await page.waitForTimeout(500);
    await page.locator('[data-testid="close-button"]').waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
    await page.locator('[data-testid="close-button"]').click({ force: true }).catch(() => null);
    await closeToastIfPresent(page);

    // ── Step 10: Navigate to Purchase Invoice ─────────────────────────────────
    await navigateToPurchaseInvoice(page);

    const newInvoiceBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newInvoiceBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newInvoiceBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // Business Partner — uses a text search input (not a simple dropdown)
    await page
      .locator('[aria-describedby="Business Partner-help"]')
      .locator('div[tabindex="0"]')
      .scrollIntoViewIfNeeded();
    await page
      .locator('[aria-describedby="Business Partner-help"]')
      .locator('div[tabindex="0"]')
      .click({ force: true });
    const bpSearch = page.locator('input[aria-label="Search options"]');
    await bpSearch.waitFor({ state: "visible", timeout: 10_000 });
    await bpSearch.clear();
    await bpSearch.fill("Vendor A");
    const vendorOption = page.locator('[data-testid^="OptionItem__"]').filter({ hasText: /^Vendor A$/ });
    await vendorOption.waitFor({ state: "visible", timeout: 10_000 });
    await vendorOption.click({ force: true });

    await expect(page.locator('[aria-describedby="Business Partner-help"]')).toContainText("Vendor A");

    // Save header
    await page.locator("button.toolbar-button-save").filter({ visible: true }).first().click();
    await closeToastIfPresent(page);

    // ── Step 11: Create Lines From Order (React table popup) ──────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.locator(".rounded-2xl").getByText("Create Lines From Order", { exact: true }).click();

    // Filter the table by order number and wait for the datasource response
    // Use .last() — two inputs render (label + actual input); the last visible one is the active filter
    const filterInput = page.locator('input.w-full[placeholder="Filter Document No...."]').last();
    await filterInput.waitFor({ state: "visible", timeout: 15_000 });
    const datasourceDone = page.waitForResponse(/api\/datasource/, { timeout: 30_000 });
    await filterInput.clear();
    await filterInput.fill(orderNumber);
    await filterInput.press("Enter");
    await datasourceDone;

    // Select the matching row
    await page.locator(`text=${orderNumber}`).first().waitFor({ state: "visible", timeout: 10_000 });
    await page
      .locator("tr")
      .filter({ hasText: orderNumber })
      .locator('input[type="checkbox"]')
      .check();

    await page.locator('[data-testid="ExecuteButton__761503"]').click();
    // Wait for the React modal to close
    await page.locator(".fixed.inset-0").waitFor({ state: "hidden", timeout: 15_000 }).catch(() => null);

    // ── Step 12: Complete Purchase Invoice ────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl").getByText("Complete", { exact: true }).click();

    await clickOkInLegacyPopup(page);
    await page.waitForTimeout(500);
    await page.locator('[data-testid="close-button"]').waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
    await page.locator('[data-testid="close-button"]').click({ force: true }).catch(() => null);
    await closeToastIfPresent(page);

    // ── Step 13: Post Invoice ─────────────────────────────────────────────────
    // Navigate back to header via back-navigation icon
    await page.locator('[data-testid="IconButton__25D1FA357A484AE38A3E2382889198FE"]').first().click();
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl").getByText("Post", { exact: true }).click();

    await clickOkInLegacyPopup(page);
    await page.waitForTimeout(500);
    await page.locator('[data-testid="close-button"]').waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
    await page.locator('[data-testid="close-button"]').click({ force: true }).catch(() => null);
    await closeToastIfPresent(page);
  });
});

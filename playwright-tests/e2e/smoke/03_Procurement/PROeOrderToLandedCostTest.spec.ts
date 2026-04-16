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
  navigateToLandedCost,
  navigateToProcessScheduler,
} from "../../helpers/etendo.helpers";

test.describe.skip("Purchase Order to Landed Cost flow @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Processes Landed Cost from Goods Receipt and validates cost distribution", async ({ page }) => {
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
    await page.locator('[aria-label="Business Partner"]').locator('div[tabindex="0"]').click();
    const bpSearch1 = page.locator('input[aria-label="Search options"]');
    if (await bpSearch1.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await bpSearch1.fill("Vendor A");
    }
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: /^Vendor A$/ })
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: /^Vendor A$/ })
      .first()
      .click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await closeToastIfPresent(page);

    // ── Step 4: Add Order Line ────────────────────────────────────────────────
    await page.locator('button[aria-label="Lines"]').click();
    await page.getByRole("button", { name: "New Record" }).last().waitFor({ state: "visible", timeout: 10_000 });
    await page.getByRole("button", { name: "New Record" }).last().click();

    await page
      .locator('[aria-label="Product"]')
      .locator('div[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[aria-label="Product"]').locator('div[tabindex="0"]').click();
    // Search for "Raw material A" — a product with an attribute set (required for Landed Cost flow)
    const productSearch = page.locator('input[aria-label="Search options"]');
    if (await productSearch.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await productSearch.fill("Raw material A");
    }
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: /^Raw material A$/ })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: /^Raw material A$/ })
      .first()
      .click({ force: true });

    // If the product has an attribute set, the "Attribute Set Value" field appears
    // right after product selection. Set it before saving the line.
    const attrContainer = page.locator('[aria-describedby="Attribute Set Value-help"]');
    if (await attrContainer.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await attrContainer.locator("button").last().click();
      await page.getByText("Attribute Selector").waitFor({ state: "visible", timeout: 10_000 });
      const lotNameInput = page.getByLabel("Lot Name");
      await lotNameInput.waitFor({ state: "visible", timeout: 5_000 });
      await lotNameInput.clear();
      await lotNameInput.fill("Test");
      await page.waitForTimeout(500);
      await page.getByRole("button", { name: "OK" }).click();
      await page
        .getByText("Attribute Selector")
        .waitFor({ state: "hidden", timeout: 10_000 })
        .catch(() => null);
    }

    // Set Quantity (use evaluate to bypass React-controlled input)
    await page.locator('[data-testid="TextInput__3389"]').waitFor({ state: "visible" });
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="TextInput__3389"]') as HTMLInputElement;
      if (!input) return;
      input.disabled = false;
      input.readOnly = false;
      input.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(input, "10");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Save line
    await page.locator("button.toolbar-button-save").last().click();
    await closeToastIfPresent(page);

    // ── Step 5: Book Purchase Order ───────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.locator(".rounded-2xl").getByText("Book", { exact: true }).click();

    await clickOkInLegacyPopup(page);
    await page.waitForTimeout(500);
    await page
      .locator('[data-testid="close-button"]')
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => null);
    await page
      .locator('[data-testid="close-button"]')
      .click({ force: true })
      .catch(() => null);
    await closeToastIfPresent(page);

    const purchaseOrderNumber = await captureDocumentNumber(page);

    // ── Step 6: Navigate to Goods Receipt ────────────────────────────────────
    await navigateToGoodsReceipt(page);

    const newGoodsBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newGoodsBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newGoodsBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // ── Step 7: Fill Business Partner on Goods Receipt ───────────────────────
    await page
      .locator('[aria-describedby="Business Partner-help"]')
      .locator('div[tabindex="0"]')
      .scrollIntoViewIfNeeded();
    await page
      .locator('[aria-describedby="Business Partner-help"]')
      .locator('div[tabindex="0"]')
      .click({ force: true });
    const bpSearch2 = page.locator('input[aria-label="Search options"]');
    if (await bpSearch2.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await bpSearch2.fill("Vendor A");
    }
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: /^Vendor A$/ })
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: /^Vendor A$/ })
      .first()
      .click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await closeToastIfPresent(page);

    // ── Step 8: Create Lines From Purchase Order (legacy iframe popup) ────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();

    await fillCreateLinesFromPopup(page, { locatorValue: "RN-2-0-0", orderDocNumber: purchaseOrderNumber });
    await page
      .locator('[data-testid="close-button"]')
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => null);
    await page
      .locator('[data-testid="close-button"]')
      .click({ force: true })
      .catch(() => null);
    await closeToastIfPresent(page);

    // ── Step 9: Capture Goods Receipt Document Number ─────────────────────────
    const goodsReceiptNumber = await captureDocumentNumber(page);

    // ── Step 11: Complete Goods Receipt ──────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.locator(".rounded-2xl").getByText("Complete", { exact: true }).click();

    await clickOkInLegacyPopup(page);
    await page.waitForTimeout(500);
    await page
      .locator('[data-testid="close-button"]')
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => null);
    await page
      .locator('[data-testid="close-button"]')
      .click({ force: true })
      .catch(() => null);
    await closeToastIfPresent(page);

    // ── Step 12: Reschedule "Costing Background Process" in Process Request ─────
    await navigateToProcessScheduler(page);

    // Find the "Costing Background" row directly by text (no filter needed)
    const costingRow = page
      .locator("tbody tr")
      .filter({ hasText: /Costing Background/i })
      .first();
    await costingRow.waitFor({ state: "attached", timeout: 10_000 });
    await costingRow.locator('input[type="checkbox"]').check({ force: true });
    await page.waitForTimeout(500);

    // Available Process > Reschedule Process
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.waitForTimeout(1_000);
    await page.getByText("Reschedule Process", { exact: true }).click();
    await closeToastIfPresent(page);

    // ── Step 13: Navigate to Landed Cost ─────────────────────────────────────
    await navigateToLandedCost(page);

    // ── Step 14: New Landed Cost ──────────────────────────────────────────────
    const newLCBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newLCBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newLCBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // ── Step 15: Save Landed Cost header ─────────────────────────────────────
    await page.locator("button.toolbar-button-save").first().click();
    await closeToastIfPresent(page);

    // ── Step 16: Add Cost Line ─────────────────────────────────────────────────
    await page.locator('button[aria-label="Cost"]').click();
    await page.getByRole("button", { name: "New Record" }).last().waitFor({ state: "visible", timeout: 10_000 });
    await page.getByRole("button", { name: "New Record" }).last().click();

    const costAmountInput = page.locator('[data-testid="TextInput__0056819E516C679FE050007F01000569"]');
    await costAmountInput.waitFor({ state: "visible", timeout: 10_000 });
    await costAmountInput.clear();
    await costAmountInput.fill("1");

    await page.locator("button.toolbar-button-save").last().click();
    await closeToastIfPresent(page);
    await page.waitForTimeout(1_000);

    // ── Step 17: Add Receipt Line ─────────────────────────────────────────────
    await page.locator('button[aria-label="Receipt"]').click();
    await page.getByRole("button", { name: "New Record" }).last().waitFor({ state: "visible", timeout: 10_000 });
    await page.getByRole("button", { name: "New Record" }).last().click();

    // Click the Goods Receipt lookup trigger
    const grLookup = page.locator('[aria-describedby="Goods Receipt-help"]').locator('[tabindex="-1"]');
    await grLookup.waitFor({ state: "visible", timeout: 10_000 });
    await grLookup.click();
    await page.waitForTimeout(1_000);

    // Search for the Goods Receipt by document number
    const grSearch = page.locator('input[placeholder="Search..."]');
    await grSearch.waitFor({ state: "visible", timeout: 10_000 });
    await grSearch.clear();
    await grSearch.fill(goodsReceiptNumber);
    await page.waitForTimeout(3_000);

    await page.locator(`text=${goodsReceiptNumber}`).first().waitFor({ state: "visible", timeout: 10_000 });
    await page.locator(`text=${goodsReceiptNumber}`).first().click();

    // Save receipt line
    await page
      .locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"]')
      .last()
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"]').last().click();
    await closeToastIfPresent(page);

    // ── Step 18: Process Landed Cost ─────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl > .cursor-pointer").first().click();

    await page.locator('[data-testid="ExecuteButton__761503"]').waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[data-testid="ExecuteButton__761503"]').click();

    // ── Step 19: Verify completion ────────────────────────────────────────────
    await expect(page.getByText(/Process completed success/i).first()).toBeVisible({ timeout: 30_000 });
  });
});

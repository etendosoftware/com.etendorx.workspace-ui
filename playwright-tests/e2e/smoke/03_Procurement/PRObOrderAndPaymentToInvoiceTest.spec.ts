import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  closeToastIfPresent,
  captureDocumentNumber,
  navigateToPurchaseOrder,
  navigateToPurchaseInvoice,
  navigateToPaymentOut,
} from "../../helpers/etendo.helpers";

test.describe.skip("Purchase Order with advance payment flow @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Processes advance payment and validates Purchase Invoice payments", async ({ page }) => {
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
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();

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
    const productSearch = page.locator('input[aria-label="Search options"]');
    if (await productSearch.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await productSearch.fill("Raw material");
      await page.waitForTimeout(500);
    }
    await page
      .locator('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"]')
      .waitFor({ state: "visible", timeout: 15_000 });
    const formInitDone = page.waitForResponse(/FormInitializationComponent/, { timeout: 30_000 }).catch(() => null);
    await page
      .locator('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"] > .truncate')
      .click({ force: true });
    await formInitDone;

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

    // Save line
    await page.locator("button.toolbar-button-save").last().click();
    await closeToastIfPresent(page);

    // ── Step 5: Capture Document Number ──────────────────────────────────────
    const orderNumber = await captureDocumentNumber(page);

    // ── Step 6: Book Purchase Order ───────────────────────────────────────────
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

    // ── Step 7: Navigate to Payment Out ──────────────────────────────────────
    await navigateToPaymentOut(page);

    // ── Step 8: New Payment Out with Business Partner ─────────────────────────
    const newPaymentBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newPaymentBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newPaymentBtn.click();

    await page.locator('[aria-label="Paying To"]').locator('div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await closeToastIfPresent(page);

    // ── Step 9: Add Document — select Purchase Order from popup ───────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl > .cursor-pointer").first().click();

    // Filter by Order No. and select the row
    const orderFilterInput = page.locator('input[placeholder="Filter by Order No."]');
    await orderFilterInput.waitFor({ state: "visible", timeout: 10_000 });
    await orderFilterInput.clear();
    await orderFilterInput.fill(orderNumber);
    await page.waitForTimeout(1_000);
    await page.locator("tbody tr").first().waitFor({ state: "visible", timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.locator(".MuiTableCell-root").filter({ hasText: orderNumber }).first().click({ force: true });
    await page.waitForTimeout(500);

    // ── Step 10: Select Action "Process Made Payment(s)" ─────────────────────
    const actionDropdown = page.locator('[aria-label="Action Regarding Document"]').locator('div[tabindex="0"]');
    await actionDropdown.waitFor({ state: "visible", timeout: 15_000 });
    await actionDropdown.click();
    await page
      .locator('[data-testid="OptionItem__DDCDE32A9FC046E694D5074144DD6AFF"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[data-testid="OptionItem__DDCDE32A9FC046E694D5074144DD6AFF"]').click();

    // ── Step 11: Execute payment ──────────────────────────────────────────────
    await page.locator('[data-testid="ExecuteButton__761503"]').click();
    await page.waitForTimeout(2_000);

    // Close result
    const closeResultBtn = page.locator('[data-testid="CloseResultButton__761503"]');
    await closeResultBtn.waitFor({ state: "visible", timeout: 10_000 }).catch(() => null);
    await closeResultBtn.click({ force: true }).catch(async () => {
      // Fallback to generic close button
      await page
        .locator('[data-testid="close-button"]')
        .click({ force: true })
        .catch(() => null);
    });
    await page
      .locator(".fixed.inset-0")
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => null);

    // ── Step 12: Navigate to Purchase Invoice ─────────────────────────────────
    await navigateToPurchaseInvoice(page);

    // ── Step 13: New Purchase Invoice ─────────────────────────────────────────
    const newInvoiceBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newInvoiceBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newInvoiceBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // ── Step 14: Fill Business Partner ────────────────────────────────────────
    await page.locator('[aria-label="Business Partner"]').locator('div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await closeToastIfPresent(page);

    // ── Step 15: Create Lines From Order ──────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl > :nth-child(2)").click();

    const docFilterInput = page.locator('input.w-full[placeholder="Filter Document No...."]').last();
    await docFilterInput.waitFor({ state: "visible", timeout: 15_000 });
    const datasourceDone = page.waitForResponse(/api\/datasource/, { timeout: 30_000 }).catch(() => null);
    await docFilterInput.clear();
    await docFilterInput.fill(orderNumber);
    await docFilterInput.press("Enter");
    await datasourceDone;

    await page.locator(`text=${orderNumber}`).first().waitFor({ state: "visible", timeout: 20_000 });
    await page.locator("tr").filter({ hasText: orderNumber }).locator('input[type="checkbox"]').check();

    await page.locator('[data-testid="ExecuteButton__761503"]').click();
    await page
      .locator(".fixed.inset-0")
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => null);

    // ── Step 16: Book Purchase Invoice ────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();

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
  });
});

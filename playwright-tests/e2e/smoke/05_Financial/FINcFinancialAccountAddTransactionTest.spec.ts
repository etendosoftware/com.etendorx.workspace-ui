import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  navigateToPurchaseInvoice,
  closeToastIfPresent,
  navigateToFinancialAccount,
  navigateToPaymentOut,
} from "../../helpers/etendo.helpers";

test.describe("Financial Account - Add Transaction from Purchase Invoice @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Creates Purchase Invoice, completes it, verifies Payment Out Plan and adds Financial Account transaction", async ({
    page,
  }) => {
    test.setTimeout(360_000);
    // ── Login ────────────────────────────────────────────────────────────────
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);

    // ── Step 1: Navigate to Purchase Invoice ─────────────────────────────────
    await navigateToPurchaseInvoice(page);

    // ── Step 2: Create new Purchase Invoice ──────────────────────────────────
    const newBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // Business Partner: Vendor A
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

    // Save header
    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await closeToastIfPresent(page);

    // ── Step 3: Change Payment Method to PM 4 Spain ───────────────────────────
    await page.locator('[data-testid="ChevronDown__830698140BCD4AC3E040007F01000289"]').click({ force: true });
    await page.waitForTimeout(500);
    await page.locator('[data-testid="OptionItem__BC79E3E914CF471C91AE183FC5311BE7"]').scrollIntoViewIfNeeded();
    await page.locator('[data-testid="OptionItem__BC79E3E914CF471C91AE183FC5311BE7"]').click({ force: true });
    await page.waitForTimeout(500);

    // Save with payment method
    await page.locator("button.toolbar-button-save").filter({ visible: true }).first().click();
    await closeToastIfPresent(page);

    // ── Step 4: Add Invoice Line ──────────────────────────────────────────────
    await page.locator('button[aria-label="Lines"]').click();

    const newLineBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newLineBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newLineBtn.click();

    // Product: Raw material A
    // Open dropdown via ChevronDown, search to narrow the list to a single result,
    // then use ArrowDown+Enter (the search input container intercepts pointer clicks on options)
    await page.locator('[data-testid="ChevronDown__3371"]').first().waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[data-testid="ChevronDown__3371"]').first().click({ force: true });
    const productSearch = page.locator('input[aria-label="Search options"]');
    await productSearch.waitFor({ state: "visible", timeout: 10_000 });
    await productSearch.clear();
    await productSearch.fill("Raw material A");
    const productOption = page.locator('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"]');
    await productOption.waitFor({ state: "visible", timeout: 10_000 });
    const formInitDone = page.waitForResponse(/FormInitializationComponent/, { timeout: 60_000 });
    await productSearch.press("ArrowDown");
    await page.keyboard.press("Enter");
    await formInitDone;

    // Invoiced Quantity: 11.2 (React-controlled input — use native setter)
    await page.locator('[data-testid="TextInput__3374"]').waitFor({ state: "visible" });
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="TextInput__3374"]') as HTMLInputElement;
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

    // Save line (last save button = line-level toolbar)
    await page.locator("button.toolbar-button-save").last().click();
    await closeToastIfPresent(page);

    // Verify Net Amount: 22.40
    await expect(page.getByText("22.4").first()).toBeVisible({ timeout: 10_000 });

    // ── Step 5: Complete Purchase Invoice ─────────────────────────────────────
    await page.getByRole("button", { name: "Available Process" }).click();
    const completeItem = page.locator('[data-testid^="ProcessMenuItemBase__"]').filter({ hasText: "Complete" }).first();
    await completeItem.waitFor({ state: "visible", timeout: 10_000 });
    await completeItem.click();

    // Wait for the Process Invoices modal
    await expect(page.locator(".h-\\[625px\\]").first()).toBeVisible({ timeout: 15_000 });

    await clickOkInLegacyPopup(page);

    // Capture Payment Number from the process result paragraph
    const resultPara = page.locator("p.text-gray-700");
    await resultPara.first().waitFor({ state: "visible", timeout: 30_000 });
    const resultText = (await resultPara.first().textContent()) ?? "";
    const paymentMatch = resultText.match(/Payment No\.\s*(\d+)/);
    if (!paymentMatch) throw new Error(`Could not extract payment number from: "${resultText}"`);
    const paymentNumber = paymentMatch[1];

    // Close the result dialog
    await page.locator('[data-testid="close-button"]').click();
    await closeToastIfPresent(page);

    // Refresh and verify
    await page.locator("button.toolbar-button-refresh").filter({ visible: true }).first().click();
    await page.waitForTimeout(1_000);

    // Verify Grand Total: 24.64
    await expect(page.getByText("24.64").first()).toBeVisible({ timeout: 10_000 });

    // Verify Payment Complete: Yes
    await expect(page.locator('span[name="paymentComplete"]')).toHaveText("Yes", { timeout: 20_000 });

    // ── Step 6: Verify Payment Out Plan ──────────────────────────────────────
    await page.locator('button[title="Payment Plan"]').waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('button[title="Payment Plan"]').click();
    await page.waitForTimeout(1_000);
    await page.locator("button.toolbar-button-refresh").filter({ visible: true }).first().click();
    await page.waitForTimeout(1_000);

    // Verify Expected amount: 24.64 (MUI DataGrid virtualizes rows — cell is attached but may be hidden)
    await expect(page.locator(".MuiTableCell-body").filter({ hasText: "24.64" }).first()).toBeAttached({
      timeout: 10_000,
    });

    // ── Step 7: Navigate to Financial Account ─────────────────────────────────
    await navigateToFinancialAccount(page);

    // ── Step 8: Search and select Spain Cashbook ──────────────────────────────
    const filterName = page.locator('input.w-full[placeholder="Filter Name..."]');
    await filterName.waitFor({ state: "visible", timeout: 10_000 });
    await filterName.clear();
    await filterName.fill("Spain Cashbook");
    await filterName.press("Enter");
    await page.waitForTimeout(1_000);

    await page.getByText("Spain Cashbook").first().click();
    await page.waitForTimeout(500);

    // ── Step 9: Navigate to Transactions tab ──────────────────────────────────
    await page.locator('button[aria-label="Transaction"]').waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('button[aria-label="Transaction"]').click();
    await page.waitForTimeout(500);

    // ── Step 10: Add new transaction ─────────────────────────────────────────
    // Second visible New Record button (first = header, second = Transaction subtab)
    const newTxBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).nth(1);
    await newTxBtn.waitFor({ state: "visible", timeout: 20_000 });
    await newTxBtn.click();
    await page.waitForTimeout(500);

    // Transaction Type: BP Withdrawal
    // The dropdown has a search input that intercepts pointer events on options,
    // so we use keyboard navigation (ArrowDown + Enter) instead of clicking the option directly.
    await page.locator('[data-testid="ChevronDown__7019E1AFE07B44309AE2F0C6629C1251"]').click({ force: true });
    const txTypeSearch = page.locator('input[aria-label="Search options"]');
    await txTypeSearch.waitFor({ state: "visible", timeout: 10_000 });
    await txTypeSearch.fill("BP Withdrawal");
    await page.locator('[data-testid="OptionItem__BPW"]').waitFor({ state: "visible", timeout: 10_000 });
    await txTypeSearch.press("ArrowDown");
    await page.keyboard.press("Enter");
    // Wait for the transactionType dropdown portal to close before clicking Payment
    await page
      .locator('[data-dropdown-portal="dropdown-transactionType"]')
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => null);

    // Link with Payment Number from Step 5
    await page.locator('[aria-label="Payment"] > div[tabindex="0"]').click();
    await page.waitForTimeout(500);
    const paymentSearch = page.locator('input[aria-label="Search options"]');
    await paymentSearch.waitFor({ state: "visible", timeout: 10_000 });
    await paymentSearch.clear();
    await paymentSearch.fill(paymentNumber);
    await page.waitForTimeout(1_000);
    const paymentOption = page.locator('[data-testid^="OptionItem__"]').filter({ hasText: paymentNumber });
    await paymentOption.waitFor({ state: "visible", timeout: 10_000 });
    await paymentOption.click({ force: true });
    await page.waitForTimeout(500);

    // Save the transaction
    await page.locator("button.toolbar-button-save").filter({ visible: true }).first().click();
    await closeToastIfPresent(page);
    await page.waitForTimeout(500);

    // ── Step 11: Verify Payment Out status ───────────────────────────────────
    await navigateToPaymentOut(page);

    // Filter by payment number
    const filterDocNo = page.locator('input.w-full[placeholder="Filter Document No...."]');
    await filterDocNo.waitFor({ state: "visible", timeout: 10_000 });
    await filterDocNo.clear();
    await filterDocNo.fill(paymentNumber);
    await filterDocNo.press("Enter");
    await page.waitForTimeout(1_000);

    // Click the payment record
    await page.getByText(paymentNumber).first().waitFor({ state: "visible", timeout: 10_000 });
    await page.getByText(paymentNumber).first().click();
    await page.waitForTimeout(500);

    // Scroll table to reveal status column
    await page
      .locator(".MuiTableContainer-root")
      .first()
      .evaluate((el) => {
        el.scrollLeft = el.scrollWidth;
      });
    await page.waitForTimeout(500);

    // Verify "Payment Made" chip
    await expect(page.locator(".MuiChip-label").filter({ hasText: "Payment Made" }).first()).toBeAttached({
      timeout: 20_000,
    });
  });
});

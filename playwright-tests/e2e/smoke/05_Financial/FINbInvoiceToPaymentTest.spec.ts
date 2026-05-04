import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  navigateToSalesInvoice,
  closeToastIfPresent,
  captureDocumentNumber,
  navigateToPaymentIn,
} from "../../helpers/etendo.helpers";

test.describe("Financial Test 2 - Sales Invoice to Payment In @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Creates Sales Invoice, completes it, creates Payment In and links the invoice", async ({ page }) => {
    test.setTimeout(360_000);
    // ── Login ────────────────────────────────────────────────────────────────
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);

    // ── Step 1: Navigate to Sales Invoice ────────────────────────────────────
    await navigateToSalesInvoice(page);

    // ── Step 2: Create New Sales Invoice ─────────────────────────────────────
    const newBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // Business Partner: Customer A
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
    await bpSearch.fill("Customer A");
    const customerOption = page.locator('[data-testid^="OptionItem__"]').filter({ hasText: /^Customer A$/ });
    await customerOption.waitFor({ state: "visible", timeout: 10_000 });
    await customerOption.click({ force: true });

    // Save header to populate defaults
    await page.locator("button.toolbar-button-save").first().click();
    await page.waitForLoadState("networkidle", { timeout: 15_000 });
    await closeToastIfPresent(page);

    // Verify Draft status
    await expect(page.locator(".MuiChip-label").filter({ hasText: "Draft" }).first()).toBeAttached({ timeout: 60_000 });

    // ── Step 3: Add Invoice Line ──────────────────────────────────────────────
    await page.locator('button[aria-label="Lines"]').click();

    const newLineBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newLineBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newLineBtn.click();

    // Product: Final good A
    const productDropdown = page.locator('[data-testid="ChevronDown__2996"]');
    const productSearch = page.locator('input[aria-label="Search options"]');
    const productOption = page.locator('[data-testid^="OptionItem__"]').filter({ hasText: /Final good A/ });

    await productDropdown.scrollIntoViewIfNeeded();
    let hasProductSearch = false;
    let productDropdownOpened = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      await productDropdown.click({ force: true });
      hasProductSearch = await productSearch.isVisible({ timeout: 2_000 }).catch(() => false);
      productDropdownOpened =
        hasProductSearch || (await productOption.isVisible({ timeout: 2_000 }).catch(() => false));
      if (productDropdownOpened) break;
    }
    if (!productDropdownOpened) throw new Error("Product dropdown did not open");

    if (hasProductSearch) {
      await productSearch.clear();
      await productSearch.fill("Final good");
    }
    await productOption.waitFor({ state: "visible", timeout: 10_000 });
    if (hasProductSearch) {
      // Use keyboard navigation because the search input intercepts pointer events.
      await productSearch.press("ArrowDown");
      await page.keyboard.press("Enter");
    } else {
      await productOption.click({ force: true });
    }
    await page.waitForLoadState("networkidle", { timeout: 30_000 });

    // Invoiced Quantity: 13.13 (React-controlled input — use native setter)
    await page.locator('[data-testid="TextInput__2999"]').waitFor({ state: "visible" });
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="TextInput__2999"]') as HTMLInputElement;
      if (!input) return;
      input.disabled = false;
      input.readOnly = false;
      input.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(input, "13.13");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(500);

    // Save line
    await page.locator("button.toolbar-button-save").last().click();
    await page.waitForLoadState("networkidle", { timeout: 30_000 });
    await closeToastIfPresent(page);

    // Verify Net Amount: 26.26
    await expect(page.locator(".MuiTableCell-body").filter({ hasText: "26.26" }).first()).toBeAttached({
      timeout: 20_000,
    });

    // ── Step 4: Complete Sales Invoice ───────────────────────────────────────
    await page.getByRole("button", { name: "Available Process" }).click();
    const completeItem = page.locator('[data-testid^="ProcessMenuItemBase__"]').filter({ hasText: "Complete" });
    await completeItem.waitFor({ state: "visible", timeout: 10_000 });
    await completeItem.click();

    await expect(page.locator("h2").filter({ hasText: "Process Invoices" })).toBeVisible({ timeout: 15_000 });

    await clickOkInLegacyPopup(page);

    // Handle "Use Credit Payment" sub-dialog: give up to 20s for it to appear inside
    // the legacy iframe (server may take time before showing this sub-dialog).
    await (async () => {
      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        for (const frame of page.frames()) {
          try {
            const btn = frame
              .locator("td.Button_text, button")
              .filter({ hasText: /Do not use Credit/i })
              .first();
            if (await btn.isVisible({ timeout: 0 })) {
              await btn.click();
              return;
            }
          } catch {
            // frame detached or cross-origin — skip
          }
        }
        await page.waitForTimeout(300);
      }
    })();

    // The legacy iframe modal now auto-closes after showing the success message.
    // Accept either the visible success banner or the modal closing by itself.
    const processSuccessMessage = page.locator(".mb-1").filter({ hasText: /Process completed successfully/i }).first();
    const processModalTitle = page.locator("h2").filter({ hasText: "Process Invoices" }).first();
    const processCompleted = await Promise.race([
      processSuccessMessage
        .waitFor({ state: "visible", timeout: 35_000 })
        .then(() => true)
        .catch(() => false),
      processModalTitle
        .waitFor({ state: "hidden", timeout: 35_000 })
        .then(() => true)
        .catch(() => false),
    ]);
    if (!processCompleted) throw new Error("Process did not complete within 35s");

    // Close the Process Invoices modal if it is still open in older UI behavior.
    const closeModal = page.getByRole("button", { name: /^Close$/i });
    if (await closeModal.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await closeModal.click();
    }
    await closeToastIfPresent(page);

    // Refresh and capture invoice number
    await page.locator("button.toolbar-button-refresh").filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    const invoiceNumber = await captureDocumentNumber(page);

    // ── Step 5: Navigate to Payment In ───────────────────────────────────────
    await navigateToPaymentIn(page);

    // ── Step 6: Create new Payment In ────────────────────────────────────────
    const newPayBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newPayBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newPayBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // Received From (Business Partner): Customer A
    await page.locator('[data-testid="ChevronDown__7C541AC0C75CFDD7E040007F01016B4D"]').scrollIntoViewIfNeeded();
    await page.locator('[data-testid="ChevronDown__7C541AC0C75CFDD7E040007F01016B4D"]').click({ force: true });
    const bpSearch2 = page.locator('input[aria-label="Search options"]');
    await bpSearch2.waitFor({ state: "visible", timeout: 10_000 });
    await bpSearch2.clear();
    await bpSearch2.fill("Customer A");
    const customerOption2 = page.locator('[data-testid^="OptionItem__"]').filter({ hasText: /^Customer A$/ });
    await customerOption2.waitFor({ state: "visible", timeout: 10_000 });
    await customerOption2.click({ force: true });

    // Save to populate defaults
    await page.locator("button.toolbar-button-save").filter({ visible: true }).first().click();
    await closeToastIfPresent(page);

    // Amount: 28.92 (React-controlled input — use native setter)
    const amountInput = page.locator('[data-testid="TextInput__329fab"]');
    const visibleSaveButton = page.locator("button.toolbar-button-save").filter({ visible: true }).first();
    const setAmountValue = async (value: string) => {
      await page.evaluate((nextValue) => {
        const input = document.querySelector('[data-testid="TextInput__329fab"]') as HTMLInputElement;
        if (!input) return;
        input.disabled = false;
        input.readOnly = false;
        input.focus();
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeSetter?.call(input, nextValue);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }, value);
    };

    await amountInput.scrollIntoViewIfNeeded();
    await setAmountValue("28.92");
    await expect(amountInput).toHaveValue("28.92", { timeout: 5_000 });

    const saveEnabledAfterAmount = await visibleSaveButton.isEnabled({ timeout: 2_000 }).catch(() => false);
    if (!saveEnabledAfterAmount) {
      await setAmountValue("28.9");
      await page.waitForTimeout(100);
      await setAmountValue("28.92");
      await expect(amountInput).toHaveValue("28.92", { timeout: 5_000 });
    }

    await expect(visibleSaveButton).toBeEnabled({ timeout: 10_000 });

    // Save Payment In
    await visibleSaveButton.click();
    await closeToastIfPresent(page);

    // Verify Status: Awaiting Payment
    await expect(page.locator('span[name="status"]')).toHaveText("Awaiting Payment", { timeout: 10_000 });

    // ── Step 7: Open Add Details process ─────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="ProcessMenuItemBase__541926"]').click();

    // Wait for table to load — MUI DataGrid virtualizes rows so they are attached but may be hidden
    await page
      .locator("tbody.MuiTableBody-root tr.MuiTableRow-root")
      .first()
      .waitFor({ state: "attached", timeout: 30_000 });

    // Build full invoice reference and filter
    const fullInvoiceNo = `I/${invoiceNumber}`;

    const filterInput = page.locator('input[placeholder="Filter Invoice No...."]');
    await filterInput.waitFor({ state: "visible", timeout: 15_000 });
    await filterInput.scrollIntoViewIfNeeded();
    const filterResponse = page.waitForResponse(/api\/datasource/, { timeout: 30_000 });
    await filterInput.click({ force: true });
    await filterInput.clear();
    await filterInput.fill(fullInvoiceNo);
    await filterResponse;

    await page.waitForTimeout(3_000);

    // Select the matching row
    const targetRow = page.locator("tbody.MuiTableBody-root tr.MuiTableRow-root").filter({ hasText: fullInvoiceNo });
    await targetRow.waitFor({ state: "visible", timeout: 30_000 });
    await targetRow.locator('input[aria-label="Toggle select row"]').scrollIntoViewIfNeeded();
    await targetRow.locator('input[aria-label="Toggle select row"]').click({ force: true });

    // Verify row is selected
    await expect(targetRow.locator('input[aria-label="Toggle select row"]')).toBeChecked({ timeout: 15_000 });

    // Verify Expected Payment is populated
    await expect(page.locator('input[name="Expected Payment"]')).not.toHaveValue("0.00", { timeout: 30_000 });

    // ── Step 8: Select action and execute payment ─────────────────────────────
    const actionDropdown = page.locator('div[aria-label="Action Regarding Document"]').locator('div[tabindex="0"]');
    await actionDropdown.scrollIntoViewIfNeeded();
    const loadActionDefaults = page.waitForResponse(/api\/datasource/, { timeout: 30_000 });
    await actionDropdown.click();
    await loadActionDefaults;

    await page
      .locator('div[data-dropdown-portal] li[data-testid^="OptionItem__"]')
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    await page
      .locator('li[data-testid^="OptionItem__"] span')
      .filter({ hasText: /^Process Received Payment\(s\)$/ })
      .click();

    // Set up API response watcher BEFORE clicking Execute
    const executePaymentResponse = page.waitForResponse(/AddPaymentActionHandler/, { timeout: 60_000 });

    await page.locator('[data-testid="ExecuteButton__761503"]').waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[data-testid="ExecuteButton__761503"]').click();

    // Wait for the API response — the success toast may auto-dismiss before we can catch it
    await executePaymentResponse;
    await closeToastIfPresent(page);

    // After successful payment execution the ProcessDefinitionModal auto-closes
    // (isFinalSuccess=true removes it from the DOM). Only press Escape if the modal
    // is still open — pressing Escape on an already-closed modal would close the form.
    await page.waitForTimeout(1_000);
    if (
      await page
        .locator('[data-testid="Modal__761503"]')
        .isVisible({ timeout: 500 })
        .catch(() => false)
    ) {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }

    // ── Step 9: Verify final payment state ───────────────────────────────────
    await page.locator("button.toolbar-button-refresh").first().click();

    await expect(page.locator('[data-testid="status-bar-container"] span[name="status"]')).toHaveText(
      "Payment Received",
      { timeout: 20_000 }
    );

    await expect(page.locator('[data-testid="status-bar-container"] span[name="generatedCredit"]')).toHaveText("1.74", {
      timeout: 10_000,
    });
  });
});

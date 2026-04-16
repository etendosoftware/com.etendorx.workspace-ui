import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  navigateToPurchaseInvoice,
  navigateToPaymentProposal,
  closeToastIfPresent,
  captureDocumentNumber,
} from "../../helpers/etendo.helpers";

test.describe("Financial - Payment Proposal - Select Expected Payments @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Creates two Purchase Invoices, completes them, selects both in one go and generates payment", async ({
    page,
  }) => {
    // This test creates 2 invoices + a Payment Proposal — allow extra time
    test.setTimeout(360_000);

    // ── Login ────────────────────────────────────────────────────────────────
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);

    // ════════════════════════════════════════════════════════════════════════
    // Invoice A — Vendor A, Raw material A, qty 11.2
    // ════════════════════════════════════════════════════════════════════════
    await navigateToPurchaseInvoice(page);

    // New Record
    let newBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
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
    let bpSearch = page.locator('input[aria-label="Search options"]');
    await bpSearch.waitFor({ state: "visible", timeout: 10_000 });
    await bpSearch.clear();
    await bpSearch.fill("Vendor A");
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: /^Vendor A$/ })
      .waitFor({ state: "visible", timeout: 10_000 });
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: /^Vendor A$/ })
      .click({ force: true });

    // Save header
    await page.locator("button.toolbar-button-save").filter({ visible: true }).first().click();
    await closeToastIfPresent(page);

    // Lines tab → New Record
    await page.locator('button[aria-label="Lines"]').click();
    let newLineBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newLineBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newLineBtn.click();

    // Product: Raw material A — scrollIntoViewIfNeeded performs stability + scroll checks
    await page.locator('[data-testid="ChevronDown__3371"]').first().scrollIntoViewIfNeeded();
    await page.locator('[data-testid="ChevronDown__3371"]').first().click();
    let productSearch = page.locator('input[aria-label="Search options"]');
    await productSearch.waitFor({ state: "visible", timeout: 10_000 });
    await productSearch.clear();
    await productSearch.fill("Raw material A");
    await page
      .locator('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    await productSearch.press("ArrowDown");
    await page.keyboard.press("Enter");

    // Quantity: 11.2 (React-controlled input — native setter)
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

    // Save line
    await page.locator("button.toolbar-button-save").last().click();
    await closeToastIfPresent(page);

    // Complete Invoice A
    await page.getByRole("button", { name: "Available Process" }).click();
    let completeItem = page
      .locator('[data-testid^="ProcessMenuItemBase__"]')
      .filter({ hasText: /^Complete$/ })
      .first();
    await completeItem.waitFor({ state: "visible", timeout: 15_000 });
    await completeItem.click();
    await expect(page.locator(".h-\\[625px\\]").first()).toBeVisible({ timeout: 15_000 });
    await clickOkInLegacyPopup(page);
    await page.locator('[data-testid="close-button"]').waitFor({ state: "visible", timeout: 30_000 });
    await page.locator('[data-testid="close-button"]').click();
    await closeToastIfPresent(page);

    // Refresh and verify Completed
    await page.locator("button.toolbar-button-refresh").filter({ visible: true }).first().click();
    await page.waitForTimeout(1_000);
    await expect(page.locator(".MuiChip-label").filter({ hasText: "Completed" }).first()).toBeAttached({
      timeout: 20_000,
    });

    // Capture Invoice A document number
    const invoiceNumberA = await captureDocumentNumber(page);

    // ════════════════════════════════════════════════════════════════════════
    // Invoice B — Vendor B, Raw material B, qty 10
    // ════════════════════════════════════════════════════════════════════════

    // Navigate back to Purchase Invoice to get a clean list view
    await navigateToPurchaseInvoice(page);

    // New Record
    newBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // Business Partner: Vendor B
    await page
      .locator('[aria-describedby="Business Partner-help"]')
      .locator('div[tabindex="0"]')
      .scrollIntoViewIfNeeded();
    await page
      .locator('[aria-describedby="Business Partner-help"]')
      .locator('div[tabindex="0"]')
      .click({ force: true });
    bpSearch = page.locator('input[aria-label="Search options"]');
    await bpSearch.waitFor({ state: "visible", timeout: 15_000 });
    await bpSearch.clear();
    await bpSearch.fill("Vendor B");
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: /^Vendor B$/ })
      .waitFor({ state: "visible", timeout: 10_000 });
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: /^Vendor B$/ })
      .click({ force: true });

    // Payment Method for Vendor B
    await page.locator('[data-testid="ChevronDown__830698140BCD4AC3E040007F01000289"]').click({ force: true });
    await page.waitForTimeout(500);
    await page.locator('[data-testid="OptionItem__42E87E97974E4B35849A430B8F6F2884"]').scrollIntoViewIfNeeded();
    await page.locator('[data-testid="OptionItem__42E87E97974E4B35849A430B8F6F2884"]').click({ force: true });
    await page.waitForTimeout(500);

    // Save header
    await page.locator("button.toolbar-button-save").filter({ visible: true }).first().click();
    await closeToastIfPresent(page);

    // Lines tab → New Record
    await page.locator('button[aria-label="Lines"]').click();
    newLineBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newLineBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newLineBtn.click();

    // Product: Raw material B — scrollIntoViewIfNeeded performs stability + scroll checks
    await page.locator('[data-testid="ChevronDown__3371"]').first().scrollIntoViewIfNeeded();
    await page.locator('[data-testid="ChevronDown__3371"]').first().click();
    productSearch = page.locator('input[aria-label="Search options"]');
    await productSearch.waitFor({ state: "visible", timeout: 10_000 });
    await productSearch.clear();
    await productSearch.fill("Raw material B");
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: /Raw material B/ })
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    await productSearch.press("ArrowDown");
    await page.keyboard.press("Enter");

    // Quantity: 10
    await page.locator('[data-testid="TextInput__3374"]').waitFor({ state: "visible" });
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="TextInput__3374"]') as HTMLInputElement;
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

    // Complete Invoice B
    await page.getByRole("button", { name: "Available Process" }).click();
    completeItem = page
      .locator('[data-testid^="ProcessMenuItemBase__"]')
      .filter({ hasText: /^Complete$/ })
      .first();
    await completeItem.waitFor({ state: "visible", timeout: 15_000 });
    await completeItem.click();
    await expect(page.locator(".h-\\[625px\\]").first()).toBeVisible({ timeout: 15_000 });
    await clickOkInLegacyPopup(page);
    await page.locator('[data-testid="close-button"]').waitFor({ state: "visible", timeout: 30_000 });
    await page.locator('[data-testid="close-button"]').click();
    await closeToastIfPresent(page);

    // Refresh and verify Completed
    await page.locator("button.toolbar-button-refresh").filter({ visible: true }).first().click();
    await page.waitForTimeout(1_000);
    await expect(page.locator(".MuiChip-label").filter({ hasText: "Completed" }).first()).toBeAttached({
      timeout: 20_000,
    });

    // Capture Invoice B document number
    const invoiceNumberB = await captureDocumentNumber(page);

    // ════════════════════════════════════════════════════════════════════════
    // Payment Proposal — select both invoices and generate payment
    // ════════════════════════════════════════════════════════════════════════
    await navigateToPaymentProposal(page);

    // New Record
    const newPPBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newPPBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newPPBtn.click();

    // Due date: today + 120 days (MM/DD/YYYY)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 120);
    const mm = String(futureDate.getMonth() + 1).padStart(2, "0");
    const dd = String(futureDate.getDate()).padStart(2, "0");
    const yyyy = futureDate.getFullYear();
    const dueDateStr = `${mm}/${dd}/${yyyy}`;

    const dueDateInput = page.locator("input#duedate");
    await dueDateInput.waitFor({ state: "visible", timeout: 10_000 });
    await dueDateInput.clear();
    await dueDateInput.fill(dueDateStr);
    await page.waitForTimeout(500);

    // Save
    await page.locator("button.toolbar-button-save").filter({ visible: true }).first().click();
    await closeToastIfPresent(page);
    await page.waitForTimeout(500);

    // Available Process → Select Expected Payments
    await page.getByRole("button", { name: "Available Process" }).click();
    const datasourceResponse = page.waitForResponse(/api\/datasource/, { timeout: 30_000 });
    const selectItem = page
      .locator('[data-testid^="ProcessMenuItemBase__"]')
      .filter({ hasText: "Select Expected Payments" });
    await selectItem.waitFor({ state: "visible", timeout: 10_000 });
    await selectItem.click();
    await datasourceResponse;

    // Wait for table rows to load — retry once if "errors.missingData" appears
    await page
      .locator("tbody.MuiTableBody-root tr.MuiTableRow-root")
      .first()
      .waitFor({ state: "attached", timeout: 30_000 });
    if (
      await page
        .getByText("errors.missingData")
        .isVisible({ timeout: 1_000 })
        .catch(() => false)
    ) {
      const retryBtn = page.getByRole("button", { name: "Retry" });
      if (await retryBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        const retryResponse = page.waitForResponse(/api\/datasource/, { timeout: 30_000 });
        await retryBtn.click();
        await retryResponse;
      }
      await page.waitForTimeout(3_000);
    }

    // Sort by Due Date descending (2 clicks) to bring new invoices to the top
    const dueDateSort = page.locator(
      "th:has(.Mui-TableHeadCell-Content-Wrapper:has-text('Due Date')) .MuiTableSortLabel-root"
    );
    await dueDateSort.waitFor({ state: "visible", timeout: 10_000 });
    await dueDateSort.click();
    await page.waitForTimeout(1_500);
    await dueDateSort.click();
    await page.waitForTimeout(2_000);

    // Filter by Invoice Document No. to reliably locate the row regardless of pagination
    const invoiceDocFilter = page.locator('input[placeholder="Filter Invoice Document No...."]');
    await invoiceDocFilter.waitFor({ state: "visible", timeout: 10_000 });
    await invoiceDocFilter.clear();
    await invoiceDocFilter.fill(invoiceNumberA);
    await page.waitForTimeout(1_500);

    // Select Invoice A row (use .first() in case the invoice has multiple payment plan lines)
    const rowA = page
      .locator("tbody.MuiTableBody-root tr.MuiTableRow-root")
      .filter({ hasText: invoiceNumberA })
      .first();
    await rowA.waitFor({ state: "visible", timeout: 15_000 });
    await rowA.locator('input[aria-label="Toggle select row"]').scrollIntoViewIfNeeded();
    await rowA.locator('input[aria-label="Toggle select row"]').click({ force: true });
    await expect(rowA.locator('input[aria-label="Toggle select row"]')).toBeChecked({ timeout: 10_000 });

    // Filter by Invoice B to locate it reliably
    await invoiceDocFilter.clear();
    await invoiceDocFilter.fill(invoiceNumberB);
    await page.waitForTimeout(1_500);

    // Select Invoice B row (use .first() in case the invoice has multiple payment plan lines)
    const rowB = page
      .locator("tbody.MuiTableBody-root tr.MuiTableRow-root")
      .filter({ hasText: invoiceNumberB })
      .first();
    await rowB.waitFor({ state: "visible", timeout: 15_000 });
    await rowB.locator('input[aria-label="Toggle select row"]').scrollIntoViewIfNeeded();
    await rowB.locator('input[aria-label="Toggle select row"]').click({ force: true });
    await expect(rowB.locator('input[aria-label="Toggle select row"]')).toBeChecked({ timeout: 10_000 });

    // Submit — set up toast watcher BEFORE clicking
    const successToastAppeared = page.waitForSelector('[data-sonner-toast][data-type="success"]', {
      state: "visible",
      timeout: 60_000,
    });
    const submitBtn = page.locator("button").filter({ hasText: /^Execute$/ });
    await submitBtn.waitFor({ state: "visible", timeout: 10_000 });
    await submitBtn.click();
    await successToastAppeared;
    await closeToastIfPresent(page);

    // ── Generate Payments ─────────────────────────────────────────────────
    await page.getByRole("button", { name: "Available Process" }).click();
    const generateItem = page
      .locator('[data-testid^="ProcessMenuItemBase__"]')
      .filter({ hasText: "Generate Payments" });
    await generateItem.waitFor({ state: "visible", timeout: 10_000 });
    await generateItem.click();

    // "Process Payment Proposal" dialog — the inner content is a legacy iframe.
    // Poll all frames for the "Process" button (same pattern as clickOkInLegacyPopup).
    await (async () => {
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        for (const frame of page.frames()) {
          try {
            const btn = frame
              .locator("td.Button_text, button, input[type='button']")
              .filter({ hasText: /^Process$/ })
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
      throw new Error("Generate Payments: Process button not found in any frame");
    })();
    await closeToastIfPresent(page);

    // Close the result dialog
    const closeDialogBtn = page.locator('[data-testid="close-button"]').first();
    await closeDialogBtn.waitFor({ state: "visible", timeout: 30_000 });
    await closeDialogBtn.click();
    await page.waitForTimeout(500);

    // ── Verify Lines tab: 2 lines (Vendor A and Vendor B) ────────────────
    await page.locator('button[aria-label="Lines"]').waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('button[aria-label="Lines"]').click();

    // Wait for at least 2 rows (MUI DataGrid may virtualize — use attached)
    await page
      .locator("tbody.MuiTableBody-root tr.MuiTableRow-root")
      .first()
      .waitFor({ state: "attached", timeout: 30_000 });
    await page
      .locator("tbody.MuiTableBody-root tr.MuiTableRow-root")
      .nth(1)
      .waitFor({ state: "attached", timeout: 10_000 });

    await expect(page.locator('td[title="Vendor A"] button')).toBeAttached({ timeout: 10_000 });
    await expect(page.locator('td[title="Vendor B"] button')).toBeAttached({ timeout: 10_000 });
  });
});

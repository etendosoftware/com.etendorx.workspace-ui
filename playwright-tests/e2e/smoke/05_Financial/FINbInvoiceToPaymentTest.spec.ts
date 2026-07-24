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
    const openedIndicator = productSearch.or(productOption).first();
    let hasProductSearch = false;
    let productDropdownOpened = false;
    for (let attempt = 0; attempt < 4; attempt++) {
      // Don't re-click if it's already open — a second click toggles the dropdown closed.
      if (await openedIndicator.isVisible().catch(() => false)) {
        productDropdownOpened = true;
        break;
      }
      await productDropdown.click({ force: true });
      try {
        await openedIndicator.waitFor({ state: "visible", timeout: 4_000 });
        productDropdownOpened = true;
        break;
      } catch {
        /* not open yet — retry */
      }
    }
    hasProductSearch = await productSearch.isVisible().catch(() => false);
    if (!productDropdownOpened) throw new Error("Product dropdown did not open");

    if (hasProductSearch) {
      await productSearch.clear();
      await productSearch.fill("Final good A");
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
    const processSuccessMessage = page
      .locator(".mb-1")
      .filter({ hasText: /Process completed successfully/i })
      .first();
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

    // Read the invoice outstanding amount while we're still on the invoice form.
    // This is the grand total (net + taxes) we need to fully cover with the payment.
    const outstandingInput = page.locator('input[name="outstandingAmount"]').first();
    await outstandingInput.waitFor({ state: "attached", timeout: 10_000 });
    // Wait until the field holds the real grand total, not the transient "0" it shows
    // between the completion refresh and the record reloading. Reading it too early
    // (only guaranteed under CI load) yields invoiceTotal=0 → paymentAmount=1.74, which
    // then cascades into a wrong Add Details allocation and a stuck payment execution.
    // Capture the value INSIDE the poll and require it stable across two consecutive
    // reads: a separate inputValue() after the poll is a TOCTOU — the poll passes on a
    // ">0" sample while the field flickers back to 0, and the follow-up read grabs the 0.
    let invoiceTotal = 0;
    let prevRead = -1;
    await expect
      .poll(
        async () => {
          const v = Number.parseFloat((await outstandingInput.inputValue().catch(() => "0")).replace(",", ".")) || 0;
          const settled = v > 0 && v === prevRead;
          prevRead = v;
          if (settled) invoiceTotal = v;
          return settled ? v : 0;
        },
        {
          timeout: 15_000,
        }
      )
      .toBeGreaterThan(0);

    // Payment is intentionally set to invoiceTotal + 1.74 to generate a credit of 1.74.
    // This tests Etendo's overpayment/credit tracking feature.
    const paymentAmount = Math.round((invoiceTotal + 1.74) * 100) / 100;
    const paymentAmountStr = String(paymentAmount);

    // ── Step 5: Navigate to Payment In ───────────────────────────────────────
    await navigateToPaymentIn(page);

    // ── Step 6: Create new Payment In ────────────────────────────────────────
    const newPayBtn = page
      .locator("button.toolbar-button-new")
      .filter({ hasText: "New Record" })
      .filter({ visible: true })
      .first();
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

    // Amount: invoiceTotal + 1.74 (React-controlled input — use native setter)
    const amountInput = page.locator('input[name="amount"][aria-label="Amount"]').first();
    const visibleSaveButton = page.locator("button.toolbar-button-save").filter({ visible: true }).first();
    const setAmountValue = async (value: string) => {
      await page.evaluate((nextValue) => {
        const input = document.querySelector('input[name="amount"][aria-label="Amount"]') as HTMLInputElement;
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
    await setAmountValue(paymentAmountStr);
    await expect(amountInput).toHaveValue(paymentAmountStr, { timeout: 5_000 });

    const saveEnabledAfterAmount = await visibleSaveButton.isEnabled({ timeout: 2_000 }).catch(() => false);
    if (!saveEnabledAfterAmount) {
      // Nudge React's onChange by writing a slightly different value first, then the real one.
      await setAmountValue(String(Math.round((paymentAmount - 0.01) * 100) / 100));
      await page.waitForTimeout(100);
      await setAmountValue(paymentAmountStr);
      await expect(amountInput).toHaveValue(paymentAmountStr, { timeout: 5_000 });
    }

    await expect(visibleSaveButton).toBeEnabled({ timeout: 10_000 });

    // Save Payment In
    await visibleSaveButton.click();
    await page.waitForLoadState("networkidle", { timeout: 15_000 });
    await closeToastIfPresent(page);

    // Verify Status: Awaiting Payment — wait for the form to exit edit mode and the
    // server response to populate the status bar (Tag or span depending on refList).
    await expect(
      page.locator('[data-testid="status-bar-container"]:visible').getByText("Awaiting Payment")
    ).toBeVisible({ timeout: 20_000 });

    // ── Step 7: Open Add Details process ─────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"]:visible').click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="ProcessMenuItemBase__541926"]').click();

    // Wait for table to load — MUI DataGrid virtualizes rows so they are attached but may be hidden.
    // Scope to cursor-pointer rows so we wait on the Add Details grid, not the other open window's table.
    await page
      .locator("tbody.MuiTableBody-root tr.MuiTableRow-root.cursor-pointer")
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

    // Select the matching row.
    // WindowReferenceGrid rows always have cursor-pointer class (selected and unselected).
    // The other open window's table rows do NOT — this is how we scope to the right table.
    const targetRow = page
      .locator("tbody.MuiTableBody-root tr.MuiTableRow-root.cursor-pointer")
      .filter({ hasText: fullInvoiceNo })
      .first();
    await targetRow.waitFor({ state: "attached", timeout: 30_000 });
    const rowCheckbox = targetRow.locator('input[aria-label="Toggle select row"]');
    await rowCheckbox.scrollIntoViewIfNeeded();
    // Explicitly select the row. The invoice is NOT auto-selected here: for a
    // manually-created Payment In the backend does not pre-flag it (obSelected=false),
    // and the grid's context auto-select resolves the payment's document number rather
    // than the invoice's, so findMatchingRecord never matches. Click to select, guarding
    // against toggling off in case auto-select ever does fire.
    if (!(await rowCheckbox.isChecked().catch(() => false))) {
      await rowCheckbox.click({ force: true });
    }

    // Verify row is selected (row stays cursor-pointer after selection, so the locator still resolves).
    await expect(rowCheckbox).toBeChecked({ timeout: 30_000 });

    // The invoice's allocated payment ("Total") must reach the full invoice amount
    // before executing. Under CI load the initial distribute (WindowReferenceGrid)
    // races with the selection-sync and can leave the selected row holding only the
    // overpayment remainder, so the footer settles on a partial (e.g. 1.74 for a 27.18
    // invoice); executing that produces a payment whose AddPaymentActionHandler never
    // completes. The per-row "Expected Payment" field is NOT a valid signal — it always
    // equals the outstanding regardless of allocation. A clean deselect→reselect zeroes
    // the row amount and re-runs the distribution against the settled single selection,
    // converging on the full amount without the load-time race.
    const allocatedTotal = page.locator('input[aria-label="Amount on Invoices and/or Orders"]').first();
    const readAllocated = async () =>
      Number.parseFloat((await allocatedTotal.inputValue().catch(() => "0")).replace(",", ".")) || 0;
    const isFullyAllocated = async () => Math.abs((await readAllocated()) - invoiceTotal) < 0.005;

    for (let attempt = 0; attempt < 4 && !(await isFullyAllocated()); attempt++) {
      await rowCheckbox.click({ force: true }); // deselect → zeroes the row amount
      await expect(rowCheckbox).not.toBeChecked({ timeout: 10_000 });
      await page.waitForTimeout(500);
      await rowCheckbox.click({ force: true }); // reselect → re-distributes the full payment
      await expect(rowCheckbox).toBeChecked({ timeout: 10_000 });
      await page.waitForTimeout(800);
    }

    await expect.poll(readAllocated, { timeout: 15_000 }).toBeGreaterThanOrEqual(invoiceTotal - 0.005);

    // ── Step 8: Select action and execute payment ─────────────────────────────
    const actionDropdown = page
      .locator('div[aria-label="Action Regarding Document"]:visible')
      .locator('div[tabindex="0"]');
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

    await page
      .locator('[data-testid^="ExecuteButton"][data-testid$="__761503"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[data-testid^="ExecuteButton"][data-testid$="__761503"]').click();

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
    const refreshBtn = page.locator("button.toolbar-button-refresh").filter({ visible: true }).first();
    await refreshBtn.waitFor({ state: "visible", timeout: 30_000 });
    await refreshBtn.click({ timeout: 10_000 });

    await expect(
      page.locator('[data-testid="status-bar-container"]:visible').getByText("Payment Received")
    ).toBeVisible({ timeout: 20_000 });

    await expect(page.locator('[data-testid="status-bar-container"]:visible span[name="generatedCredit"]')).toHaveText(
      "1.74",
      {
        timeout: 10_000,
      }
    );
  });
});

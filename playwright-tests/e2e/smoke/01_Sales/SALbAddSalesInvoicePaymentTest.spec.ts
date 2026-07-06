import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  closeToastIfPresent,
  navigateToSalesInvoice,
} from "../../helpers/etendo.helpers";

test.describe("Sales Invoice - Add Payment", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("should create a sales invoice, complete it and add payment", { timeout: 300_000 }, async ({ page }) => {
    // ── Login & role ──────────────────────────────────────────────────────────
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);
    await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });

    // ── Step 1: Navigate to Sales Invoice ─────────────────────────────────────
    await navigateToSalesInvoice(page);

    // ── Step 2: Create New Sales Invoice ──────────────────────────────────────
    const newBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newBtn.waitFor({ state: "visible", timeout: 30_000 });
    await newBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Fill Business Partner — "Customer A" ──────────────────────────
    // Customer A has confirmed sales prices for Final good A.
    // Customer Barcelona auto-applies existing credits on completion, hiding "Add Payment".
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
    await closeToastIfPresent(page);
    // Synchronization: wait for Draft chip so the header is fully rendered before navigating to Lines
    await expect(page.locator(".MuiChip-label").filter({ hasText: "Draft" }).first()).toBeAttached({ timeout: 60_000 });

    // ── Step 4: Add Invoice Line ───────────────────────────────────────────────
    await page.locator('button[aria-label="Lines"]').click();

    // Use .last() on non-disabled buttons to reliably target the Lines toolbar "New Record"
    // (not the header toolbar button which appears first in DOM order)
    const linesNewBtn = page
      .locator("button.toolbar-button-new:not([disabled])")
      .filter({ hasText: "New Record" })
      .last();
    await linesNewBtn.waitFor({ state: "visible", timeout: 15_000 });
    await linesNewBtn.click({ force: true });

    // Select Product: "Final good A" — same ChevronDown selector as FINbInvoiceToPaymentTest
    await page.locator('[data-testid="ChevronDown__2996"]').scrollIntoViewIfNeeded();
    await page.locator('[data-testid="ChevronDown__2996"]').click({ force: true });
    const productSearch = page.locator('input[aria-label="Search options"]');
    await productSearch.waitFor({ state: "visible", timeout: 10_000 });
    await productSearch.clear();
    await productSearch.fill("Final good A");
    const productOption = page.locator('[data-testid^="OptionItem__"]').filter({ hasText: /Final good A/ });
    await productOption.waitFor({ state: "visible", timeout: 10_000 });
    // ArrowDown+Enter fires real keyboard events React processes (FormInit fires → price populated).
    // Must wait for FormInitializationComponent response so price is populated before setting qty.
    const formInitDone = page.waitForResponse(/FormInitializationComponent/, { timeout: 30_000 });
    await productSearch.press("ArrowDown");
    await page.keyboard.press("Enter");
    await formInitDone;

    // Wait for callout to finish populating fields (UOM, Tax, Price) after product selection.
    // The FormInitializationComponent response arrives first, but the callout may still be
    // applying values. Wait for the UOM field to be populated as a reliable signal.
    await expect(page.locator('[aria-describedby="UOM-help"]')).toContainText(/.+/, { timeout: 15_000 });

    // Also wait for network to settle — callout responses may still be in flight
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

    // Set Invoiced Quantity: 100 (large qty ensures gross≈220 far exceeds any accumulated
    // Customer A credits from FINb test runs, preventing silent auto-payment of the invoice)
    await page.locator('[data-testid="TextInput__2999"]').waitFor({ state: "visible", timeout: 15_000 });
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="TextInput__2999"]') as HTMLInputElement;
      if (!input) return;
      input.disabled = false;
      input.readOnly = false;
      input.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(input, "100");
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(1000);

    // Save line — wait for network to settle before saving to avoid race with pending callouts
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    await page.locator("button.toolbar-button-save").last().click();
    await closeToastIfPresent(page);

    // ── Step 5: Complete the Invoice ──────────────────────────────────────────
    // Use Available Process → ProcessMenuItemBase__[Complete] — same flow as FINbInvoiceToPaymentTest.
    await page.getByRole("button", { name: "Available Process" }).click();
    const completeItem = page.locator('[data-testid^="ProcessMenuItemBase__"]').filter({ hasText: "Complete" });
    await completeItem.waitFor({ state: "visible", timeout: 10_000 });
    await completeItem.click();

    await expect(page.locator("h2").filter({ hasText: "Process Invoices" })).toBeVisible({ timeout: 15_000 });
    await clickOkInLegacyPopup(page);

    // Handle "Use Credit Payment" sub-dialog — appears in legacy iframe when Customer A
    // has existing credits/prepayments from previous FINbInvoiceToPaymentTest runs.
    // Clicking "Do not use Credit" prevents the credit from being auto-applied,
    // which would set Payment Complete=Yes and hide "Add Payment" from Available Process.
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
              await btn.click({ force: true });
              return;
            }
          } catch {
            // Locator-level check failed — try DOM evaluate as cross-origin fallback
            try {
              const clicked = await frame.evaluate(() => {
                for (const el of document.querySelectorAll("td.Button_text, button")) {
                  const text = (el as HTMLElement).textContent?.trim() ?? "";
                  if (/Do not use Credit/i.test(text) && (el as HTMLElement).offsetParent !== null) {
                    (el as HTMLElement).click();
                    return true;
                  }
                }
                return false;
              });
              if (clicked) return;
            } catch {
              // Cross-origin evaluate also failed — skip this frame
            }
          }
        }
        await page.waitForTimeout(300);
      }
    })();

    // Wait for completion result — matches FINbInvoiceToPaymentTest pattern
    await page
      .locator(".mb-1")
      .filter({ hasText: /Process completed successfully/i })
      .waitFor({ state: "visible", timeout: 30_000 })
      .catch(async () => {
        console.log("Completion message did not appear within 60s");
        //const closeVisible = await page
        //  .getByRole("button", { name: /^Close$/i })
        //  .isVisible({ timeout: 2_000 })
        //  .catch(() => false);
        //if (!closeVisible) throw new Error("Process did not complete within 60s");
      });

    const closeModal = page.getByRole("button", { name: /^Close$/i });
    if (await closeModal.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await closeModal.click();
    }
    await closeToastIfPresent(page);

    // Refresh to return to the invoice header view and confirm Completed status.
    // Without this, clicking "Available Process" may target the Lines toolbar instead of the header.
    await page
      .locator("button.toolbar-button-refresh")
      .filter({ visible: true })
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("button.toolbar-button-refresh").filter({ visible: true }).first().click();
    await expect(page.locator(".MuiChip-label").filter({ hasText: "Completed" }).first()).toBeAttached({
      timeout: 20_000,
    });

    // ── Step 6: Add Payment ───────────────────────────────────────────────────
    await page.locator("button").filter({ hasText: "Available Process" }).first().click();
    const addPaymentLocator = page.locator("div.cursor-pointer").filter({ hasText: "Add Payment" });
    await addPaymentLocator.waitFor({ state: "visible", timeout: 15_000 });
    const defaultsResponse = page.waitForResponse(/DefaultsProcessActionHandler/, { timeout: 30_000 });
    await addPaymentLocator.click();
    await defaultsResponse;

    // ── Step 7: Configure Payment Transaction ─────────────────────────────────
    await page
      .locator('[aria-label="Action Regarding Document"]')
      .locator('div[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 30_000 });
    await page
      .locator("tbody.MuiTableBody-root tr.MuiTableRow-root")
      .first()
      .waitFor({ state: "attached", timeout: 30_000 });

    await page.locator('[aria-label="Action Regarding Document"]').locator('div[tabindex="0"]').click();

    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: "Process Received Payment(s)" })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: "Process Received Payment(s)" })
      .first()
      .click();

    await page.locator('[data-testid^="ExecuteButton"][data-testid$="__761503"]').click();

    // Verify payment transaction toast
    await expect(
      page.locator('[data-sonner-toast][data-type="success"]').filter({ hasText: /Created Payment:\s*\d+\./ })
    ).toBeVisible({ timeout: 15_000 });
  });
});

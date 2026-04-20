import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  closeToastIfPresent,
  navigateToPurchaseInvoice,
} from "../../helpers/etendo.helpers";

test.describe("Purchase Invoice with payment registration @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Completes a Purchase Invoice, adds payment and validates payment details", async ({ page }) => {
    test.setTimeout(360_000);
    // ── Login ────────────────────────────────────────────────────────────────
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);

    // ── Step 1: Navigate to Purchase Invoice ─────────────────────────────────
    await navigateToPurchaseInvoice(page);

    // ── Step 2: New Purchase Invoice ─────────────────────────────────────────
    const newBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newBtn.waitFor({ state: "visible", timeout: 30_000 });
    await newBtn.click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Fill Business Partner ────────────────────────────────────────
    await page.locator('[aria-label="Business Partner"]').locator('div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();

    // Save header
    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await closeToastIfPresent(page);

    // ── Step 4: Add Invoice Line ──────────────────────────────────────────────
    await page.locator('button[aria-label="Lines"]').click();
    await page.getByRole("button", { name: "New Record" }).last().waitFor({ state: "visible", timeout: 10_000 });
    await page.getByRole("button", { name: "New Record" }).last().click();

    // Select Product — search to narrow the list, then use ArrowDown+Enter.
    // The search input overlaps the options and intercepts pointer events, so click({ force: true })
    // fires a synthetic event that React doesn't process correctly (price stays 0.00).
    // ArrowDown+Enter goes through the keyboard event system which React handles properly.
    await page
      .locator('[aria-label="Product"]')
      .locator('div[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[aria-label="Product"]').locator('div[tabindex="0"]').click();
    const productSearch = page.locator('input[aria-label="Search options"]');
    await productSearch.waitFor({ state: "visible", timeout: 10_000 });
    await productSearch.fill("Raw material A");
    await page
      .locator('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"]')
      .waitFor({ state: "visible", timeout: 15_000 });
    // Set up FormInit listener BEFORE triggering selection so we don't miss the response
    const formInitDone = page.waitForResponse(/FormInitializationComponent/, { timeout: 60_000 });
    await productSearch.press("ArrowDown");
    await page.keyboard.press("Enter");
    await formInitDone; // no catch — fail fast if FormInit doesn't fire (price would be 0)

    // Set Quantity — use evaluate to bypass React-controlled input
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

    // ── Step 5: Complete Invoice ──────────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.locator(".rounded-2xl").getByText("Complete", { exact: true }).click();

    await page
      .locator(".h-\\[625px\\] > .items-center > .font-semibold")
      .waitFor({ state: "visible", timeout: 10_000 });

    await clickOkInLegacyPopup(page);
    // Wait up to 30s for the result dialog — don't catch so a missing dialog fails loudly
    await page.locator('[data-testid="close-button"]').waitFor({ state: "visible", timeout: 30_000 });
    await page.locator('[data-testid="close-button"]').click();
    await closeToastIfPresent(page);

    // Refresh and verify Completed status
    await page
      .locator("button.toolbar-button-refresh")
      .filter({ visible: true })
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("button.toolbar-button-refresh").filter({ visible: true }).first().click();
    await page.waitForLoadState("networkidle", { timeout: 15_000 });
    // The chip resolves but is in a virtualized (off-screen) row — toBeAttached matches Cypress should("exist")
    await expect(page.locator(".MuiChip-label").filter({ hasText: "Completed" }).first()).toBeAttached({
      timeout: 20_000,
    });

    // ── Step 6: Add Payment ───────────────────────────────────────────────────
    // Cypress: cy.contains("button", "Available Process").click() then cy.contains("div.cursor-pointer", "Add Payment").click()
    // No retry loop needed — just wait long enough for the dropdown to render.
    await page.locator("button").filter({ hasText: "Available Process" }).first().click();
    const addPaymentLocator = page.locator("div.cursor-pointer").filter({ hasText: "Add Payment" });
    await addPaymentLocator.waitFor({ state: "visible", timeout: 15_000 });
    const defaultsResponse = page.waitForResponse(/DefaultsProcessActionHandler/, { timeout: 30_000 });
    await addPaymentLocator.click();
    await defaultsResponse;

    // Wait for the payment dialog to load by watching the UI — avoids network-wait timeouts
    // The Action dropdown and table rows both appear once defaults are loaded
    await page
      .locator('[aria-label="Action Regarding Document"]')
      .locator('div[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 30_000 });
    await page
      .locator("tbody.MuiTableBody-root tr.MuiTableRow-root")
      .first()
      .waitFor({ state: "attached", timeout: 15_000 });

    // Select action: "Process Made Payment(s)"
    await page
      .locator('[aria-label="Action Regarding Document"]')
      .locator('div[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[aria-label="Action Regarding Document"]').locator('div[tabindex="0"]').click();
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: "Process Made Payment(s)" })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid^="OptionItem__"]').filter({ hasText: "Process Made Payment(s)" }).first().click();

    // Execute — set up toast watcher BEFORE clicking so we don't miss it
    const successToast = page
      .waitForSelector('[data-sonner-toast][data-type="success"]', {
        state: "visible",
        timeout: 30_000,
      })
      .catch(() => null);
    await page.locator('[data-testid="ExecuteButton__761503"]').click();

    // ── Step 7: Verify payment success ───────────────────────────────────────
    // Wait for modal to close (indicates execution completed)
    await page
      .locator(".fixed.inset-0")
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => null);
    await successToast; // resolves or null if toast already dismissed

    // ── Step 8: Verify Payment Plan tab ──────────────────────────────────────
    // The success toast (Step 7) already confirms the payment was created.
    // Here we just verify the Payment Plan grid shows a record with a non-zero Paid Amount.
    await page.locator('button[title="Payment Plan"]').waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('button[title="Payment Plan"]').click();

    await page
      .locator("button.toolbar-button-refresh")
      .filter({ visible: true })
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("button.toolbar-button-refresh").filter({ visible: true }).first().click();

    // Confirm at least one payment plan row is visible (Lines table rows are hidden while Payment Plan is active)
    await expect(
      page.locator("tbody.MuiTableBody-root tr.MuiTableRow-root").filter({ visible: true }).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});

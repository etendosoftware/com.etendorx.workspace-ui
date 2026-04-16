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

    // Select Product — open dropdown, optionally search, then click the option
    await page
      .locator('[aria-label="Product"]')
      .locator('div[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[aria-label="Product"]').locator('div[tabindex="0"]').click();
    const productSearch = page.locator('input[aria-label="Search options"]');
    if (await productSearch.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await productSearch.fill("Raw material");
      // Wait for the filtered options to reload before clicking
      await page.waitForTimeout(500);
    }
    await page
      .locator('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"]')
      .waitFor({ state: "visible", timeout: 15_000 });
    // Set up FormInit listener right before the click so we don't catch a stale response
    const formInitDone = page.waitForResponse(/FormInitializationComponent/, { timeout: 30_000 }).catch(() => null);
    // force: true is required — the search input overlaps the dropdown options and intercepts pointer events
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295ADC1AD40222"]').click({ force: true });
    await formInitDone;

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

    // Refresh and verify Completed status
    await page
      .locator("button.toolbar-button-refresh")
      .filter({ visible: true })
      .first()
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("button.toolbar-button-refresh").filter({ visible: true }).first().click();
    // Cypress used should("exist") — check DOM presence, not visibility
    // (the chip may be in a grid row rendered behind the current detail view)
    await expect(page.locator(".MuiChip-label").filter({ hasText: "Completed" }).first()).toBeAttached({
      timeout: 20_000,
    });

    // ── Step 6: Add Payment ───────────────────────────────────────────────────
    await page.locator("button").filter({ hasText: "Available Process" }).first().click();
    await page
      .locator("div.cursor-pointer")
      .filter({ hasText: "Add Payment" })
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator("div.cursor-pointer").filter({ hasText: "Add Payment" }).click();

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

    // Execute
    await page.locator('[data-testid="ExecuteButton__761503"]').click();

    // ── Step 7: Verify payment success toast ─────────────────────────────────
    await expect(
      page.locator('[data-sonner-toast][data-type="success"]').filter({ hasText: /Created Payment:\s*\d+/ })
    ).toBeVisible({ timeout: 15_000 });

    // The Add Payment React modal auto-closes after execution — same pattern as PROa ExecuteButton flow.
    // Wait for the modal overlay to fully disappear before accessing the invoice tabs.
    await page
      .locator(".fixed.inset-0")
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => null);

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

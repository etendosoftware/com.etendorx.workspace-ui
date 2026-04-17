import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  closeToastIfPresent,
} from "../../helpers/etendo.helpers";

test.describe("Sales Order Automation - Complete Flow", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("should create a complete sales order with lines, complete it and add payment", async ({ page }) => {
    // ── Login & role ──────────────────────────────────────────────────────────
    await loginToEtendo(page);

    // Switch to QA role
    await selectRoleOrgWarehouse(page);

    // Wait for the app to stabilize with the new role context before proceeding
    await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });

    // ── Step 1: Navigate to Sales Order ──────────────────────────────────────
    const drawerInput = page.locator('[data-testid="drawer-search-input"] input');
    if (!(await drawerInput.isVisible({ timeout: 1_000 }).catch(() => false))) {
      await page.locator(".h-14 > div > .transition > svg").click();
      await drawerInput.waitFor({ state: "visible", timeout: 10_000 });
    }
    await drawerInput.click({ force: true });
    await page.keyboard.type("sales");
    await page.locator('[data-testid="MenuTitle__129"]').waitFor({ state: "visible", timeout: 10_000 });
    await page
      .waitForFunction(() => !document.querySelector("div.absolute.h-screen.w-screen"), { timeout: 20_000 })
      .catch(() => null);
    await page
      .locator('[data-testid="MenuTitle__129"] > .flex.overflow-hidden > .relative > .ml-2')
      .evaluate((el) => (el as HTMLElement).click());

    // ── Step 2: Create New Sales Order ─────────────────────────────────────────
    // Waiting for the New Record button is the definitive signal that the window
    // has fully loaded — no need for a separate breadcrumb check.
    await page
      .locator("button.toolbar-button-new:not([disabled])")
      .filter({ hasText: "New Record" })
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
    await page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first().click();

    // Wait for the main section form fields to be visible
    await page
      .locator('[aria-label="Business Partner"] > div[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 30_000 });

    // ── Step 3: Fill Sales Order Header ───────────────────────────────────────
    // Select Business Partner
    await page.locator('[aria-label="Business Partner"] > div[tabindex="0"]').click();
    await page
      .locator('[data-testid="OptionItem__4028E6C72959682B01295F40C3CB02EC"] > .truncate')
      .waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40C3CB02EC"] > .truncate').click();

    // Select Transaction Document
    await page.locator('[aria-label="Transaction Document"] > div[tabindex="0"]').click();
    await page
      .locator('[data-testid="OptionItem__FF8080812C2ABFC6012C2B3BDF4D005A"] > .truncate')
      .waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__FF8080812C2ABFC6012C2B3BDF4D005A"] > .truncate').click();

    // Save header
    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').first().click();
    await closeToastIfPresent(page);

    // Select Invoice Terms
    await page.locator('[aria-label="Invoice Terms"] > div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__I"] > .truncate').waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__I"] > .truncate').click();

    // Save invoice terms
    // Target the save button inside the header
    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').first().click();
    await closeToastIfPresent(page);

    // ── Step 4: Add Order Lines ───────────────────────────────────────────────
    await page.locator('button[aria-label="Lines"]').click();

    // Create new line
    const linesNewRecordButton = page
      .locator("button.toolbar-button-new:not([disabled])")
      .filter({ hasText: "New Record" })
      .last();
    await linesNewRecordButton.waitFor({ state: "visible", timeout: 15_000 });
    await linesNewRecordButton.click({ force: true });

    // Select Product
    const productField = page.locator('[aria-label="Product"] > div[tabindex="0"]');
    await productField.waitFor({ state: "visible", timeout: 15_000 });
    await productField.click();

    await page.locator('[data-testid^="OptionItem__"]').first().waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295ADC1D07022A"]').click({ force: true });

    // Wait for the form to re-initialize with product data
    await page.waitForTimeout(1_500);

    // Save line — .last() targets the Lines toolbar save button (header save is disabled while editing a line)
    await page.locator("button.toolbar-button-save").last().click();
    await closeToastIfPresent(page);

    // ── Step 5: Process the Order (Book) ──────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').first().click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();

    // Verify Process Order popup
    await expect(page.locator(".h-\\[625px\\] > .items-center > .font-semibold")).toHaveText("Process Order", {
      timeout: 10_000,
    });

    // Book the order
    await clickOkInLegacyPopup(page);

    // Assert the process completed successfully — fails immediately with a clear error if not found
    await expect(page.locator(".mb-1").filter({ hasText: "Process completed successfully" })).toBeVisible({
      timeout: 60_000,
    });
    await page.locator('[data-testid="close-button"]').click();

    await closeToastIfPresent(page);

    // Refresh the document
    const refreshButton = page
      .locator("button.toolbar-button-refresh")
      .filter({ hasNot: page.locator("[disabled]") })
      .first();
    await refreshButton.waitFor({ state: "visible" });
    await refreshButton.click();
    await page.waitForTimeout(2000);

    // ── Step 6: Navigate to Add Payment ───────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').first().click();

    // Click "Add Payment"
    await page.locator("div.cursor-pointer").filter({ hasText: "Add Payment" }).click();

    // Wait for payment dialog with rows to appear (rows may be hidden by virtualization)
    await page
      .locator("tbody.MuiTableBody-root tr.MuiTableRow-root")
      .first()
      .waitFor({ state: "attached", timeout: 30_000 });

    const actionDropdown = page.locator('div[aria-label="Action Regarding Document"]');
    await actionDropdown.waitFor({ state: "visible", timeout: 10000 });

    const actionInput = actionDropdown.locator('div[tabindex="0"]');
    await expect(actionInput).not.toBeDisabled();
    await actionInput.click();

    // ── Step 7: Configure Payment Transaction ─────────────────────────────────
    await page
      .locator('div[data-dropdown-portal] li[data-testid^="OptionItem__"]')
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });

    await page
      .locator('li[data-testid^="OptionItem__"]')
      .filter({ hasText: "Process Received Payment(s)" })
      .locator("span")
      .first()
      .click();

    await page.locator('[data-testid="ExecuteButton__761503"]').click();

    // Verify payment transaction toast
    await expect(
      page.locator('[data-sonner-toast][data-type="success"]').filter({ hasText: /Created Payment:\s*\d+\./ })
    ).toBeVisible({ timeout: 15_000 });
  });
});

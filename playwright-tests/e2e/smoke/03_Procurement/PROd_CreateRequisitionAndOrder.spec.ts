import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  closeToastIfPresent,
  captureDocumentNumber,
  navigateToRequisition,
  navigateToManageRequisitions,
} from "../../helpers/etendo.helpers";

test.describe("Requisition flow - Create and generate Purchase Order @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Processes a requisition and creates a Purchase Order from Manage Requisitions", async ({ page }) => {
    test.setTimeout(360_000);
    // ── Login ────────────────────────────────────────────────────────────────
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);

    // ── Step 1: Navigate to Requisition ──────────────────────────────────────
    await navigateToRequisition(page);

    // ── Step 2: New Requisition ───────────────────────────────────────────────
    const newBtn = page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first();
    await newBtn.waitFor({ state: "visible", timeout: 30_000 });
    await newBtn.click();

    // Fill Business Partner
    await page.locator('[aria-label="Business Partner"]').locator('div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40C5CF02F5"] > .truncate').click();

    // Save header
    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await closeToastIfPresent(page);

    // ── Step 3: Add Requisition Line ──────────────────────────────────────────
    await page.locator('button[aria-label="Lines"]').click();
    await page.getByRole("button", { name: "New Record" }).last().waitFor({ state: "visible", timeout: 10_000 });
    await page.getByRole("button", { name: "New Record" }).last().click();

    // Select Product (BOM Product via search)
    await page
      .locator('[aria-label="Product"]')
      .locator('[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[aria-label="Product"]').locator('[tabindex="0"]').click();
    const searchOptions = page.locator('input[aria-label="Search options"]');
    await searchOptions.waitFor({ state: "visible", timeout: 10_000 });
    await searchOptions.scrollIntoViewIfNeeded();
    await searchOptions.fill("BOM Product");
    await page
      .locator('[data-testid^="OptionItem__"]')
      .filter({ hasText: "BOM Product" })
      .waitFor({ state: "visible", timeout: 10_000 });
    // Wait for FormInitializationComponent that fires when BOM products are selected
    const bomFormInit = page.waitForResponse(/FormInitializationComponent/, { timeout: 15_000 }).catch(() => null);
    await page.locator('[data-testid^="OptionItem__"]').filter({ hasText: "BOM Product" }).click({ force: true });
    await bomFormInit;
    // Ensure the product dropdown portal is closed before interacting with other fields.
    // The portal can remain open even after selecting an option when FormInitializationComponent is slow.
    // Press Escape to dismiss it, then verify it's gone.
    const portal = page.locator('[data-dropdown-portal="dropdown-product"]');
    if (await portal.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await page.keyboard.press("Escape");
      await portal.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => null);
    }
    await page.waitForTimeout(500);

    // Set Business Partner on line (Vendor A).
    // Use .last() — after saving the header, the header BP becomes read-only so the
    // only interactive BP field left is the line one.
    await page.locator('[aria-describedby="Business Partner-help"]').last().locator('div[tabindex="0"]').click();
    await page
      .locator('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]')
      .waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40BDDF02E3"]').click();

    // Set Need By Date to today
    const d = new Date();
    const mmddyyyy = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
    const needByDateInput = page.locator("#needByDate");
    await needByDateInput.scrollIntoViewIfNeeded();
    await needByDateInput.clear();
    await needByDateInput.fill(mmddyyyy);
    await needByDateInput.blur();
    await expect(needByDateInput).toHaveValue(mmddyyyy, { timeout: 5_000 });

    // Save line
    await page.locator("button.toolbar-button-save").last().click();
    await closeToastIfPresent(page);

    // ── Step 4: Post Requisition ──────────────────────────────────────────────
    // First open: preview the process modal title, then close without executing
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();
    await expect(page.locator(".h-\\[625px\\] > .items-center > .font-semibold")).toHaveText("Post Requisition", {
      timeout: 10_000,
    });
    await page.locator('[data-testid="close-button"]').click();

    // Second open: actually execute
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();
    await expect(page.locator(".h-\\[625px\\] > .items-center > .font-semibold")).toHaveText("Post Requisition", {
      timeout: 10_000,
    });

    await clickOkInLegacyPopup(page);
    await page.waitForTimeout(500);
    // Wait for close-button to appear after the process completes (same pattern as PROaOrderToInvoiceTest)
    await page
      .locator('[data-testid="close-button"]')
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => null);
    await page
      .locator('[data-testid="close-button"]')
      .click({ force: true })
      .catch(() => null);
    await closeToastIfPresent(page);

    // ── Step 5: Capture document number ──────────────────────────────────────
    // Wait for the modal to fully close before capturing so we don't grab a number from the modal
    await page
      .locator('[data-testid="close-button"]')
      .waitFor({ state: "hidden", timeout: 5_000 })
      .catch(() => null);
    const orderNumber = await captureDocumentNumber(page);

    // ── Step 6: Navigate to Manage Requisitions ───────────────────────────────
    await navigateToManageRequisitions(page);

    // ── Step 7: Filter by document number and verify single result ────────────
    await page.locator("table thead").waitFor({ state: "visible", timeout: 15_000 });

    // The Manage Requisitions tab has an implicit HQL/SQL filter (e.g. processed='N')
    // that hides posted requisitions. Disable it before applying our document number filter.
    // toolbar-button-filter is the implicit-filter toggle; clicking it turns the filter OFF.
    const filterToggle = page.locator("button.toolbar-button-filter").first();
    if (await filterToggle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await filterToggle.click();
      // Wait for the table to reload without the implicit filter
      await page.waitForTimeout(1_000);
    }

    const filterInput = page.locator('input[placeholder*="Document No"]');
    await filterInput.waitFor({ state: "visible", timeout: 10_000 });
    await filterInput.clear();
    // Wait for the datasource response after pressing Enter to ensure the filter is applied
    const filterDone = page.waitForResponse(/api\/datasource/, { timeout: 20_000 }).catch(() => null);
    await filterInput.fill(orderNumber);
    await filterInput.press("Enter");
    await filterDone;

    await expect(page.locator(".MuiTableBody-root tr").filter({ hasText: orderNumber })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator(".MuiTableBody-root tr")).toHaveCount(1, { timeout: 10_000 });
    await expect(page.getByText("Showing 1 record")).toBeVisible({ timeout: 10_000 });

    // ── Step 8: Select row and create Purchase Order ──────────────────────────
    await page.locator('input[type="checkbox"][aria-label="Toggle select row"]').check({ force: true });

    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();
    await page
      .locator(".h-\\[625px\\] > .items-center > .font-semibold")
      .waitFor({ state: "visible", timeout: 10_000 });

    await clickOkInLegacyPopup(page);
    await page
      .locator('[data-testid="close-button"]')
      .click({ force: true })
      .catch(() => null);
    await closeToastIfPresent(page);
  });
});

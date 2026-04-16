import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  navigateToGoodsShipment,
  navigateToSalesInvoice,
  closeToastIfPresent,
  expectSuccessToast,
  fillCreateLinesFromPopup,
  captureDocumentNumber,
} from "../../helpers/etendo.helpers";

test.skip("Sales Orders - Create, Complete Shipment and Invoice", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("should create a sales order with lines, create goods shipment, complete lines from order, create invoice, complete lines from order and post", async ({
    page,
  }) => {
    test.setTimeout(360_000);
    // ── Login ────────────────────────────────────────────────────────────────
    await loginToEtendo(page);
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
    await page.locator('[data-testid="MenuTitle__129"] > .flex.overflow-hidden > .relative > .ml-2').click();
    await page
      .locator('nav[aria-label="breadcrumb"]')
      .getByText(/Sales Order/i)
      .waitFor({ state: "visible", timeout: 15_000 });

    // ── Step 2: New Sales Order ───────────────────────────────────────────────
    // Wait for the window to be fully loaded (button enabled) before creating a new record
    await page
      .locator("button.toolbar-button-new:not([disabled])")
      .filter({ hasText: "New Record" })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    await page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first().click();
    // Wait for the form fields — the tab appears before the form finishes loading
    await page
      .locator('[aria-label="Business Partner"] > div[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 30_000 });

    // ── Step 3: Fill header ───────────────────────────────────────────────────
    await page.locator('[aria-label="Business Partner"] > div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click();

    await page.locator('[aria-label="Transaction Document"] > div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__FF8080812C2ABFC6012C2B3BDF4D005A"] > .truncate').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').first().click();
    await closeToastIfPresent(page);

    await page.locator('[aria-label="Invoice Terms"] > div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__I"] > .truncate').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').first().click();
    await closeToastIfPresent(page);

    // ── Step 4: Add order line ────────────────────────────────────────────────
    await page.locator('button[aria-label="Lines"]').click();
    await page
      .locator('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"]')
      .first()
      .click({ force: true });

    await page.locator('[aria-label="Product"] > div[tabindex="0"]').click();
    // Wait for the option list to populate, then force-click to bypass virtual-list actionability checks
    await page.locator('[data-testid^="OptionItem__"]').first().waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295ADC2340023D"]').click({ force: true });
    // Wait for the form to re-initialize with product data
    await page.locator('[data-testid="TextInput__1130"]').waitFor({ state: "visible", timeout: 30_000 });

    // Set quantity — use native value setter to bypass React's synthetic event handling
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="TextInput__1130"]') as HTMLInputElement;
      if (!input) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(input, "11");
      input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
      input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(1_000);

    // Save line — target the save button in the bottom panel (last visible instance)
    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').last().click();
    await closeToastIfPresent(page);

    // ── Step 5: Process order (Book) ──────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();
    await expect(page.locator(".h-\\[625px\\] > .items-center > .font-semibold")).toHaveText("Process Order", {
      timeout: 10_000,
    });

    await clickOkInLegacyPopup(page);
    await expectSuccessToast(page);

    const salesOrderNumber = await captureDocumentNumber(page);

    // Reload to refresh order state (known app bug — state not always reflected without reload),
    // then navigate to home to clear open window tabs before navigating to a new window.
    await page.reload();
    await page.goto("/");
    await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });

    // ── Step 6: Create Goods Shipment ─────────────────────────────────────────
    await navigateToGoodsShipment(page);

    await page.locator("button.toolbar-button-new").first().waitFor({ state: "visible", timeout: 15_000 });
    await page.locator("button.toolbar-button-new").first().click();
    await page
      .locator('[aria-label="Business Partner"] > div[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 10_000 });

    await page.locator('[aria-label="Business Partner"] > div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').first().click();
    await closeToastIfPresent(page);

    // ── Step 7: Add lines from Sales Order (legacy iframe popup) ──────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').first().click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();

    await fillCreateLinesFromPopup(page, { locatorValue: "L01", orderDocNumber: salesOrderNumber });
    await expectSuccessToast(page);

    // ── Step 8: Process Shipment ──────────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').first().click();
    await page.locator(".rounded-2xl > :nth-child(2)").click();
    await expect(page.locator(".h-\\[625px\\] > .items-center > .font-semibold")).toHaveText("Process Shipment Java", {
      timeout: 10_000,
    });

    await clickOkInLegacyPopup(page);
    await expectSuccessToast(page);

    // ── Step 9: Create Sales Invoice ──────────────────────────────────────────
    // Navigate to home to clear open window tabs before opening a new window.
    await page.goto("/");
    await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });
    await navigateToSalesInvoice(page);

    await page.locator("button.toolbar-button-new").first().waitFor({ state: "visible", timeout: 15_000 });
    await page.locator("button.toolbar-button-new").first().click();
    await page
      .locator('[aria-label="Business Partner"] > div[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 10_000 });

    await page.locator('[aria-label="Business Partner"] > div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').first().click();
    await closeToastIfPresent(page);

    // ── Step 10: Add lines from Goods Shipment ────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').first().click();
    await page.locator(".rounded-2xl > :nth-child(2)").click();

    // Select data row, toggle select-all to verify state, then re-select the row
    await page.locator('tr[data-index="0"] > .css-br42ok > .MuiButtonBase-root > .PrivateSwitchBase-input').check();
    await page.locator(".Mui-TableHeadCell-Content-Wrapper > .MuiButtonBase-root > .PrivateSwitchBase-input").check();
    await page.locator(".Mui-TableHeadCell-Content-Wrapper > .MuiButtonBase-root > .PrivateSwitchBase-input").uncheck();
    await page.locator('tr[data-index="0"] > .css-br42ok > .MuiButtonBase-root > .PrivateSwitchBase-input').check();

    await page.locator(".gap-4 > .text-white").click();
    await page.locator(".gap-4 > .border").click();

    // ── Step 11: Complete Invoice ─────────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').first().click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();

    await clickOkInLegacyPopup(page);
    await expectSuccessToast(page);
    await closeToastIfPresent(page);

    await page.locator('[data-testid="CloseIcon__cfc328"]').click();

    // ── Step 12: Post Invoice ─────────────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').first().click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();

    await clickOkInLegacyPopup(page);
    await closeToastIfPresent(page);
  });
});

import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  closeToastIfPresent,
  expectSuccessToast,
} from "../../helpers/etendo.helpers";

test.describe("Sales Orders - Create, Complete and Close", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("should create a sales order, add lines, complete and close it", async ({ page }) => {
    // ── Login & role ──────────────────────────────────────────────────────────
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);
    await page.locator(".h-14 > div > .transition > svg").waitFor({ state: "visible", timeout: 15_000 });

    // ── Step 1: Navigate to Sales Order ──────────────────────────────────────
    const drawerInput = page.locator('[data-testid="drawer-search-input"] input');
    if (!await drawerInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await page.locator(".h-14 > div > .transition > svg").click();
      await drawerInput.waitFor({ state: "visible", timeout: 10_000 });
    }
    await drawerInput.click({ force: true });
    await page.keyboard.type("sales");
    await page.locator('[data-testid="MenuTitle__129"]').waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[data-testid="MenuTitle__129"] > .flex.overflow-hidden > .relative > .ml-2').click();
    await page.locator('nav[aria-label="breadcrumb"]').getByText(/Sales Order/i).waitFor({ state: "visible", timeout: 15_000 });

    // ── Step 2: Create New Sales Order ────────────────────────────────────────
    await page
      .locator("button.toolbar-button-new:not([disabled])")
      .filter({ hasText: "New Record" })
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    await page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first().click();
    await page.locator('[aria-label="Business Partner"] > div[tabindex="0"]').waitFor({ state: "visible", timeout: 30_000 });

    // ── Step 3: Fill header ───────────────────────────────────────────────────
    await page.locator('[aria-label="Business Partner"] > div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').first().click();
    await closeToastIfPresent(page);

    // ── Step 4: Add order line ────────────────────────────────────────────────
    await page.locator('button[aria-label="Lines"]').click();

    const linesNewBtn = page
      .locator("button.toolbar-button-new:not([disabled])")
      .filter({ hasText: "New Record" })
      .last();
    await linesNewBtn.waitFor({ state: "visible", timeout: 20_000 });
    await linesNewBtn.click({ force: true });

    await page.locator('[aria-label="Product"] > div[tabindex="0"]').waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[aria-label="Product"] > div[tabindex="0"]').click();
    await page.locator('[data-testid^="OptionItem__"]').first().waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295ADC2340023D"]').click({ force: true });
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

    // Save line (index 1 = save button inside the Lines tab toolbar)
    await page.locator("button.toolbar-button-save").nth(1).click();
    await closeToastIfPresent(page);

    // ── Step 5: Process Order (Book) ──────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();
    await expect(page.locator(".h-\\[625px\\] > .items-center > .font-semibold")).toHaveText(
      "Process Order",
      { timeout: 10_000 }
    );

    await clickOkInLegacyPopup(page);

    // Success may appear inside the popup or as a toast
    const successInPopup = page.locator(".mb-1").filter({ hasText: "Process completed successfully" });
    if (await successInPopup.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await page.locator('[data-testid="close-button"]').click();
    } else {
      await expectSuccessToast(page);
    }
    await closeToastIfPresent(page);

    // ── Step 6: Close the Order ───────────────────────────────────────────────
    // We are already on the booked record — no need to navigate away and re-find it.
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').first().click();

    // Use text matching instead of positional :nth-child — "Close" is not always the first item
    await page.locator(".rounded-2xl div").filter({ hasText: /^Close$/ }).first().click();

    await expect(page.locator(".h-\\[625px\\] > .items-center > .font-semibold")).toHaveText(
      "Process Order",
      { timeout: 10_000 }
    );

    await clickOkInLegacyPopup(page);

    const closeSuccessInPopup = page.locator(".mb-1").filter({ hasText: "Process completed successfully" });
    if (await closeSuccessInPopup.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await page.locator('[data-testid="close-button"]').click();
    } else {
      await expectSuccessToast(page);
    }
    await closeToastIfPresent(page);
  });
});

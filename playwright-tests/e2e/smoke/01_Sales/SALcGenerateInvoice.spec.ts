import { test, expect, type Frame } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  closeToastIfPresent,
  expectSuccessToast,
} from "../../helpers/etendo.helpers";

test.describe("Sales flow - Generate invoices from multiple sales orders", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Generates invoices from processed sales orders and shipments for multiple customers", async ({ page }) => {
    // ── Login & role ──────────────────────────────────────────────────────────
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);
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

    // ── Step 2: Create New Sales Order ────────────────────────────────────────
    // The New Record button being enabled is the definitive signal that the window
    // has fully loaded — no need for a separate breadcrumb check.
    await page
      .locator("button.toolbar-button-new:not([disabled])")
      .filter({ hasText: "New Record" })
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });
    await page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first().click();
    await page
      .locator('[aria-label="Business Partner"] > div[tabindex="0"]')
      .waitFor({ state: "visible", timeout: 30_000 });

    // ── Step 3: Fill header ───────────────────────────────────────────────────
    await page.locator('[aria-label="Business Partner"] > div[tabindex="0"]').click();
    await page
      .locator('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate')
      .waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click();

    await page.locator('[aria-label="Transaction Document"] > div[tabindex="0"]').click();
    await page
      .locator('[data-testid="OptionItem__FF8080812C2ABFC6012C2B3BDF4D005A"] > .truncate')
      .waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__FF8080812C2ABFC6012C2B3BDF4D005A"] > .truncate').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').first().click();
    await closeToastIfPresent(page);

    await page.locator('[aria-label="Invoice Terms"] > div[tabindex="0"]').click();
    await page.locator('[data-testid="OptionItem__I"] > .truncate').waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__I"] > .truncate').click();

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
    await expect(page.locator(".h-\\[625px\\] > .items-center > .font-semibold")).toHaveText("Process Order", {
      timeout: 10_000,
    });

    await clickOkInLegacyPopup(page);

    // Success may appear inside the popup or as a toast
    const successInPopup = page.locator(".mb-1").filter({ hasText: "Process completed successfully" });
    if (await successInPopup.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await page.locator('[data-testid="close-button"]').click();
    } else {
      await expectSuccessToast(page);
    }
    await closeToastIfPresent(page);

    // ── Steps 6–7: Create and process related documents from within the sales order ──
    // NOTE: IconButton__C7913FFAF4DF44BFB0392755DEAE9C89 is located in the 3rd child of
    // its container (likely a sub-tab or related-records strip in the sales order view).
    // ChevronDownIcon__987e83 opens a process dropdown on that sub-context toolbar.
    // Both blocks are direct translations from the Cypress test; validate with live app.
    for (let i = 0; i < 2; i++) {
      await page
        .locator(':nth-child(3) > [data-testid="IconButton__C7913FFAF4DF44BFB0392755DEAE9C89"]')
        .first()
        .click();
      await page.locator(".bg-\\[var\\(--color-etendo-main\\)\\]").first().click();

      // Wait for the process menu button to be visible and enabled — replaces the
      // unreliable hardcoded delay. "not([disabled])" confirms the toolbar has
      // initialized and has a selected record (applies to both iterations).
      await page
        .locator('[data-testid="IconButtonWithText__process-menu"]:not([disabled])')
        .first()
        .waitFor({ state: "visible", timeout: 30_000 });

      await page.locator('[data-testid="ChevronDownIcon__987e83"]').first().click();
      await page.locator(".rounded-2xl > :nth-child(1)").click();
      // clickOkInLegacyPopup polls all frames for the OK button — no hardcoded delay needed.
      await clickOkInLegacyPopup(page, 20_000);
      await page.locator('[data-testid="close-button"]').click();
      await closeToastIfPresent(page);
    }

    // ── Step 8: Navigate to Create Invoices batch process (MenuTitle__346) ────
    const createInput = page.locator('[data-testid="drawer-search-input"] input');
    if (!(await createInput.isVisible({ timeout: 1_000 }).catch(() => false))) {
      await page.locator(".h-14 > div > .transition > svg").click();
      await createInput.waitFor({ state: "visible", timeout: 10_000 });
    }
    await createInput.click({ force: true });
    await createInput.fill("");
    await page.keyboard.type("create");
    await page.locator('[data-testid="MenuTitle__346"]').waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[data-testid="MenuTitle__346"] > .flex.overflow-hidden > .relative > .ml-2').click();

    // The outer legacy iframe loads Menu.html, which in turn loads the actual form
    // (GenerateShipmentsmanual.html or similar) inside a nested iframe. legacyFrame()
    // only reaches one level deep, so we must iterate page.frames() — same technique
    // as fillCreateLinesFromPopup — to find the nested frame that contains #paramDateFrom.
    let processFrame: Frame | null = null;
    const frameDeadline = Date.now() + 30_000;
    while (Date.now() < frameDeadline && !processFrame) {
      for (const f of page.frames()) {
        try {
          if ((await f.locator("#paramDateFrom").count()) > 0) {
            processFrame = f;
            break;
          }
        } catch {
          // Frame detached or cross-origin — keep searching
        }
      }
      if (!processFrame) await page.waitForTimeout(500);
    }
    if (!processFrame) throw new Error("Create Invoices process frame not found");

    // Set start date far enough back to include the order just created
    await processFrame.locator("#paramDateFrom").waitFor({ state: "attached", timeout: 10_000 });
    await processFrame.locator("#paramDateFrom").fill("01/01/2000");
    await page.waitForTimeout(1_000);

    // Search for matching orders/shipments
    await processFrame.getByRole("button", { name: /^Search$/i }).click();

    // The form uses a frameset: parameters (#paramDateFrom) and results (inpOrder checkboxes)
    // may be in sibling <frame> elements. Iterate ALL page frames to find the results frame
    // — mirrors Cypress interactWithLegacyIframe which iterates each <frame> contentDocument.
    let resultsFrame: Frame = processFrame;
    const cbDeadline = Date.now() + 15_000;
    outer: while (Date.now() < cbDeadline) {
      for (const f of page.frames()) {
        try {
          if ((await f.locator('input[type="checkbox"][name="inpOrder"]').count()) > 0) {
            resultsFrame = f;
            break outer;
          }
        } catch {
          // detached frame — skip
        }
      }
      await page.waitForTimeout(300);
    }

    // Select all order checkboxes via native DOM click — mirrors Cypress selectLegacyCheckboxes
    await resultsFrame.evaluate(() => {
      const checkboxes = Array.from(
        document.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="inpOrder"]')
      );
      // Leave the last one unchecked — matches Cypress selectLegacyCheckboxes(name, leaveLastUnchecked=true)
      const limit = checkboxes.length > 1 ? checkboxes.length - 1 : checkboxes.length;
      checkboxes.slice(0, limit).forEach((cb) => cb.click());
    });

    await resultsFrame.getByRole("button", { name: /^Process$/i }).click();

    // Success message: check the results frame first, then fall back to all frames
    // (Cypress verifyLegacySuccessMessage uses .MessageBox_TextTitle#messageBoxIDTitle)
    const successSelector = ".MessageBox_TextTitle#messageBoxIDTitle";
    const successDeadline = Date.now() + 30_000;
    let processSuccess = false;
    while (Date.now() < successDeadline && !processSuccess) {
      for (const f of page.frames()) {
        try {
          const el = f.locator(successSelector);
          if ((await el.count()) > 0) {
            const txt = await el.textContent();
            if (/Process completed successfully/i.test(txt ?? "")) {
              processSuccess = true;
              break;
            }
          }
        } catch {
          // detached frame
        }
      }
      if (!processSuccess) await page.waitForTimeout(300);
    }
    if (!processSuccess) throw new Error("Create Shipments process did not complete successfully within 30s");

    await page.locator('[data-testid="close-button"]').click();
    await closeToastIfPresent(page);

    // ── Step 9: Navigate to Generate Invoices report (MenuTitle__192) ─────────
    const reportInput = page.locator('[data-testid="drawer-search-input"] input');
    if (!(await reportInput.isVisible({ timeout: 1_000 }).catch(() => false))) {
      await page.locator(".h-14 > div > .transition > svg").click();
      await reportInput.waitFor({ state: "visible", timeout: 10_000 });
    }
    await reportInput.click({ force: true });
    await reportInput.fill("");
    await page.keyboard.type("genera");
    await page.locator('[data-testid="MenuTitle__192"]').waitFor({ state: "visible", timeout: 10_000 });
    await page.locator('[data-testid="MenuTitle__192"] > .flex.overflow-hidden > .relative > .ml-2').click();

    // Wait briefly before executing — avoids known race where the report
    // fires before the previous process result is fully committed.
    await page.waitForTimeout(3_000);

    // Execute the report
    const executeBtn = page.locator('[data-testid^="ExecuteReportButton"]');
    await executeBtn.waitFor({ state: "visible", timeout: 30_000 });
    await expect(executeBtn).not.toBeDisabled({ timeout: 10_000 });
    await executeBtn.click();

    // Verify report completion and that invoices were created
    await expect(page.getByText(/Process completed success/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/^Created:/)).toBeVisible({ timeout: 15_000 });
  });
});

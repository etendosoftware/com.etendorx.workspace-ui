import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  clickOkInLegacyPopup,
  typeInGlobalSearch,
  navigateToGoodsShipment,
  navigateToSalesInvoice,
  closeToastIfPresent,
  expectSuccessToast,
  legacyFrame,
} from "../../helpers/etendo.helpers";
import { IFRAME_URL } from "../../../playwright.config";

test.describe("Sales Orders - Create, Complete Shipment and Invoice @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("should create a sales order with lines, create goods shipment, complete lines from order, create invoice, complete lines from order and post", async ({
    page,
  }) => {
    // ── Login ────────────────────────────────────────────────────────────────
    await loginToEtendo(page);
    await selectRoleOrgWarehouse(page);

    // ── Step 1: Navigate to Sales Order ──────────────────────────────────────
    await page.locator(".h-14 > div > .transition > svg").click();
    await typeInGlobalSearch(page, "sales");
    await page.locator('[data-testid="MenuTitle__129"]').click();

    // ── Step 2: New Sales Order ───────────────────────────────────────────────
    await page.locator("button.toolbar-button-new").filter({ hasText: "New Record" }).first().click();
    await expect(page.getByRole("tab", { name: "Main Section" })).toBeVisible({ timeout: 10_000 });

    // ── Step 3: Fill Header ───────────────────────────────────────────────────
    // Business Partner
    await page
      .locator('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm')
      .click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click();

    // Transaction Document
    await page
      .locator('[aria-describedby="Transaction Document-help"] > .w-2\\/3 > .relative > .w-full')
      .click();
    await page.locator('[data-testid="OptionItem__FF8080812C2ABFC6012C2B3BDF4D005A"] > .truncate').click();

    // Save header
    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await closeToastIfPresent(page);

    // Invoice Terms
    await page
      .locator('[aria-describedby="Invoice Terms-help"] > .w-2\\/3 > .relative > .w-full > .text-sm')
      .click();
    await page.locator('[data-testid="OptionItem__I"] > .truncate').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span').click();
    await closeToastIfPresent(page);

    // ── Step 4: Add Order Lines ───────────────────────────────────────────────
    await page.locator('button[aria-label="Lines"]').click();
    await page.locator('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"]').first().click({ force: true });

    // Product
    await page.locator('[aria-describedby="Product-help"] > .w-2\\/3 > .relative > .w-full').click();
    await page.locator('[data-testid^="OptionItem__"]').first().waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295ADC2340023D"]').waitFor({ state: "visible", timeout: 15_000 });
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295ADC2340023D"] > .truncate').click({ force: true });
    await page.waitForLoadState("networkidle", { timeout: 30_000 });

    // Quantity
    await page.locator('[data-testid="TextInput__1130"]').waitFor({ state: "visible" });
    await page.evaluate(() => {
      const input = document.querySelector('[data-testid="TextInput__1130"]') as HTMLInputElement;
      if (!input) return;
      input.disabled = false;
      input.readOnly = false;
      input.focus();
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
      nativeSetter?.call(input, "11");
      input.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
      input.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(1000);

    // Save line
    await page
      .locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"]')
      .last()
      .click();
    await page.waitForLoadState("networkidle", { timeout: 30_000 });
    await closeToastIfPresent(page);

    // ── Step 5: Process Order (Book) ──────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"]').first().click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();
    await expect(page.locator(".h-\\[625px\\] > .items-center > .font-semibold")).toHaveText("Process Order");

    await clickOkInLegacyPopup(page);
    await expectSuccessToast(page); // closes the modal internally

    // ── Step 6: Create Goods Shipment ─────────────────────────────────────────
    await navigateToGoodsShipment(page);

    const newRecordBtn = page.locator('button.toolbar-button-new:not([disabled])');
    await newRecordBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newRecordBtn.click();

    // Business Partner
    await page
      .locator('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm')
      .click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"]').last().click();
    await closeToastIfPresent(page);

    // ── Step 7: Add Lines from Sales Order (legacy iframe) ────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();

    let createLinesFrame: import("@playwright/test").Frame | null = null;
    for (let attempt = 0; attempt < 10 && !createLinesFrame; attempt++) {
      await page.waitForTimeout(500);
      for (const f of page.frames()) {
        try {
          if (await f.locator("#inpPurchaseOrder").count() > 0) {
            createLinesFrame = f;
            break;
          }
        } catch {}
      }
    }
    if (!createLinesFrame) throw new Error("Create Lines From frame not found");

    // Select last sales order from dropdown
    const orderSelect = createLinesFrame.locator("#inpPurchaseOrder");
    await orderSelect.waitFor({ state: "visible", timeout: 10_000 });
    await createLinesFrame.locator("#inpPurchaseOrder option").nth(1).waitFor({ state: "attached", timeout: 15_000 }).catch(() => null);

    const optionCount = await orderSelect.locator("option").count();
    if (optionCount > 1) {
      const lastValue = await orderSelect.locator("option").last().getAttribute("value");
      if (lastValue) await orderSelect.selectOption(lastValue);
      await page.waitForTimeout(4000);
    }

    // Wait for data rows to populate
    await createLinesFrame
      .locator("tr")
      .filter({ hasNot: createLinesFrame.locator("th") })
      .locator('input[type="checkbox"]')
      .first()
      .waitFor({ state: "visible", timeout: 10_000 })
      .catch(() => null);

    // Select data row checkbox
    const dataCheckbox = createLinesFrame.locator("tr").filter({ hasNot: createLinesFrame.locator("th") }).locator('input[type="checkbox"]').first();
    const hasDataRow = await dataCheckbox.count() > 0;
    if (hasDataRow) {
      await dataCheckbox.check({ force: true });
    } else {
      await createLinesFrame.locator('input[type="checkbox"]').first().check({ force: true });
    }

    // Open locator selector popup, search and extract locator ID
    const locatorPopupPromise = page.context().waitForEvent("page", { timeout: 10_000 });
    await createLinesFrame.getByRole("link", { name: /Locator/i }).first().click();
    const locatorPopup = await locatorPopupPromise.catch(() => null);

    if (locatorPopup) {
      await locatorPopup.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => null);

      // Submit the form with Command=SEARCH to load the locator grid
      await locatorPopup.evaluate(() => {
        const form = document.querySelector("form[name='frmSelector']") as HTMLFormElement | null;
        if (!form) return;
        const cmd = form.querySelector("input[name='Command']") as HTMLInputElement | null;
        if (cmd) cmd.value = "SEARCH";
        form.submit();
      });
      await locatorPopup.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => null);

      // Extract the first locator ID from the result grid's tr[onclick] attributes
      const locatorFromPopup = await locatorPopup.evaluate(() => {
        const rows = document.querySelectorAll("tr[onclick], tr[onClick]");
        for (const row of rows) {
          const onclick = (row.getAttribute("onclick") || row.getAttribute("onClick") || "").trim();
          if (!onclick) continue;
          const twoArgMatch = onclick.match(/\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]/);
          if (twoArgMatch) return { id: twoArgMatch[1], name: twoArgMatch[2] };
          const hexMatch = onclick.match(/['"]([0-9A-Fa-f]{32})['"]/);
          if (hexMatch) return { id: hexMatch[1], name: hexMatch[1] };
        }
        return null;
      }) as { id: string; name: string } | null;

      if (locatorFromPopup?.id) {
        // Set both fields in the Create Lines From frame via Playwright's CDP
        await createLinesFrame.evaluate(({ id, name }) => {
          const idEl = document.getElementById("paramM_Locator_ID") as HTMLInputElement | null;
          const descEl = document.getElementById("paramM_Locator_ID_DES") as HTMLInputElement | null;
          if (idEl) idEl.value = id;
          if (descEl) descEl.value = name || id;
        }, locatorFromPopup);
      }

      await locatorPopup.close().catch(() => null);
      await page.waitForTimeout(300);
    }

    // Click OK
    await createLinesFrame.locator("td.Button_text").filter({ hasText: /^OK$/i }).first().click();
    await expectSuccessToast(page); // closes the modal internally

    // ── Step 8: Process Shipment ──────────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').last().click();
    await page.locator(".rounded-2xl > :nth-child(2)").click();
    await expect(page.locator(".h-\\[625px\\] > .items-center > .font-semibold")).toHaveText("Process Shipment Java");

    await clickOkInLegacyPopup(page);
    await expectSuccessToast(page); // closes the modal internally

    // ── Step 9: Create Sales Invoice ──────────────────────────────────────────
    await navigateToSalesInvoice(page);

    const newInvoiceBtn = page.locator('button.toolbar-button-new:not([disabled])');
    await newInvoiceBtn.waitFor({ state: "visible", timeout: 15_000 });
    await newInvoiceBtn.click();

    // Business Partner
    await page
      .locator('[aria-describedby="Business Partner-help"] > .w-2\\/3 > .relative > .w-full > .text-sm')
      .click();
    await page.locator('[data-testid="OptionItem__4028E6C72959682B01295F40CFE1031B"] > .truncate').click();

    await page.locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"]').last().click();
    await closeToastIfPresent(page);

    // ── Step 10: Add Lines from Goods Shipment ────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl > :nth-child(2)").click();

    await page
      .locator('tr[data-index="0"] > .css-br42ok > .MuiButtonBase-root > .PrivateSwitchBase-input')
      .check();

    // Toggle select-all then re-select specific row
    await page
      .locator(".Mui-TableHeadCell-Content-Wrapper > .MuiButtonBase-root > .PrivateSwitchBase-input")
      .check();
    await page
      .locator(".Mui-TableHeadCell-Content-Wrapper > .MuiButtonBase-root > .PrivateSwitchBase-input")
      .uncheck();
    await page
      .locator('tr[data-index="0"] > .css-br42ok > .MuiButtonBase-root > .PrivateSwitchBase-input')
      .check();

    await page.locator(".gap-4 > .text-white").click();
    await page.locator(".gap-4 > .border").click();

    // ── Step 11: Complete Invoice ─────────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();

    await clickOkInLegacyPopup(page);
    await expectSuccessToast(page);
    await closeToastIfPresent(page);

    await page.locator('[data-testid="CloseIcon__cfc328"]').click();

    // ── Step 12: Post Invoice ─────────────────────────────────────────────────
    await page.locator('[data-testid="IconButtonWithText__process-menu"] > span').click();
    await page.locator(".rounded-2xl > :nth-child(1)").click();

    await clickOkInLegacyPopup(page);
    await closeToastIfPresent(page);
  });
});

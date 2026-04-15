import { test, expect } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  navigateByMenuTestId,
  clickNewRecord,
  clickSave,
  typeName,
  closeToastIfPresent,
} from "../../helpers/etendo.helpers";

test.describe("Master Data - Product and Pricing Setup @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
    page.on("pageerror", (err) => {
      if (!/Hydration failed/i.test(err.message)) {
        throw err;
      }
    });
  });

  test("Configure price lists, schemas, attributes and create product", async ({ page }) => {
    // ── Local helpers ────────────────────────────────────────────────────────
    const clickNewChildRecord = async () => {
      await page
        .locator('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"] > span')
        .click();
    };

    const fillVisibleByAriaLabel = async (label: string, value: string) => {
      const input = page.locator(`input[aria-label="${label}"]`).locator("visible=true").first();
      await input.waitFor({ state: "visible", timeout: 20_000 });
      await input.clear();
      await input.fill(value);
    };

    const selectAutocomplete = async (
      containerAriaLabel: string,
      optionText: string,
      searchPlaceholder: "Search options" | "Search..." | "Buscar..." = "Search options"
    ) => {
      await page.locator(`[aria-label="${containerAriaLabel}"] > div[tabindex="0"]`).click();
      const searchInput =
        searchPlaceholder === "Search options"
          ? page.locator('input[aria-label="Search options"]').first()
          : page.locator(`input[placeholder="${searchPlaceholder}"]`).first();
      await searchInput.waitFor({ state: "visible", timeout: 10_000 });
      await searchInput.fill(optionText);
      await page
        .locator('[data-testid^="OptionItem"]')
        .filter({ hasText: optionText })
        .first()
        .click();
    };

    // ── Login + navigate to Price List Schema window ─────────────────────────
    await loginToEtendo(page, "admin", "admin");
    await page.waitForTimeout(1_000);

    await navigateByMenuTestId(page, "price", "MenuTitle__310");
    await page.waitForTimeout(1_000);

    // ── Standard price list schema ────────────────────────────────────────────
    await clickNewRecord(page);
    await typeName(page, "standar");
    await clickSave(page);
    await page.waitForTimeout(1_000);
    await closeToastIfPresent(page);
    await page.waitForTimeout(1_000);

    // Open Lines subtab
    const linesBtn = page
      .locator("button")
      .filter({ hasText: /^Lines$/ })
      .first();
    await linesBtn.waitFor({ state: "visible", timeout: 20_000 });
    await expect(linesBtn).toBeEnabled();
    await linesBtn.click();
    await page.waitForTimeout(1_000);

    await clickNewChildRecord();
    await page.waitForTimeout(1_000);

    await fillVisibleByAriaLabel("Surcharge List Price Amount", "1");

    // Save line (second save button)
    await page.locator("button.toolbar-button-save").nth(1).click();
    await page.waitForTimeout(1_000);
    await closeToastIfPresent(page);
    await page.waitForTimeout(1_000);

    // Cancel to go back
    const cancelBtn = page
      .locator("button.toolbar-button-cancel:not([disabled])")
      .locator("visible=true")
      .first();
    await cancelBtn.waitFor({ state: "visible", timeout: 20_000 });
    await cancelBtn.click();

    // ── Spain price list schema ───────────────────────────────────────────────
    await clickNewChildRecord();
    await typeName(page, "spain_pricelist");
    await page.waitForTimeout(1_000);
    await clickSave(page);
    await page.waitForTimeout(1_000);
    await closeToastIfPresent(page);
    await page.waitForTimeout(1_000);

    await clickNewChildRecord();
    await page.waitForTimeout(1_000);
    await fillVisibleByAriaLabel("List Price Discount %", "10");
    await page.waitForTimeout(1_000);
    await clickSave(page);
    await page.waitForTimeout(1_000);
    await closeToastIfPresent(page);
    await page.waitForTimeout(1_000);

    // ── Price List window (base list) ─────────────────────────────────────────
    await navigateByMenuTestId(page, "price", "MenuTitle__132");
    await page.waitForTimeout(1_000);

    await clickNewRecord(page);
    await typeName(page, "Wholesale_pricelist ");
    await clickSave(page);
    await closeToastIfPresent(page);

    // ── Attributes window ─────────────────────────────────────────────────────
    await navigateByMenuTestId(page, "att", "MenuTitle__353");
    await page.waitForTimeout(1_000);

    await clickNewRecord(page);
    await page.waitForTimeout(1_000);
    await typeName(page, "Serial number ");
    await page.waitForTimeout(1_000);

    // Toggle "Serial No." switch
    const serialSwitch = page
      .locator('button[role="switch"][aria-label="Serial No."]')
      .locator("visible=true")
      .first();
    await serialSwitch.waitFor({ state: "visible", timeout: 20_000 });
    await serialSwitch.click();
    await clickSave(page);
    await page.waitForTimeout(1_000);
    await closeToastIfPresent(page);

    // ── Product Categories window ─────────────────────────────────────────────
    await navigateByMenuTestId(page, "produc", "MenuTitle__130");
    await page.waitForTimeout(1_000);

    await clickNewRecord(page);
    await fillVisibleByAriaLabel("Search Key", "Pr_Met");
    await page.waitForTimeout(1_000);
    await typeName(page, "Precious Metals");
    await page.waitForTimeout(1_000);
    await clickSave(page);
    await closeToastIfPresent(page);

    // ── Unit of Measure window ────────────────────────────────────────────────
    await navigateByMenuTestId(page, "unit", "MenuTitle__107");
    await page.waitForTimeout(1_000);

    await clickNewRecord(page);
    await page.waitForTimeout(1_000);
    await fillVisibleByAriaLabel("EDI Code", "Ca");
    await page.waitForTimeout(1_000);
    await fillVisibleByAriaLabel("Symbol", "Ca");
    await page.waitForTimeout(1_000);
    await typeName(page, "Carat");
    await clickSave(page);
    await closeToastIfPresent(page);

    // ── Tax Category window ───────────────────────────────────────────────────
    await navigateByMenuTestId(page, "tax", "MenuTitle__124");
    await page.waitForTimeout(1_000);

    await clickNewRecord(page);
    await page.waitForTimeout(1_000);
    await typeName(page, "VAT 3%");
    await page.waitForTimeout(1_000);
    await page
      .locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"]')
      .first()
      .click();
    await closeToastIfPresent(page);

    // ── Product window ────────────────────────────────────────────────────────
    await navigateByMenuTestId(page, "produ", "MenuTitle__126");
    await page.waitForTimeout(1_000);

    await clickNewRecord(page);
    await page.waitForTimeout(1_000);
    await fillVisibleByAriaLabel("Search Key", "Platinum");
    await page.waitForTimeout(1_000);
    await typeName(page, "Platinum");
    await page.waitForTimeout(1_000);

    await selectAutocomplete("Product Category", "Precious Metals", "Search...");
    await page.waitForTimeout(1_000);
    await selectAutocomplete("UOM", "Carat", "Search options");
    await page.waitForTimeout(1_000);
    await selectAutocomplete("Tax Category", "VAT 3%", "Search options");
    await page.waitForTimeout(1_000);
    await selectAutocomplete("Attribute Set", "Lots", "Search options");
    await page.waitForTimeout(1_000);

    await clickSave(page);
    await closeToastIfPresent(page);
  });
});

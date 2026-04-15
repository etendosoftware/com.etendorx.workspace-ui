import { test } from "@playwright/test";
import {
  loginToEtendo,
  cleanupEtendo,
  selectRoleOrgWarehouse,
  navigateByMenuTestId,
  clickNewRecord,
  closeToastIfPresent,
} from "../../helpers/etendo.helpers";

test.describe("Master Data - Business Partner Setup @smoke", () => {
  test.beforeEach(async ({ page }) => {
    await cleanupEtendo(page);
  });

  test("Create payment terms, invoice schedule and configure customer", async ({ page }) => {
    // ── Local helpers ────────────────────────────────────────────────────────
    const fillByAriaLabel = async (label: string, value: string) => {
      const input = page.locator(`[aria-label="${label}"]`).first();
      await input.waitFor({ state: "visible", timeout: 15_000 });
      await input.clear();
      await input.fill(value);
    };

    const clickByAriaLabel = async (label: string) => {
      await page.locator(`[aria-label="${label}"]`).first().click();
    };

    const clickSaveHeader = async () => {
      await page
        .locator('[data-testid="IconButtonWithText__239556F34FE1496199CC12B1974A07C0"] > span')
        .click();
    };

    // ── Login ────────────────────────────────────────────────────────────────
    await loginToEtendo(page);
    await page.waitForTimeout(500);

    await selectRoleOrgWarehouse(page);

    // ── Payment Terms window ─────────────────────────────────────────────────
    await navigateByMenuTestId(page, "paym", "MenuTitle__127");
    await page.waitForTimeout(500);

    // First payment term: 60d/10
    await clickNewRecord(page);
    await page.waitForTimeout(500);
    await fillByAriaLabel("Search Key", "60d/10");
    await page.waitForTimeout(500);
    await fillByAriaLabel("Name", "60 days");
    await page.waitForTimeout(500);
    await fillByAriaLabel("Offset Month Due", "2");
    await page.waitForTimeout(500);
    await clickByAriaLabel("Overdue Payment Days Rule");
    await page.waitForTimeout(500);
    await clickByAriaLabel("Fixed Due Date");
    await page.waitForTimeout(500);
    await fillByAriaLabel("Maturity Date 1", "10");
    await page.waitForTimeout(500);
    await clickSaveHeader();
    await page.waitForTimeout(500);
    await closeToastIfPresent(page);
    await page.waitForTimeout(500);

    // Close the record view
    await page.locator('[data-testid="CloseIcon__cfc328"]').click();
    await page.waitForTimeout(500);

    // Second payment term: 120d
    await clickNewRecord(page);
    await page.waitForTimeout(500);
    await fillByAriaLabel("Search Key", "120d");
    await page.waitForTimeout(500);
    await fillByAriaLabel("Name", "120 days");
    await page.waitForTimeout(500);
    await fillByAriaLabel("Offset Month Due", "04");
    await page.waitForTimeout(500);
    await clickSaveHeader();
    await page.waitForTimeout(500);
    await closeToastIfPresent(page);
    await page.waitForTimeout(500);

    // ── Invoice Schedule window ──────────────────────────────────────────────
    await navigateByMenuTestId(page, "invoi", "MenuTitle__133");
    await page.waitForTimeout(500);

    await page
      .locator('[data-testid="IconButtonWithText__33864F5267194AB99C14BD0CE9884FF5"]')
      .first()
      .click();
    await page.waitForTimeout(500);

    await fillByAriaLabel("Name", "Schedule Weekly");
    await page.waitForTimeout(500);

    // Invoice Frequency = W (Weekly)
    await page.locator('[aria-label="Invoice Frequency"] > div[tabindex="0"]').click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="OptionItem__W"]').first().click();
    await page.waitForTimeout(500);

    // Day of the Week Cut-off = 1
    await page.locator('[aria-label="Day of the Week Cut-off"] > div[tabindex="0"]').click();
    await page.waitForTimeout(500);
    await page.locator('[data-testid="OptionItem__1"]').first().click();
    await page.waitForTimeout(500);

    await clickSaveHeader();
    await page.waitForTimeout(500);
    await closeToastIfPresent(page);
    await page.waitForTimeout(500);

    // ── Business Partner Category window ─────────────────────────────────────
    await navigateByMenuTestId(page, "busine", "MenuTitle__232");
    await page.waitForTimeout(500);

    await clickNewRecord(page);
    await page.waitForTimeout(500);
    await fillByAriaLabel("Search Key", "WHS");
    await page.waitForTimeout(500);
    await fillByAriaLabel("Name", "Wholesale");
    await page.waitForTimeout(500);
    await clickSaveHeader();
    await page.waitForTimeout(500);
    await closeToastIfPresent(page);
    await page.waitForTimeout(500);

    // ── Business Partner window ──────────────────────────────────────────────
    await navigateByMenuTestId(page, "busi", "MenuTitle__110");
    await page.waitForTimeout(500);

    await clickNewRecord(page);
    await page.waitForTimeout(500);
    await fillByAriaLabel("Search Key", "Golden House");
    await page.waitForTimeout(500);
    await fillByAriaLabel("Commercial Name", "Oragadam Gold House");
    await page.waitForTimeout(500);

    // Business Partner Category — autocomplete with typeahead + Enter
    await page.locator('[aria-label="Business Partner Category"] > div[tabindex="0"]').click();
    await page.waitForTimeout(500);
    const categorySearch = page.locator(".fixed > div.p-2 > .w-full").first();
    await categorySearch.waitFor({ state: "visible", timeout: 10_000 });
    await categorySearch.clear();
    await categorySearch.fill("wholesale");
    await categorySearch.press("Enter");
    await page.waitForTimeout(500);

    await clickSaveHeader();
    await page.waitForTimeout(500);
    await closeToastIfPresent(page);
  });
});

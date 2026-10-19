import { test } from "../../support/fixtures";

/** Toolbar "new" button of the Invoice Schedule window (AD toolbar button key). */
const NEW_BUTTON_KEY = "33864F5267194AB99C14BD0CE9884FF5";

test.describe("Master Data - Business Partner Setup @smoke", () => {
  test("Create payment terms, invoice schedule and configure customer", async ({ app, data, page }) => {
    // Records created by this test get unique keys so it can run on a reused database
    const paymentTermKey = data.uniqueValue("60d/10");
    const paymentTermName = data.uniqueValue("60 days");
    const paymentTermLongKey = data.uniqueValue("120d");
    const paymentTermLongName = data.uniqueValue("120 days");
    const scheduleName = data.uniqueValue("Schedule Weekly");
    const categoryKey = data.uniqueValue("WHS");
    const categoryName = data.uniqueValue("Wholesale");
    const businessPartnerKey = data.uniqueValue("Golden House");

    // ── Payment Terms window ─────────────────────────────────────────────────
    await app.sidebar.navigateTo("paymentTerm");

    // First payment term: 60d/10
    await app.toolbar.newRecord();
    await app.field.fill("Search Key", paymentTermKey);
    await app.field.fill("Name", paymentTermName);
    await app.field.fill("Offset Month Due", "2");
    await page.locator('[aria-label="Overdue Payment Days Rule"]:visible').first().click();
    await page.locator('[aria-label="Fixed Due Date"]:visible').first().click();
    await app.field.fill("Maturity Date 1", "10");
    await app.toolbar.save();
    await app.toast.closeAll();

    // Close the record view
    await app.page.getByTestId("status-bar-container").getByTestId("icon-button").click();

    // Second payment term: 120d
    await app.toolbar.newRecord();
    await app.field.fill("Search Key", paymentTermLongKey);
    await app.field.fill("Name", paymentTermLongName);
    await app.field.fill("Offset Month Due", "04");
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Invoice Schedule window ──────────────────────────────────────────────
    await app.sidebar.navigateTo("invoiceSchedule");
    await page.getByTestId(`IconButtonWithText__${NEW_BUTTON_KEY}`).filter({ visible: true }).first().click();
    await app.field.fill("Name", scheduleName);

    // Invoice Frequency = W (Weekly), Day of the Week Cut-off = 1
    await app.field.selectById("Invoice Frequency", "W");
    await app.field.selectById("Day of the Week Cut-off", "1");

    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Business Partner Category window ─────────────────────────────────────
    await app.sidebar.navigateTo("businessPartnerCategory");
    await app.toolbar.newRecord();
    await app.field.fill("Search Key", categoryKey);
    await app.field.fill("Name", categoryName);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Business Partner window ──────────────────────────────────────────────
    await app.sidebar.navigateTo("businessPartner");
    await app.toolbar.newRecord();
    await app.field.fill("Search Key", businessPartnerKey);
    await app.field.fill("Commercial Name", "Oragadam Gold House");

    // Business Partner Category — typeahead + Enter
    await app.field.selector("Business Partner Category").click();
    const categorySearch = page.locator('input[aria-label="Search options"]:visible').first();
    await categorySearch.waitFor({ state: "visible", timeout: 10_000 });
    await categorySearch.fill(categoryName);
    await categorySearch.press("Enter");

    await app.toolbar.save();
    await app.toast.closeAll();
  });
});

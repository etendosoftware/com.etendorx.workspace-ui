import { expect, test } from "../../support/fixtures";

/** Lot-controlled attribute set of the sample data. */
const LOTS_ATTRIBUTE_SET = "Lots";

test.describe("Master Data - Product and Pricing Setup @smoke", () => {
  test.beforeEach(async ({ page }) => {
    page.on("pageerror", (err) => {
      if (!/Hydration failed/i.test(err.message)) {
        throw err;
      }
    });
  });

  test("Configure price lists, schemas, attributes and create product", async ({ app, data, page }) => {
    test.setTimeout(480_000);
    // Records with a unique key or name get a per-run suffix so the test runs on a reused database
    const priceListName = data.uniqueValue("Wholesale_pricelist");
    const categoryKey = data.uniqueValue("Pr_Met");
    const categoryName = data.uniqueValue("Precious Metals");
    const uomName = data.uniqueValue("Carat");
    const taxCategoryName = data.uniqueValue("VAT 3%");
    const productKey = data.uniqueValue("Platinum");

    // ── Price List Schema window ─────────────────────────────────────────────
    await app.sidebar.navigateTo("priceListSchema");

    // ── Standard price list schema ────────────────────────────────────────────
    await app.toolbar.newRecord();
    await app.field.fill("Name", "standar");
    await app.toolbar.save();
    await app.toast.closeAll();

    // Open Lines subtab
    const linesBtn = page
      .getByRole("button", { name: /^Lines$/ })
      .filter({ visible: true })
      .first();
    await linesBtn.waitFor({ state: "visible", timeout: 20_000 });
    await expect(linesBtn).toBeEnabled();
    await linesBtn.click();

    await app.toolbar.newRecord("child");
    await app.field.fill("Surcharge List Price Amount", "1");

    // Save line
    await app.toolbar.save("child");
    await app.toast.closeAll();

    // Cancel to go back
    const cancelBtn = app.page.locator("button.toolbar-button-cancel:visible:not([disabled])").first();
    await cancelBtn.waitFor({ state: "visible", timeout: 20_000 });
    await cancelBtn.click();

    // ── Spain price list schema ───────────────────────────────────────────────
    await app.toolbar.newRecord("child");
    await app.field.fill("Name", "spain_pricelist");
    await app.toolbar.save();
    await app.toast.closeAll();

    await app.toolbar.newRecord("child");
    await app.field.fill("List Price Discount %", "10");
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Price List window (base list) ─────────────────────────────────────────
    await app.sidebar.navigateTo("priceList");
    await app.toolbar.newRecord();
    await app.field.fill("Name", priceListName);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Attributes window ─────────────────────────────────────────────────────
    await app.sidebar.navigateTo("attributeSet");
    await app.toolbar.newRecord();
    await app.field.fill("Name", "Serial number");

    // Toggle "Serial No." switch
    const serialSwitch = page.getByRole("switch", { name: "Serial No." }).filter({ visible: true }).first();
    await serialSwitch.waitFor({ state: "visible", timeout: 20_000 });
    await serialSwitch.click();
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Product Categories window ─────────────────────────────────────────────
    await app.sidebar.navigateTo("productCategory");
    await app.toolbar.newRecord();
    await app.field.fill("Search Key", categoryKey);
    await app.field.fill("Name", categoryName);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Unit of Measure window ────────────────────────────────────────────────
    await app.sidebar.navigateTo("unitOfMeasure");
    await app.toolbar.newRecord();
    await app.field.fill("EDI Code", "Ca");
    await app.field.fill("Symbol", "Ca");
    await app.field.fill("Name", uomName);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Tax Category window ───────────────────────────────────────────────────
    await app.sidebar.navigateTo("taxCategory");
    await app.toolbar.newRecord();
    await app.field.fill("Name", taxCategoryName);
    await app.toolbar.save();
    await app.toast.closeAll();

    // ── Product window ────────────────────────────────────────────────────────
    await app.sidebar.navigateTo("product");
    await app.toolbar.newRecord();
    await app.field.fill("Search Key", productKey);
    await app.field.fill("Name", productKey);

    await app.field.select("Product Category", categoryName, { search: categoryName });
    await app.field.select("UOM", uomName, { search: uomName });
    await app.field.select("Tax Category", taxCategoryName, { search: taxCategoryName });
    await app.field.select("Attribute Set", LOTS_ATTRIBUTE_SET, { search: LOTS_ATTRIBUTE_SET });

    await app.toolbar.save();
    await app.toast.closeAll();
  });
});

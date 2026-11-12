import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";

const PRODUCT_CATEGORIES = "Product Categories";
/**
 * Grandchild of the product: its display logic reads two fields of the product header,
 * @Ispricerulebased@='Y' & @Prod_Cat_Selection@='N'.
 */
const CATEGORY_PRICE_RULE_VERSION = "Category Price Rule Version";
/** Product categories of the sample service "Warranty". */
const WARRANTY_CATEGORY_COUNT = 3;
const INCLUDED_CATEGORIES = "Included Product Categories";
/** Values of "Included Product Categories" (AD_Ref_List): the option test id carries the list value. */
const SELECTION = {
  ONLY_DEFINED: { value: "N", name: "Only those defined" },
  ALL_EXCLUDING_DEFINED: { value: "Y", name: "All excluding defined" },
} as const;

/** Picks a value of "Included Product Categories" with the keyboard: the search box overlaps the options. */
function setIncludedCategories(app: App, selection: (typeof SELECTION)[keyof typeof SELECTION]): Promise<void> {
  return app.field.pickWithKeyboard(INCLUDED_CATEGORIES, selection.value, { search: selection.name });
}

/**
 * Tab display logic evaluated with the values of every ancestor: with a product category selected,
 * "Category Price Rule Version" follows the unsaved "Included Product Categories" of the product
 * header, two levels above it. The sample product "Warranty" is price rule based and is never saved.
 */
test.describe("Form - tab display logic with the values of the grandparent @smoke @form", () => {
  test("shows a grandchild tab as the header field it depends on changes", async ({ app, data }) => {
    const product = data.PRODUCT.WARRANTY.name;
    await app.sidebar.navigateTo("product");
    await app.grid.filter("Name", product);
    await app.grid.openForm(product);
    await app.tabs.open(PRODUCT_CATEGORIES);
    // The sample categories have no search key, name or description to find them by; any of them works
    // (read-only, and they all belong to "Warranty")
    const categories = app.grid.rows();
    await expect(categories).toHaveCount(WARRANTY_CATEGORY_COUNT);
    await app.grid.setRowSelected(categories.first(), true);

    // "Warranty" includes all categories excluding the defined ones
    await expect(app.tabs.tab(CATEGORY_PRICE_RULE_VERSION)).toBeHidden();

    await setIncludedCategories(app, SELECTION.ONLY_DEFINED);
    await expect(app.tabs.tab(CATEGORY_PRICE_RULE_VERSION)).toBeVisible();

    await setIncludedCategories(app, SELECTION.ALL_EXCLUDING_DEFINED);
    await expect(app.tabs.tab(CATEGORY_PRICE_RULE_VERSION)).toBeHidden();
  });
});

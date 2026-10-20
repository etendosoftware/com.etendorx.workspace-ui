import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";

const PRODUCT_TYPE = "Product Type";
const BOM_FIELD = "Bill of Materials";
const BOM_TAB = "Bill of Materials";
/** Property names (`hqlName`) of the fields whose display logic depends on other fields. */
const STOCKED = "stocked";
const BILL_OF_MATERIALS = "billOfMaterials";
const LINKED_TO_PRODUCT = "linkedToProduct";
const TAX_CATEGORY = "taxCategory";
/** Product types (AD_Ref_List): the option test id carries the list value. */
const TYPE = {
  ITEM: { value: "I", name: "Item" },
  SERVICE: { value: "S", name: "Service" },
  EXPENSE: { value: "E", name: "Expense type" },
} as const;

/** Picks a product type with the keyboard: the search box of the list overlaps its options. */
function setProductType(app: App, type: (typeof TYPE)[keyof typeof TYPE]): Promise<void> {
  return app.field.pickWithKeyboard(PRODUCT_TYPE, type.value, { search: type.name });
}

/**
 * Display logic re-evaluated on every change of the fields it reads, without saving: the
 * Product header shows "Stocked" only for items, "Bill of Materials" for items and services,
 * "Linked To Product" only for services, "Tax Category" only when the product is sold or
 * purchased, and the "Bill of Materials" child tab only while the product is a BOM. The record
 * (a sample product) is never saved.
 */
test.describe("Form - display logic and tab display logic after a field change @smoke @form", () => {
  test("shows and hides fields and a child tab as the fields they depend on change", async ({ app, data }) => {
    const product = data.PRODUCT.RAW_MATERIAL_A.name;
    await app.sidebar.navigateTo("product");
    await app.grid.filter("Name", product);
    await app.grid.openForm(product);

    await setProductType(app, TYPE.ITEM);
    await expect(app.field.byName(STOCKED)).toBeVisible();
    await expect(app.field.byName(BILL_OF_MATERIALS)).toBeVisible();
    await expect(app.field.byName(LINKED_TO_PRODUCT)).toBeHidden();

    await setProductType(app, TYPE.SERVICE);
    await expect(app.field.byName(STOCKED)).toBeHidden();
    await expect(app.field.byName(BILL_OF_MATERIALS)).toBeVisible();
    await expect(app.field.byName(LINKED_TO_PRODUCT)).toBeVisible();

    await setProductType(app, TYPE.EXPENSE);
    await expect(app.field.byName(BILL_OF_MATERIALS)).toBeHidden();
    await expect(app.field.byName(LINKED_TO_PRODUCT)).toBeHidden();

    await setProductType(app, TYPE.ITEM);
    await expect(app.field.byName(STOCKED)).toBeVisible();

    // "Tax Category": (@IsSold@='Y' | @IsPurchased@='Y')
    await app.field.setSwitch("Sale", false);
    await app.field.setSwitch("Purchase", false);
    await expect(app.field.byName(TAX_CATEGORY)).toBeHidden();
    await app.field.setSwitch("Sale", true);
    await expect(app.field.byName(TAX_CATEGORY)).toBeVisible();

    // Child tab display logic reads the unsaved value of the header: @IsBOM@='Y'
    await expect(app.tabs.tab(BOM_TAB)).toBeHidden();
    await app.field.setSwitch(BOM_FIELD, true);
    await expect(app.tabs.tab(BOM_TAB)).toBeVisible();
    await app.field.setSwitch(BOM_FIELD, false);
    await expect(app.tabs.tab(BOM_TAB)).toBeHidden();
  });
});

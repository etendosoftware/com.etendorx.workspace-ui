import { expect, test } from "../../support/fixtures";

const DESCRIPTION = "Round trip\nsecond line";
const STARTING_DATE = "03/15/2026";
const ENDING_DATE = "04/30/2026";
/** List option "Only those defined" (value N); the default is "All excluding defined". */
const BP_CATEGORIES_ONLY_DEFINED = { value: "N", name: "Only those defined" };
/** Numbers as typed and as the input shows them back (a price keeps two decimals, no grouping). */
const PRIORITY = { typed: "7", shown: "7" };
const DISCOUNT_PERCENT = { typed: "12.5", shown: "12.5" };
const DISCOUNT_AMOUNT = { typed: "1234.5", shown: "1234.50" };
const MIN_QUANTITY = { typed: "2", shown: "2" };

/**
 * Save → reload round trip: a discount is created with a non-default value in a field of each
 * type its header has (string, text, two dates, integer, yes/no, list, table, number, price and
 * quantity), saved, and the page is reloaded; the form recovered from the URL must show the
 * saved values, not the defaults. No window of the bare core with a creatable record has
 * DateTime, Multi Selector or Search fields, so they are not covered here.
 */
test.describe("Form - save and reload round trip of field types @smoke @form", () => {
  test("shows the saved value of every field type after a reload", async ({ app, data, page }) => {
    const name = data.uniqueValue("FRMc");
    const type = data.OFFER_TYPE.PRICE_ADJUSTMENT;
    const description = app.field.byName("description").locator("textarea");

    await app.sidebar.navigateTo("discountsAndPromotions");
    await app.toolbar.newRecord();
    await app.field.selectById("Discount/Promotion Type", type.id, { search: type.name });
    await app.field.fill("Name", name);
    await description.fill(DESCRIPTION);
    await app.field.fill("Starting Date", STARTING_DATE);
    await app.field.fill("Ending Date", ENDING_DATE);
    await app.field.fill("Priority", PRIORITY.typed);
    await app.field.setSwitch("Apply Next Discount/Promotion", false);
    await app.field.pickWithKeyboard("Included BP Categories", BP_CATEGORIES_ONLY_DEFINED.value, {
      search: BP_CATEGORIES_ONLY_DEFINED.name,
    });
    await app.field.fill("Discount %", DISCOUNT_PERCENT.typed);
    await app.field.fill("Discount Amount", DISCOUNT_AMOUNT.typed);
    await app.field.fill("Min. Quantity", MIN_QUANTITY.typed);
    await app.toolbar.save();
    await app.toast.closeAll();

    await page.reload();
    await app.breadcrumb.waitFor(name);

    await app.field.expectToContain("Discount/Promotion Type", type.name);
    await expect(app.field.input("Name")).toHaveValue(name);
    await expect(description).toHaveValue(DESCRIPTION);
    await expect(app.field.input("Starting Date")).toHaveValue(STARTING_DATE);
    await expect(app.field.input("Ending Date")).toHaveValue(ENDING_DATE);
    await expect(app.field.input("Priority")).toHaveValue(PRIORITY.shown);
    await expect(app.field.switch("Apply Next Discount/Promotion")).toHaveAttribute("aria-checked", "false");
    await app.field.expectToContain("Included BP Categories", BP_CATEGORIES_ONLY_DEFINED.name);
    await expect(app.field.input("Discount %")).toHaveValue(DISCOUNT_PERCENT.shown);
    await expect(app.field.input("Discount Amount")).toHaveValue(DISCOUNT_AMOUNT.shown);
    await expect(app.field.input("Min. Quantity")).toHaveValue(MIN_QUANTITY.shown);
  });
});

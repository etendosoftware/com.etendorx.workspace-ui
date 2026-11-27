import { expect, test } from "../../support/fixtures";
import {
  characteristicDescriptionOf,
  createCharacteristics,
  createProductsWithCharacteristics,
  emptyCharacteristicsDataSet,
  removeCharacteristicsDataSet,
} from "../../support/flows/characteristics";
import { recordLink } from "../../support/flows/navigation";
import { addUserPreference, removePreferences, setWindowPreferences } from "../../support/flows/preferences";
import type { SavedRecord } from "../../support/api/ApiData";
import { TABS, WINDOW_IDS } from "../../support/registry/windows";
import { runAndCaptureGridFetch } from "../../support/wait";

const NAME = "Name";
const PRICE = "Price";
const ACCOUNTING = "Accounting";
const TRANSLATION = "Translation";
const NO = "N";
/** Element of the sample chart of accounts, with more than a thousand accounts. */
const MAIN_ACCOUNT = "Main Account";
const ELEMENT_VALUE = "Element Value";
const SEARCH_KEY = "Search Key";
const BROAD_FILTER = "1";
const PRECISE_FILTER = "57001";
/** What an empty grid shows instead of its rows. */
const EMPTY_GRID_TEXT = "No records to show";
/** `TreeDatasourceFetchLimit` as the core ships it (System level). */
const CORE_TREE_FETCH_LIMIT = 200;
/** Start of `OBUIAPP_TooManyNodes`. */
const TOO_MANY_NODES_TEXT = "This query criteria returns a number of nodes larger than the established limit";
/** Grouped characteristic value and its group, for `ShowProductCharacteristicsParents`. */
const BOTTLE = "Botella";
const GLASS = "Vidrio";
const SIZE_330 = "330 ml";

const preferences: SavedRecord[] = [];
const characteristics = emptyCharacteristicsDataSet();

// Removed while the page is still open, also when the test failed or timed out
test.afterEach(async ({ api }) => {
  await removePreferences(api, preferences);
  await removeCharacteristicsDataSet(api, characteristics);
});

// PREFa is split in three files so its parts run side by side instead of being the last spec of
// suite-05-regression (ETP-6295): ...ProductPreferences (Product window and tree), ...ReadOnlyTabPreferences
// (Goods Transaction window) and ...SessionPreferences (login, logout and filter messages). Each file changes
// preferences that only its own tests read.
/**
 * Classic interface preferences applied by the new UI (ETP-6356), on the Product window and the account tree.
 * Window preferences are created for the user of the suite and a window no other regression spec reads.
 */
test.describe("Session - Classic interface preferences of the Product window and the tree @regression @session", () => {
  test("hides accounting and translation tabs with ShowAcct and ShowTrl set to No", async ({ app, api, data }) => {
    const laptop = data.PRODUCT.LAPTOP.name;
    /** Selects the product in the grid, which shows its child tabs under it. */
    const showProductTabs = async () => {
      await app.sidebar.navigateTo("product");
      await app.grid.filter(NAME, laptop);
      await app.grid.setRowSelected(app.grid.rowWithCell(laptop), true);
      await expect(app.tabs.tab(PRICE), "the child tabs of the product were not shown").toBeVisible();
    };

    // The admin user ships with both preferences set to Yes
    await showProductTabs();
    await expect(app.tabs.tab(ACCOUNTING)).toBeVisible();
    await expect(app.tabs.tab(TRANSLATION)).toBeVisible();

    await setWindowPreferences(app, api, preferences, WINDOW_IDS.PRODUCT, [
      { name: "ShowAcct", value: NO, propertyList: false },
      { name: "ShowTrl", value: NO, propertyList: false },
    ]);
    await showProductTabs();
    await expect(app.tabs.tab(ACCOUNTING)).toHaveCount(0);
    await expect(app.tabs.tab(TRANSLATION)).toHaveCount(0);
  });

  test("shows each product characteristic with its parents by ShowProductCharacteristicsParents", async ({
    api,
    app,
    data,
    page,
  }) => {
    const prefix = data.uniqueValue("PREFa");
    const packaging = `${prefix} Envase`;
    const size = `${prefix} Formato`;
    await createCharacteristics(api, characteristics, [
      { name: packaging, values: [{ name: BOTTLE, values: [{ name: GLASS }] }] },
      { name: size, values: [{ name: SIZE_330 }] },
    ]);
    const product = `${prefix} Zumo`;
    await createProductsWithCharacteristics(api, characteristics, [{ name: product, values: [GLASS, SIZE_330] }]);
    const productId = characteristics.products.get(product) ?? "";
    // The server builds the description a few seconds later; the form lists the characteristics only with it
    await expect.poll(() => characteristicDescriptionOf(api, productId)).not.toBe("");
    const field = page.getByTestId(`ProductCharacteristics__${data.FIELD.PRODUCT_CHARACTERISTIC_DESCRIPTION}`);
    const openProduct = async () => {
      await page.goto(recordLink(WINDOW_IDS.PRODUCT, TABS.PRODUCT_HEADER, productId));
      await expect(app.formSections.main).toBeVisible();
      await expect(field).toBeVisible();
    };

    // One line per characteristic, without parents by default
    await openProduct();
    await expect(field.getByText(packaging, { exact: true })).toBeVisible();
    await expect(field.getByText(GLASS, { exact: true })).toBeVisible();
    await expect(field.getByText(SIZE_330, { exact: true })).toBeVisible();

    // Read by the server on every form load, for every window: no new session is needed
    preferences.push(
      await addUserPreference(api, { name: "ShowProductCharacteristicsParents", value: "1", propertyList: true })
    );
    await openProduct();
    await expect(field.getByText(`${BOTTLE} / ${GLASS}`, { exact: true })).toBeVisible();
    await expect(field.getByText(SIZE_330, { exact: true })).toBeVisible();
  });

  test("refuses a tree filter that matches more nodes than TreeDatasourceFetchLimit", async ({ app, page }) => {
    const tab = page.getByTestId(`Tab__${TABS.ACCOUNT_TREE_ELEMENT_VALUE}`);
    await app.sidebar.navigateTo("accountTree");
    await app.grid.selectRow(MAIN_ACCOUNT);
    await app.tabs.open(ELEMENT_VALUE);
    await app.toolbar.inTab(TABS.ACCOUNT_TREE_ELEMENT_VALUE).button("toggle-tree-view").click();

    // The core ships the limit at 200 nodes: hundreds of accounts of the element contain a 1
    const tooMany = await runAndCaptureGridFetch(page, TABS.ACCOUNT_TREE_ELEMENT_VALUE, () =>
      app.grid.filter(SEARCH_KEY, BROAD_FILTER, tab)
    );
    expect(tooMany._endRow).toBe(String(CORE_TREE_FETCH_LIMIT));
    await app.toast.expectError(TOO_MANY_NODES_TEXT);
    await expect(tab.getByText(EMPTY_GRID_TEXT)).toBeVisible();
    await expect(app.grid.filterInput(SEARCH_KEY, tab)).toHaveValue(BROAD_FILTER);

    // A filter that matches a few accounts shows them in the tree
    await app.grid.filter(SEARCH_KEY, PRECISE_FILTER, tab);
    await expect(tab.getByText(EMPTY_GRID_TEXT)).toHaveCount(0);
    await expect(app.grid.rows(tab).first()).toBeVisible();
  });
});

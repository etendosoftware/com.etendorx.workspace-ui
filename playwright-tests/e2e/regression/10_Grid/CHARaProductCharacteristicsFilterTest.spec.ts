import type { ApiData } from "../../support/api/ApiData";
import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import {
  type CharacteristicSpec,
  createCharacteristics,
  createProductsWithCharacteristics,
  emptyCharacteristicsDataSet,
  type ProductSpec,
  removeCharacteristicsDataSet,
} from "../../support/flows/characteristics";
import { overrideField } from "../../support/processOverrides";
import { FIELD } from "../../support/registry/data";
import { TABS, WINDOW_IDS } from "../../support/registry/windows";
import { datasourceCriteria } from "../../support/wait";

const NAME = "Name";
const EMPTY_GRID_TEXT = "No records to show";
/** Placeholder of the tree filters of window grids. */
const PLACEHOLDER = "Select options...";
const PRODUCT_TAB = TABS.PRODUCT_HEADER;

// Values (names are unique in the data set)
const ML_500 = "500 ml";
const ML_330 = "330 ml";
const LITRE = "1 L";
const LATA = "Lata";
const BOTELLA = "Botella";
const VIDRIO = "Vidrio";
const PET = "PET";
const RETORNABLE = "Retornable";
const VIDRIO_RETORNABLE = "Vidrio retornable";
const VEGANO = "Vegano";
const BIO = "Bio";
const SIN_AZUCAR = "Sin azúcar";

// Products
const ZUMO = "Zumo";
const AGUA = "Agua";
const COLA = "Cola";
const CERVEZA = "Cerveza";
const LECHE = "Leche";
const TONICA = "Tónica";
const PAN = "Pan";
const ALL_PRODUCTS = [ZUMO, AGUA, COLA, CERVEZA, LECHE, TONICA, PAN];

/**
 * Characteristics created in an order that is not the alphabetical one, with a group (Botella) holding values
 * and an inner group (Retornable), next to a value without group (Lata).
 */
const characteristicsOf = (prefix: string): CharacteristicSpec[] => [
  { name: `${prefix} Formato`, values: [{ name: ML_500 }, { name: ML_330 }, { name: LITRE }] },
  {
    name: `${prefix} Envase`,
    values: [
      { name: LATA },
      {
        name: BOTELLA,
        values: [{ name: VIDRIO }, { name: PET }, { name: RETORNABLE, values: [{ name: VIDRIO_RETORNABLE }] }],
      },
    ],
  },
  { name: `${prefix} Certificación`, values: [{ name: VEGANO }, { name: BIO }, { name: SIN_AZUCAR }] },
];

/** Products with several values of one characteristic, values of several characteristics and none (Pan). */
const productsOf = (prefix: string): ProductSpec[] =>
  [
    { name: ZUMO, values: [VIDRIO, ML_330, BIO] },
    { name: AGUA, values: [PET, ML_500, BIO, VEGANO] },
    { name: COLA, values: [LATA, ML_330, SIN_AZUCAR] },
    { name: CERVEZA, values: [LATA, ML_500] },
    { name: LECHE, values: [VIDRIO_RETORNABLE, LITRE, VEGANO] },
    { name: TONICA, values: [PET, ML_330] },
    { name: PAN, values: [] },
  ].map((product) => ({ ...product, name: `${prefix} ${product.name}` }));

const dataSet = emptyCharacteristicsDataSet();

// Removed while the page is still open, also when the test failed or timed out
test.afterEach(async ({ api }) => {
  await removeCharacteristicsDataSet(api, dataSet);
});

/**
 * Product characteristics filter (ETP-6330), as Classic: groups select all their values, the tree is sorted,
 * values of one characteristic are combined with OR and characteristics with AND. The spec creates its own
 * characteristics and products (the core has none) and filters the Product grid by their unique prefix.
 */
test.describe("Grid - Product characteristics filter @regression @grid", () => {
  /** Creates the data set, opens Product and shows only the products of the spec. */
  async function openProducts(app: App, api: ApiData, prefix: string): Promise<void> {
    // The Product grid hides the column by default: shown first for this page only, without storing a grid
    // configuration of the user (other specs of the same user rearrange Product grids meanwhile)
    const override = await overrideField(app.page, WINDOW_IDS.PRODUCT, FIELD.PRODUCT_CHARACTERISTIC_DESCRIPTION, {
      showInGridView: true,
      gridPosition: 0,
    });
    await createCharacteristics(api, dataSet, characteristicsOf(prefix));
    await createProductsWithCharacteristics(api, dataSet, productsOf(prefix));
    // The menu can have prefetched the metadata of Product before the override: load the page again
    await app.page.reload();
    await app.sidebar.navigateTo("product");
    await app.grid.filter(NAME, prefix);
    await expect.poll(() => override.applied, "the window metadata was not overridden").toBeGreaterThan(0);
  }

  /** Checks the grid shows exactly the given products of the spec. */
  async function expectProducts(app: App, prefix: string, products: string[]): Promise<void> {
    if (products.length === 0) {
      // The empty grid of the Product tab, not of a child tab opened under a selected row
      await expect(app.page.getByTestId(`Tab__${PRODUCT_TAB}`).getByText(EMPTY_GRID_TEXT).first()).toBeVisible();
      return;
    }
    await expect(app.grid.rows().filter({ hasText: prefix })).toHaveCount(products.length);
    for (const product of products) {
      await expect(app.grid.rowWithCell(`${prefix} ${product}`)).toBeVisible();
    }
  }

  test("sorts the tree and selects groups with their values", async ({ app, api, data }) => {
    const prefix = data.uniqueValue("CHARa");
    await openProducts(app, api, prefix);
    const filter = app.characteristicsFilter;

    await filter.open();
    // Alphabetical on each level, whatever the creation order
    await expect(filter.nodes).toHaveText([
      `${prefix} Certificación`,
      BIO,
      SIN_AZUCAR,
      VEGANO,
      `${prefix} Envase`,
      BOTELLA,
      PET,
      RETORNABLE,
      VIDRIO_RETORNABLE,
      VIDRIO,
      LATA,
      `${prefix} Formato`,
      LITRE,
      ML_330,
      ML_500,
    ]);

    // A group checks its values and those of its inner groups, and filters by all of them
    await filter.toggle(BOTELLA);
    for (const value of [BOTELLA, PET, RETORNABLE, VIDRIO_RETORNABLE, VIDRIO]) {
      await expect(filter.checkbox(value)).toBeChecked();
    }
    await expectProducts(app, prefix, [ZUMO, AGUA, LECHE, TONICA]);
    await expect(filter.cell).toHaveText(`${prefix} Envase:[${PET} - ${RETORNABLE} - ${VIDRIO}]`);

    // Unchecking it clears them
    await filter.toggle(BOTELLA);
    await expect(filter.checkbox(VIDRIO)).not.toBeChecked();
    await expectProducts(app, prefix, ALL_PRODUCTS);

    // Only some values of a group: the group and the characteristic are partially checked
    await filter.toggle(VIDRIO);
    await expect(filter.checkbox(BOTELLA)).toHaveAttribute("data-indeterminate", "true");
    await expect(filter.checkbox(`${prefix} Envase`)).toHaveAttribute("data-indeterminate", "true");
    await expectProducts(app, prefix, [ZUMO]);

    await filter.clear();
    await expect(filter.cell).toHaveText(PLACEHOLDER);
    await expectProducts(app, prefix, ALL_PRODUCTS);
  });

  test("combines values with OR in a characteristic and characteristics with AND", async ({ app, api, data }) => {
    const prefix = data.uniqueValue("CHARa");
    await openProducts(app, api, prefix);
    const filter = app.characteristicsFilter;
    await filter.open();

    // Two characteristics: only the products with both, as one exists criterion per characteristic. The first
    // value waits for its own request too: on a slow machine it arrived after the second click and was taken
    // for the request of both values
    await filter.toggleAndCapture(PRODUCT_TAB, BIO);
    const request = await filter.toggleAndCapture(PRODUCT_TAB, ML_330);
    const characteristicsCriteria = datasourceCriteria(request).find(
      (criterion) => (criterion as { isProductCharacteristicsCriteria?: boolean }).isProductCharacteristicsCriteria
    ) as { operator?: string; criteria?: unknown[] } | undefined;
    expect(characteristicsCriteria?.operator).toBe("and");
    expect(characteristicsCriteria?.criteria).toHaveLength(2);
    await expectProducts(app, prefix, [ZUMO]);
    await expect(filter.cell).toHaveText(`${prefix} Certificación:[${BIO}], ${prefix} Formato:[${ML_330}]`);

    // Two values of one characteristic: either of them
    await filter.toggle(ML_330);
    await filter.toggle(VEGANO);
    await expectProducts(app, prefix, [ZUMO, AGUA, LECHE]);

    // Several values of one characteristic and one of another: OR inside, AND between
    await filter.toggle(ML_500);
    await expectProducts(app, prefix, [AGUA]);

    // Three characteristics at the same time
    await filter.clear();
    await filter.open();
    for (const value of [LATA, ML_330, SIN_AZUCAR]) {
      await filter.toggle(value);
    }
    await expectProducts(app, prefix, [COLA]);

    // A selection no product matches: an empty grid, without errors
    await filter.toggle(SIN_AZUCAR);
    await filter.toggle(ML_330);
    await filter.toggle(LITRE);
    await expectProducts(app, prefix, []);

    // Together with the filter of another column, both apply
    await filter.toggle(LITRE);
    await filter.toggle(LATA);
    await filter.toggle(PET);
    await filter.close();
    await expectProducts(app, prefix, [AGUA, TONICA]);
    await app.grid.filter(NAME, `${prefix} ${TONICA}`);
    await expectProducts(app, prefix, [TONICA]);

    // Clearing the characteristics filter brings back the products of the other filter
    await filter.clear();
    await expectProducts(app, prefix, [TONICA]);
  });
});

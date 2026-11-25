import { expect, test } from "../../support/fixtures";
import { TABS, WINDOW_IDS } from "../../support/registry/windows";
import { collectGridFetches, type DatasourceRequestParams } from "../../support/wait";

const NAME = "Name";
const SYMBOL = "Symbol";
const KILOGRAM = "Kilogram";
const CENTIMETER = "Centimeter";
const ISO_CODE = "ISO Code";
const EURO = "EUR";
const CONVERSION_RATES = "Conversion Rates";
const SORT_BY = "_sortBy";
/** A descending manual sort, as the grid sends it (`-<property>`). */
const DESCENDING_SORT = /^-/;
/** Param only the requests of the tree view carry. */
const TREE_PARAM = "referencedTableId";
/** Default views of the window, requested once when it opens. */
const WINDOW_DEFAULT_VIEWS = /\/api\/meta\/saved-views\?window=/;

/** Tabs whose saved views and stored columns the tests create: none of them is opened by another regression spec. */
const TABS_WITH_VIEWS = [
  [WINDOW_IDS.UNIT_OF_MEASURE, TABS.UNIT_OF_MEASURE],
  [WINDOW_IDS.CURRENCY, TABS.CURRENCY_CONVERSION_RATES],
  [WINDOW_IDS.ORGANIZATION, TABS.ORGANIZATION],
] as const;

/** Grid state of a saved view, as the UI stores it; the columns left out keep their metadata defaults. */
const gridState = (state: Record<string, unknown>) => ({
  version: 1,
  source: "workspace-ui",
  filters: [],
  visibility: {},
  sorting: [],
  order: [],
  implicitFilterApplied: false,
  ...state,
});

const KILOGRAM_SORTED_BY_NAME = gridState({
  filters: [{ id: NAME, value: KILOGRAM }],
  sorting: [{ id: NAME, desc: true }],
});

const VIEW_NAME = "GRDl";

/** Waits for the grid to ask for the records sorted as stored: a load sent before it would also be counted. */
const waitForSortedFetch = (fetches: DatasourceRequestParams[]) =>
  expect.poll(() => fetches.some((params) => DESCENDING_SORT.test(String(params[SORT_BY] ?? "")))).toBe(true);

const sentFilter = (params: DatasourceRequestParams, value: string) =>
  JSON.stringify(params.criteria ?? []).includes(value);

let savedViewIds: string[] = [];

test.beforeEach(({ api }) => api.resetGridConfigurations(TABS_WITH_VIEWS));

// Removed while the page is still open, also when the test failed or timed out
test.afterEach(async ({ app, api }) => {
  for (const id of savedViewIds) {
    await app.savedViews.remove(id);
  }
  savedViewIds = [];
  await api.resetGridConfigurations(TABS_WITH_VIEWS);
});

/**
 * The default saved view of a tab, or else the columns the user stored, applies on the first load of its grid
 * (ETP-6313): the window asks for them when it opens and each grid waits for them, so it loads once and never
 * shows the records outside the view, as classic. The views are personal views of the test user, created
 * through the API and deleted after each test. The windows are opened by no other regression spec, except
 * Currency, whose header GRDc changes: the view here is on its Conversion Rates child tab.
 */
test.describe("Grid - default view on the first load @regression @grid", () => {
  test("loads once, already filtered and sorted by the default view", async ({ app, data, page }) => {
    savedViewIds.push(
      await app.savedViews.addDefault(TABS.UNIT_OF_MEASURE, data.uniqueValue(VIEW_NAME), KILOGRAM_SORTED_BY_NAME)
    );
    const fetches = collectGridFetches(page, TABS.UNIT_OF_MEASURE);

    await app.sidebar.navigateTo("unitOfMeasure");

    await expect(app.grid.rowWithCell(KILOGRAM)).toBeVisible();
    await expect(app.grid.rows()).toHaveCount(1);
    expect(fetches, "the grid loaded more than once").toHaveLength(1);
    expect(sentFilter(fetches[0], KILOGRAM), "the first load did not carry the filter of the view").toBe(true);
    expect(fetches[0][SORT_BY]).toMatch(DESCENDING_SORT);
    await expect(app.grid.filterInput(NAME)).toHaveValue(KILOGRAM);
  });

  test("opens a default view in tree mode directly as a tree", async ({ app, data, page }) => {
    savedViewIds.push(
      await app.savedViews.addDefault(TABS.ORGANIZATION, data.uniqueValue(VIEW_NAME), gridState({ treeView: true }))
    );
    const fetches = collectGridFetches(page, TABS.ORGANIZATION);

    await app.sidebar.navigateTo("organization");

    await expect.poll(() => fetches.some((params) => TREE_PARAM in params)).toBe(true);
    await expect(app.grid.rows().first()).toBeVisible();
    expect(fetches, "the grid loaded flat before loading the tree").toHaveLength(1);
  });

  test("loads once with the stored column sort when the tab has no default view", async ({ api, app, page }) => {
    await api.setGridConfiguration(WINDOW_IDS.UNIT_OF_MEASURE, TABS.UNIT_OF_MEASURE, {
      version: 1,
      visibility: {},
      order: [],
      sorting: [{ id: NAME, desc: true }],
    });
    const fetches = collectGridFetches(page, TABS.UNIT_OF_MEASURE);

    await app.sidebar.navigateTo("unitOfMeasure");

    await waitForSortedFetch(fetches);
    await expect(app.grid.rows().first()).toBeVisible();
    expect(fetches, "the grid loaded more than once").toHaveLength(1);
    expect(fetches[0][SORT_BY]).toMatch(DESCENDING_SORT);
  });

  test("loads on mount and keeps the stored columns when they do not sort the grid", async ({ api, app, page }) => {
    await api.setGridConfiguration(WINDOW_IDS.UNIT_OF_MEASURE, TABS.UNIT_OF_MEASURE, {
      version: 1,
      visibility: { [SYMBOL]: false },
      order: [],
    });
    const fetches = collectGridFetches(page, TABS.UNIT_OF_MEASURE);

    await app.sidebar.navigateTo("unitOfMeasure");

    await expect(app.grid.rowWithCell(CENTIMETER)).toBeVisible();
    // Hiding a column does not change the request: the grid loads without waiting for it, and only once
    await expect(app.grid.columnHeader(SYMBOL)).toBeHidden();
    await expect(app.grid.columnHeader(NAME)).toBeVisible();
    expect(fetches, "the grid loaded again when the stored columns were applied").toHaveLength(1);
  });

  test("loads without the default view when it cannot be read", async ({ app, data, page }) => {
    savedViewIds.push(
      await app.savedViews.addDefault(TABS.UNIT_OF_MEASURE, data.uniqueValue(VIEW_NAME), KILOGRAM_SORTED_BY_NAME)
    );
    await page.route(WINDOW_DEFAULT_VIEWS, (route) => route.fulfill({ status: 500, body: "{}" }));
    const fetches = collectGridFetches(page, TABS.UNIT_OF_MEASURE);

    await app.sidebar.navigateTo("unitOfMeasure");

    // Every unit of measure, not only the one of the view
    await expect(app.grid.rowWithCell(CENTIMETER)).toBeVisible();
    expect(fetches).toHaveLength(1);
    expect(sentFilter(fetches[0], KILOGRAM)).toBe(false);
  });

  test("loads a child tab once, already sorted by its default view", async ({ app, data, page }) => {
    savedViewIds.push(
      await app.savedViews.addDefault(
        TABS.CURRENCY_CONVERSION_RATES,
        data.uniqueValue(VIEW_NAME),
        gridState({ sorting: [{ id: "Valid From Date", desc: true }] })
      )
    );
    await app.sidebar.navigateTo("currency");
    await app.grid.filter(ISO_CODE, EURO);
    const fetches = collectGridFetches(page, TABS.CURRENCY_CONVERSION_RATES);

    await app.grid.setRowSelected(app.grid.rowWithCell(EURO), true);
    await app.tabs.open(CONVERSION_RATES);

    await waitForSortedFetch(fetches);
    const rates = page.getByTestId(`Tab__${TABS.CURRENCY_CONVERSION_RATES}`);
    await expect(app.grid.rows(rates).first()).toBeVisible();
    expect(fetches, "the child tab loaded more than once").toHaveLength(1);
    expect(fetches[0][SORT_BY]).toMatch(DESCENDING_SORT);
  });
});

import { expect, test } from "../../support/fixtures";
import { DATASOURCE } from "../../support/registry/datasources";
import { TABS } from "../../support/registry/windows";
import {
  type FetchedPage,
  collectFieldOptionPages,
  collectGridFetchedIds,
  runAndWaitForFieldOptions,
} from "../../support/wait";

/**
 * A read of every country with the rules of the window grid, which shows the inactive ones too: more rows than
 * the core reference data has.
 */
const ALL_COUNTRIES = { limit: 1000, includeInactive: true };
/** Pages the grid needs at most to load every country (243 with the default page size of 100). */
const MAX_PAGES = 5;
/** Countries whose name contains it (Australia, Austria): one page, so the count is exact. */
const NAME_FILTER = "Austr";
/** Property of the Country dropdown of a financial account, as its option requests name it (`initiatorField`). */
const COUNTRY_PROPERTY = "country";

/** Row each page of options started at: the next page must start right after the rows already loaded. */
const startRows = (pages: FetchedPage[]) => pages.map((fetched) => Number(fetched.params._startRow));
const loadedIds = (pages: FetchedPage[]) => pages.flatMap((fetched) => fetched.ids);
const loadedBefore = (pages: FetchedPage[]) =>
  pages.map((_, index) => pages.slice(0, index).reduce((rows, fetched) => rows + fetched.rows, 0));

/**
 * Grid paging and record count (ETP-6303): scrolling loads every record once, each page starting right after
 * the last loaded row as in Classic, and the count never shows the loaded rows as the total: "101+" while more
 * records exist, the exact number once every record is loaded or a filter leaves one page. Read-only, on the
 * countries of the core reference data.
 */
test.describe("Grid - paging without repeated records and record count @regression @grid", () => {
  test("loads every country once and counts them as the rule says", async ({ app, api, page }) => {
    const total = (await api.fetch(DATASOURCE.COUNTRY, { criteria: [], ...ALL_COUNTRIES })).length;
    const fetched = collectGridFetchedIds(page, TABS.COUNTRY);

    await app.sidebar.navigateTo("countryAndRegion");
    const firstPage = await app.grid.shownCount();
    expect(firstPage.hasMore, "the count of the first page passes for the total").toBe(true);
    expect(firstPage.count).toBeLessThan(total);

    await app.grid.scrollToEndUntilLoaded(MAX_PAGES);

    const ids = await fetched.ids();
    expect(ids.length - new Set(ids).size, "records loaded more than once").toBe(0);
    expect(ids).toHaveLength(total);
    expect(await app.grid.shownCount()).toEqual({ count: total, hasMore: false });
  });

  test("counts the filtered countries exactly", async ({ app, api }) => {
    const filtered = await api.fetch(DATASOURCE.COUNTRY, {
      criteria: [{ fieldName: "name", operator: "iContains", value: NAME_FILTER }],
      ...ALL_COUNTRIES,
    });

    await app.sidebar.navigateTo("countryAndRegion");
    await app.grid.filter("Name", NAME_FILTER);

    expect(filtered.length).toBeGreaterThan(1);
    expect(await app.grid.shownCount()).toEqual({ count: filtered.length, hasMore: false });
  });

  test("pages the options of a dropdown field without repeating any", async ({ app, api, data, page }) => {
    // The dropdown offers the active countries only
    const countries = (await api.fetch(DATASOURCE.COUNTRY, { criteria: [], limit: ALL_COUNTRIES.limit })).length;
    const account = data.FINANCIAL_ACCOUNT.ACCOUNTING_DOCUMENTS_DOLLAR;
    await app.sidebar.navigateTo("financialAccount");
    await app.grid.filter("Name", account.name);
    await app.grid.openForm(account.name);

    const options = collectFieldOptionPages(page, COUNTRY_PROPERTY);
    await runAndWaitForFieldOptions(page, COUNTRY_PROPERTY, () =>
      app.field.openOptions("Country", { fieldId: data.FIELD.FINANCIAL_ACCOUNT_COUNTRY })
    );
    let pages = await options.pages();
    for (let fetched = 1; fetched < MAX_PAGES && loadedIds(pages).length < countries; fetched++) {
      await runAndWaitForFieldOptions(page, COUNTRY_PROPERTY, () => app.field.scrollOptionsToEnd());
      pages = await options.pages();
      // Checked on every page: a page that repeats the loaded ones adds nothing and the list would never grow
      expect(startRows(pages), "a page did not start right after the loaded options").toEqual(loadedBefore(pages));
    }
    await app.field.closeOptions();

    const ids = loadedIds(pages);
    expect(pages.length, "the dropdown never asked for a second page").toBeGreaterThan(1);
    expect(ids.length - new Set(ids).size, "options loaded more than once").toBe(0);
    expect(ids).toHaveLength(countries);
  });
});

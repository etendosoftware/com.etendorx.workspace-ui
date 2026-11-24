import { expect, test } from "../../support/fixtures";
import { DATASOURCE } from "../../support/registry/datasources";
import { TABS } from "../../support/registry/windows";
import { collectGridFetchedIds } from "../../support/wait";

/**
 * A read of every country with the rules of the window grid, which shows the inactive ones too: more rows than
 * the core reference data has.
 */
const ALL_COUNTRIES = { limit: 1000, includeInactive: true };
/** Pages the grid needs at most to load every country (243 with the default page size of 100). */
const MAX_PAGES = 5;
/** Countries whose name contains it (Australia, Austria): one page, so the count is exact. */
const NAME_FILTER = "Austr";

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
});

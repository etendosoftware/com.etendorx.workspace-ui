import type { SavedRecord } from "../../support/api/ApiData";
import { expect, test } from "../../support/fixtures";
import { DATASOURCE } from "../../support/registry/datasources";
import { WINDOW_IDS } from "../../support/registry/windows";

/** Grouping is off unless this preference is "Y"; only the F&B sample client sets it. */
const GROUPING_ENABLED = "OBUIAPP_GroupingEnabled";
/**
 * Countries whose name contains it (Australia, AUD; Austria, EUR): few enough rows for every group
 * row to be rendered (the grid virtualizes its rows), in more than one currency.
 */
const NAME_FILTER = "Austr";
const COUNT_NAMES = { column: "Name", action: "column-actions-set-summary", type: "column-actions-summary-count" };
/** Far right in the grid: its header only renders once the grid is scrolled there. */
const GROUP_BY_CURRENCY = { column: "Currency", action: "column-actions-group-by" };
const GROUP_CELL = '[data-testid="grouped-cell"]';
const CHILD_COUNT = /\((\d+)\)\s*$/;
const COUNT_SUMMARY = /count:\s*(\d+)/i;

let preference: SavedRecord | undefined;

// Removed while the page is still open, also when the test failed or timed out
test.afterEach(async ({ api }) => {
  if (preference) {
    await api.remove(DATASOURCE.PREFERENCE, preference.id);
    preference = undefined;
  }
});

/**
 * Grid grouping and summary rows: a Count summary counts the rows of the grid, and grouped by a
 * column the group rows add up to them too. The grouping preference is enabled for the user and
 * this window only while the test runs (created through the datasource, removed afterwards).
 */
test.describe("Grid - grouping and summary rows @regression @grid", () => {
  test("counts the rows in the summary and groups them by a column", async ({ app, api, data, page }) => {
    preference = await api.add(DATASOURCE.PREFERENCE, {
      organization: data.ORGANIZATION_ID.ALL,
      propertyList: true,
      property: GROUPING_ENABLED,
      searchKey: "Y",
      userContact: data.USER_ID.ADMIN,
      window: WINDOW_IDS.COUNTRY_AND_REGION,
    });
    await page.reload(); // preferences are read once per session load
    await app.sidebar.navigateTo("countryAndRegion");
    await app.grid.filter("Name", NAME_FILTER);
    const rows = await app.grid.shownRecords();
    expect(rows).toBeGreaterThan(1);

    await app.grid.columnAction(COUNT_NAMES.column, COUNT_NAMES.action);
    await page.getByTestId(COUNT_NAMES.type).click();
    const summary = page.getByText(COUNT_SUMMARY).first();
    await expect(summary).toBeVisible();
    expect(Number(COUNT_SUMMARY.exec((await summary.textContent()) ?? "")?.[1])).toBe(rows);

    await app.grid.scrollToRightEnd();
    await app.grid.columnAction(GROUP_BY_CURRENCY.column, GROUP_BY_CURRENCY.action);
    await app.grid.scrollToLeftEnd();
    const groups = page.locator(GROUP_CELL);
    await expect(groups.first()).toBeVisible();
    const childCounts = (await groups.allTextContents()).map((text) => Number(CHILD_COUNT.exec(text)?.[1] ?? 0));
    expect(childCounts.length).toBeGreaterThan(1);
    expect(
      childCounts.reduce((sum, count) => sum + count, 0),
      "group rows do not add up to the grid rows"
    ).toBe(rows);
  });
});

import type { ApiData } from "../../support/api/ApiData";
import { expect, test } from "../../support/fixtures";
import { DATASOURCE } from "../../support/registry/datasources";
import { TABS } from "../../support/registry/windows";
import { collectGridFetches } from "../../support/wait";

/** Date column of the Conversion Rates grid. */
const COLUMN = "Valid From Date";
/** Sample rates are dated 2009–2015 and no spec creates rates: the counts below never change while it runs. */
const ONE_DAY = "2011-07-01";
const RANGE = { from: "2011-04-01", to: "2011-10-01" };
/** Not a date in any order of day, month and year. */
const INVALID_DATE = "31/31/2026";
/** Month the calendar shows for a typed "To" of {@link RANGE} (0 = January) and its year. */
const RANGE_END_MONTH = { month: "9", year: "2011" };

/** "Valid From Date" of every rate the grid shows (the window grid shows the inactive ones too), as ISO dates. */
async function rateDays(api: ApiData): Promise<string[]> {
  const rates = await api.fetch(DATASOURCE.CONVERSION_RATE, { criteria: [], limit: 1000, includeInactive: true });
  return rates.map((rate) => String(rate.validFromDate).slice(0, 10));
}

/** Rates from `from` to `to`, both included. ISO dates compare as text. */
const countBetween = (days: string[], from: string, to: string) =>
  days.filter((day) => day >= from && day <= to).length;

/**
 * Date column filter (ETP-6297): one date and ranges, picked in the calendar of the "Select dates" window or
 * typed in it or in the column, and an invalid typed date is reported and never applied. Read-only, on the sample
 * conversion rates of a maintenance window (no implicit filter), whose dates are in the past.
 */
test.describe("Grid - date column filter by one date, range and typed dates @regression @grid", () => {
  test("filters the day picked in one-date mode and shows every rate again when cleared", async ({ app, api }) => {
    const days = await rateDays(api);
    const expected = countBetween(days, ONE_DAY, ONE_DAY);
    expect(expected, "sample rates of the day").toBeGreaterThan(0);
    expect(expected, "rates of other days").toBeLessThan(days.length);

    await app.sidebar.navigateTo("conversionRates");
    await app.dateFilter.open(COLUMN);
    await expect(app.dateFilter.modeButton("One date")).toHaveAttribute("aria-pressed", "true");
    await app.dateFilter.pickDay(ONE_DAY);
    const shown = await app.dateFilter.browserDate(ONE_DAY);
    await expect(app.dateFilter.summary).toHaveText(`Filters: ${shown}`);
    await app.dateFilter.confirm();

    await expect.poll(() => app.grid.shownCount()).toEqual({ count: expected, hasMore: false });
    await expect(app.grid.filterInput(COLUMN)).toHaveValue(shown);

    await app.dateFilter.open(COLUMN);
    await app.dateFilter.clear();
    await expect.poll(() => app.grid.shownCount()).toEqual({ count: days.length, hasMore: false });
    await expect(app.grid.filterInput(COLUMN)).toHaveValue("");
  });

  test("filters a range picked in the calendar with both ends included", async ({ app, api }) => {
    const days = await rateDays(api);
    expect(countBetween(days, RANGE.from, RANGE.from), "rates on the first day").toBeGreaterThan(0);
    expect(countBetween(days, RANGE.to, RANGE.to), "rates on the last day").toBeGreaterThan(0);

    await app.sidebar.navigateTo("conversionRates");
    await app.dateFilter.open(COLUMN);
    await app.dateFilter.setMode("Range");
    await app.dateFilter.pickDay(RANGE.from);
    await app.dateFilter.pickDay(RANGE.to);
    const label = `${await app.dateFilter.browserDate(RANGE.from)} - ${await app.dateFilter.browserDate(RANGE.to)}`;
    await expect(app.dateFilter.summary).toHaveText(`Filters: ${label}`);
    await app.dateFilter.confirm();

    const expected = countBetween(days, RANGE.from, RANGE.to);
    await expect.poll(() => app.grid.shownCount()).toEqual({ count: expected, hasMore: false });
    await expect(app.grid.filterInput(COLUMN)).toHaveValue(label);
  });

  test("typed From and To filter the same rates as the calendar", async ({ app, api }) => {
    const days = await rateDays(api);

    await app.sidebar.navigateTo("conversionRates");
    await app.dateFilter.open(COLUMN);
    await app.dateFilter.setMode("Range");
    await app.dateFilter.type("From", await app.dateFilter.browserDate(RANGE.from));
    await app.dateFilter.type("To", await app.dateFilter.browserDate(RANGE.to));
    // The calendar moves to the last typed date, as if it had been picked there
    await expect(app.dateFilter.shownMonth.month).toHaveValue(RANGE_END_MONTH.month);
    await expect(app.dateFilter.shownMonth.year).toHaveValue(RANGE_END_MONTH.year);
    await app.dateFilter.confirm();

    const expected = countBetween(days, RANGE.from, RANGE.to);
    await expect.poll(() => app.grid.shownCount()).toEqual({ count: expected, hasMore: false });
  });

  test("filters a date typed in the column and never applies an invalid one", async ({ app, api, page }) => {
    const days = await rateDays(api);
    const expected = countBetween(days, ONE_DAY, ONE_DAY);

    await app.sidebar.navigateTo("conversionRates");
    await app.grid.filter(COLUMN, await app.dateFilter.browserDate(ONE_DAY));
    await expect.poll(() => app.grid.shownCount()).toEqual({ count: expected, hasMore: false });

    const fetches = collectGridFetches(page, TABS.CONVERSION_RATE);
    const input = app.grid.filterInput(COLUMN);
    await input.fill(INVALID_DATE);
    await input.press("Enter");
    await expect(input).toHaveAttribute("aria-invalid", "true");

    await app.dateFilter.open(COLUMN);
    await app.dateFilter.type("Date", INVALID_DATE);
    await expect(app.dateFilter.invalidDateAlert).toHaveText("Invalid date");
    await expect(app.dateFilter.confirmButton).toBeDisabled();
    await app.dateFilter.cancel();

    // Checked after the window, well past the typing delay of the column: the invalid date sent no request
    expect(fetches, "an invalid date reached the grid").toHaveLength(0);
    expect(await app.grid.shownCount()).toEqual({ count: expected, hasMore: false });
  });
});

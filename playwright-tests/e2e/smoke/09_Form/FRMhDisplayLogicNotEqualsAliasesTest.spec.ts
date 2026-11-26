import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import { overrideTab } from "../../support/processOverrides";
import { TABS, WINDOW_IDS } from "../../support/registry/windows";

const REGION_TAB = "Region";
/** Sample country that has regions (HasRegion = Y) and one that has none (HasRegion = N). */
const SPAIN = "Spain";
const ANDORRA = "Andorra";
/** The three spellings of "not equal to": Classic reads ^ and - exactly like !. */
const NOT_EQUALS_OPERATORS = ["!", "^", "-"] as const;

/** Writes the display logic of the Region tab for this test only: the sample data has none with ^ or -. */
async function setRegionDisplayLogic(app: App, logic: string): Promise<void> {
  const override = await overrideTab(app.page, WINDOW_IDS.COUNTRY_AND_REGION, TABS.COUNTRY_REGION, {
    displayLogic: logic,
    displayLogicExpression: logic,
  });
  await app.sidebar.navigateTo("countryAndRegion");
  expect(override.applied, `the metadata of the Region tab was not overridden with ${logic}`).toBeGreaterThan(0);
}

/** Opens a country in the form, where its child tabs show or hide according to their display logic. */
async function openCountry(app: App, name: string): Promise<void> {
  await app.grid.filter("Name", name);
  await app.grid.openForm(name);
  await app.breadcrumb.waitFor(name);
}

/**
 * Display logic with the Classic spellings of "not equal to" (ETP-5996): @Field@^'N' and @Field@-'N' mean the
 * same as @Field@!'N'. The Region tab of Country and Region shows for a country with regions and hides for one
 * without; the display logic is overridden in the metadata the UI loads, for each test only, so the sample data
 * stays as it is and nothing is saved.
 */
test.describe("Form - display logic with the not-equals aliases ^ and - @smoke @form", () => {
  // Independent tests (each test overrides the tab metadata in its own page only): spread them over the workers instead of
  // running them one after another in one worker, the tail of suite-01-base in CI (ETP-6295)
  test.describe.configure({ mode: "parallel" });

  for (const operator of NOT_EQUALS_OPERATORS) {
    test(`@HasRegion@${operator}'N' shows the Region tab with regions and hides it without`, async ({ app }) => {
      await setRegionDisplayLogic(app, `@HasRegion@${operator}'N'`);

      await openCountry(app, SPAIN);
      await expect(app.tabs.tab(REGION_TAB)).toBeVisible();

      await app.toolbar.closeRecord();
      await openCountry(app, ANDORRA);
      await expect(app.tabs.tab(REGION_TAB)).toBeHidden();
    });
  }

  // With "starts with" instead, the result would be the opposite of this one
  for (const operator of ["^", "-"] as const) {
    test(`@HasRegion@${operator}'Y' is the opposite: hides it with regions and shows it without`, async ({ app }) => {
      await setRegionDisplayLogic(app, `@HasRegion@${operator}'Y'`);

      await openCountry(app, SPAIN);
      await expect(app.tabs.tab(REGION_TAB)).toBeHidden();

      await app.toolbar.closeRecord();
      await openCountry(app, ANDORRA);
      await expect(app.tabs.tab(REGION_TAB)).toBeVisible();
    });
  }
});

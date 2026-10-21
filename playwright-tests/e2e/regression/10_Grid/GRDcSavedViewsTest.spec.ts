import { expect, test } from "../../support/fixtures";

const ISO_CODE = "ISO Code";
const EURO = "EUR";

/**
 * Saved views of a grid: the current filter is saved as a view, the standard view drops it, the
 * saved view brings it back, and once it is the default it is applied when the window opens. The
 * view is deleted at the end, also when the test fails, so the user's Currency grid stays standard.
 */
test.describe("Grid - saved views @regression @grid", () => {
  test("saves, applies and defaults a view of the grid", async ({ app, data }) => {
    const name = data.uniqueValue("GRDc");
    const filter = app.grid.filterInput(ISO_CODE);
    await app.sidebar.navigateTo("currency");
    await app.grid.filter(ISO_CODE, EURO);
    const viewId = await app.savedViews.saveCurrent(name);
    try {
      await app.savedViews.resetToStandard();
      await expect(filter).toHaveValue("");
      await app.savedViews.apply(name);
      await expect(filter).toHaveValue(EURO);

      await app.savedViews.setDefault(name);
      await app.windows.close("Currency");
      await app.sidebar.navigateTo("currency");
      await expect(filter, "the default view was not applied when the window opened").toHaveValue(EURO);
    } finally {
      await app.savedViews.remove(viewId);
    }
  });
});

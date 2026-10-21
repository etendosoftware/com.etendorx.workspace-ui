import { expect, test } from "../../support/fixtures";
import { createCategories } from "../../support/flows/records";
import { runAndWaitForDatasource, runAndWaitForResponse } from "../../support/wait";

/** Default key combinations of the core OBUIAPP_KeyboardShortcuts preference. */
const SHORTCUT = {
  SELECT_ALL: "Alt+Shift+A",
  UNSELECT_ALL: "Alt+Shift+N",
  REFRESH: "Control+Shift+R",
  NEXT_RECORD: "Alt+Shift+PageDown",
  NEW_DOCUMENT: "Control+D",
  SAVE: "Control+S",
  FOCUS_ROWS: "Escape",
};
const RECORD_COUNT = 3;
const SAVE_NEW_RECORD = /\/api\/datasource\/.*_operationType=add/;

/**
 * Keyboard shortcuts of the core preference act like the toolbar and grid controls they stand
 * for: select and unselect all rows, refresh the grid, go to the next record from the form, and
 * create and save a record. Only records the spec created are touched.
 */
test.describe("Navigation - keyboard shortcuts @regression @nav", () => {
  test("drive the grid and the form from the keyboard", async ({ app, api, data, page }) => {
    const prefix = data.uniqueValue("NAVb");
    const names = (await createCategories(api, prefix, RECORD_COUNT)).map((record) => String(record.name));
    const checkedRows = app.grid.rows().getByRole("checkbox", { name: "Toggle select row", checked: true });

    await app.sidebar.navigateTo("businessPartnerCategory");
    await app.grid.filter("Name", prefix);
    // Escape in the filter row moves the focus to the rows (Grid_FocusGrid)
    await app.grid.filterInput("Name").press(SHORTCUT.FOCUS_ROWS);

    await page.keyboard.press(SHORTCUT.SELECT_ALL);
    await expect(checkedRows).toHaveCount(RECORD_COUNT);
    await page.keyboard.press(SHORTCUT.UNSELECT_ALL);
    await expect(checkedRows).toHaveCount(0);
    await runAndWaitForDatasource(page, () => page.keyboard.press(SHORTCUT.REFRESH));

    await app.grid.openRowForm(app.grid.rowWithCell(names[0]));
    const name = app.field.input("Name");
    await expect(name).toHaveValue(names[0]);
    // Record navigation is not taken from inside an input (it would steal its keys): focus the form
    await page.getByText(`1 / ${RECORD_COUNT}`, { exact: true }).click();
    await page.keyboard.press(SHORTCUT.NEXT_RECORD);
    await expect(name).toHaveValue(names[1]);

    const created = `${prefix}-new`;
    await page.keyboard.press(SHORTCUT.NEW_DOCUMENT);
    await expect(name).toHaveValue("");
    await app.field.fill("Search Key", created);
    await name.fill(created);
    await runAndWaitForResponse(page, SAVE_NEW_RECORD, () => page.keyboard.press(SHORTCUT.SAVE));
    await app.breadcrumb.waitFor(created);
  });
});

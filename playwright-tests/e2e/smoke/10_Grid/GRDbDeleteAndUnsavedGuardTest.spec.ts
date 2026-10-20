import type { Page } from "@playwright/test";
import type { SavedRecord } from "../../support/api/ApiData";
import { expect, test } from "../../support/fixtures";
import { DATASOURCE } from "../../support/registry/datasources";

const CONFIRM_DELETE = /Are you sure you want to delete/;
const DELETED = /has been deleted successfully/;
const UNSAVED_CHANGES = {
  message: "SaveDiscardCancelModal__message",
  cancel: "SaveDiscardCancelModal__cancel",
  discard: "SaveDiscardCancelModal__discard",
};
const EDITED_NAME_SUFFIX = " edited";
/** Close button of an open window in the window tabs bar. */
const CLOSE_WINDOW = 'button[title="Close Window"]:visible';

/** Confirms the delete dialog of the toolbar and waits for the success message, which closes by itself. */
async function confirmDelete(page: Page, question: RegExp): Promise<void> {
  const confirm = page.getByText(CONFIRM_DELETE);
  await expect(confirm).toHaveText(question);
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText(DELETED)).toBeVisible();
  await expect(page.getByText(DELETED)).toBeHidden();
}

/**
 * Deleting from the grid (one record, then two at once), the unsaved-changes guard when a window
 * with a dirty form is closed (cancel keeps the change, discard drops it), and no deleted record
 * coming back when the window is reopened. The records are business partner categories the spec
 * creates through the datasource: their creation is not what is tested.
 */
test.describe("Grid - delete records and unsaved changes guard @smoke @grid", () => {
  test("deletes one and several records and guards a dirty form", async ({ app, api, data, page }) => {
    const prefix = data.uniqueValue("GRDb");
    const records: SavedRecord[] = [];
    for (const index of [1, 2, 3, 4]) {
      const key = `${prefix}-${index}`;
      records.push(
        await api.add(DATASOURCE.BUSINESS_PARTNER_CATEGORY, {
          organization: data.ORGANIZATION_ID.SPAIN,
          searchKey: key,
          name: key,
        })
      );
    }
    const [single, firstOfTwo, secondOfTwo, guarded] = records.map((record) => String(record.name));

    await app.sidebar.navigateTo("businessPartnerCategory");
    await app.grid.filter("Name", prefix);
    await expect(app.grid.rows()).toHaveCount(records.length);

    await app.grid.setRowSelected(app.grid.rowWithCell(single), true);
    await app.toolbar.button("delete").click();
    await confirmDelete(page, new RegExp(single));
    await expect(app.grid.rowWithCell(single)).toBeHidden();

    await app.grid.setRowSelected(app.grid.rowWithCell(firstOfTwo), true);
    await app.grid.setRowSelected(app.grid.rowWithCell(secondOfTwo), true);
    await app.toolbar.button("delete").click();
    await confirmDelete(page, /the selected 2 records/);
    await expect(app.grid.rowWithCell(firstOfTwo)).toBeHidden();
    await expect(app.grid.rowWithCell(secondOfTwo)).toBeHidden();
    await expect(app.grid.rows()).toHaveCount(1);

    // Closing a window with a dirty form asks first: cancel keeps the change, discard drops it
    await app.grid.openRowForm(app.grid.rowWithCell(guarded));
    const name = app.field.input("Name");
    await expect(name).toHaveValue(guarded);
    await name.fill(guarded + EDITED_NAME_SUFFIX);
    await page.locator(CLOSE_WINDOW).click();
    await expect(page.getByTestId(UNSAVED_CHANGES.message)).toBeVisible();
    await page.getByTestId(UNSAVED_CHANGES.cancel).click();
    await expect(name).toHaveValue(guarded + EDITED_NAME_SUFFIX);

    await page.locator(CLOSE_WINDOW).click();
    await page.getByTestId(UNSAVED_CHANGES.discard).click();
    await expect(page.locator(CLOSE_WINDOW)).toHaveCount(0);

    // Reopened within the response cache lifetime: the deleted records must not come back
    // (no wait for the datasource here: a cached response answers without any request)
    await app.sidebar.navigateTo("businessPartnerCategory");
    const filter = app.grid.filterInput("Name");
    await filter.fill(prefix);
    await filter.press("Enter");
    await expect(app.grid.rows(), "deleted records came back after reopening the window").toHaveCount(1);
    await expect(app.grid.rowWithCell(guarded)).toBeVisible();
    await expect(app.grid.rowWithCell(guarded + EDITED_NAME_SUFFIX)).toBeHidden();
  });
});

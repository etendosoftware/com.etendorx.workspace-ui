import type { Page } from "@playwright/test";
import { expect, test } from "../../support/fixtures";
import { createCategories } from "../../support/flows/records";

const RECORD_COUNT = 3;
const STATUS_BAR = { previous: "previous-record-button", next: "next-record-button" };

/** Position counter of the status bar ("2 / 3"). */
function counter(page: Page, position: number) {
  return page.getByText(`${position} / ${RECORD_COUNT}`, { exact: true });
}

/**
 * Status bar previous/next: from the form, the record arrows walk the rows of the filtered grid
 * in grid order, the counter follows, and the first and last records cannot go further.
 */
test.describe("Navigation - status bar previous and next record @regression @nav", () => {
  test("walks the records of the grid from the form", async ({ app, api, data, page }) => {
    const prefix = data.uniqueValue("NAVc");
    const names = (await createCategories(api, prefix, RECORD_COUNT)).map((record) => String(record.name));

    await app.sidebar.navigateTo("businessPartnerCategory");
    await app.grid.filter("Name", prefix);
    await app.grid.openRowForm(app.grid.rowWithCell(names[0]));
    const name = app.field.input("Name");
    await expect(name).toHaveValue(names[0]);
    await expect(counter(page, 1)).toBeVisible();
    await expect(page.getByTestId(STATUS_BAR.previous)).toBeDisabled();

    await page.getByTestId(STATUS_BAR.next).click();
    await expect(name).toHaveValue(names[1]);
    await expect(counter(page, 2)).toBeVisible();
    await page.getByTestId(STATUS_BAR.next).click();
    await expect(name).toHaveValue(names[2]);
    await expect(page.getByTestId(STATUS_BAR.next)).toBeDisabled();

    await page.getByTestId(STATUS_BAR.previous).click();
    await expect(name).toHaveValue(names[1]);
    await expect(counter(page, 2)).toBeVisible();
  });
});

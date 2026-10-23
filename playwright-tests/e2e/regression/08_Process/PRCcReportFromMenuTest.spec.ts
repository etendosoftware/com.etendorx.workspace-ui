import { expect, test } from "../../support/fixtures";

/** "Payables Aging Schedule" (OBUIAPP_Report process definition) in the sidebar menu. */
const AGING_SCHEDULE = {
  search: "aging",
  menuId: "B6D984F9FEFB412D827A37BACF2F1D66",
  title: "Payables Aging Schedule",
};
const OVERDUE_GROUP = "Number Of Days Overdue: Group";
/** Default value of the four aging columns (days overdue). */
const COLUMN_DEFAULTS = {
  [`${OVERDUE_GROUP} One`]: "30",
  [`${OVERDUE_GROUP} Two`]: "60",
  [`${OVERDUE_GROUP} Three`]: "90",
  [`${OVERDUE_GROUP} Four`]: "120",
};
const PDF_EXPORT = '[data-testid^="ReportExportButton_PDF"]';
const PDF_FILE = /\.pdf$/i;

/**
 * An OBUIAPP_Report process definition opened from the menu: its parameters get their defaults and
 * the PDF export downloads the report, leaving the modal open for another export. Read-only.
 */
test.describe("Process - OBUIAPP report launched from the menu @regression @process", () => {
  test("opens with its defaults and downloads the PDF report", async ({ app, page }) => {
    await app.sidebar.openMenuEntry(AGING_SCHEDULE.search, AGING_SCHEDULE.menuId);
    await app.processModal.expectTitle(AGING_SCHEDULE.title);
    for (const [parameter, value] of Object.entries(COLUMN_DEFAULTS)) {
      await expect(app.processModal.root.locator(`input[aria-label="${parameter}"]`)).toHaveValue(value);
    }

    const download = page.waitForEvent("download");
    await app.processModal.root.locator(PDF_EXPORT).click();
    expect((await download).suggestedFilename()).toMatch(PDF_FILE);
    await expect(app.processModal.title).toBeVisible();
  });
});

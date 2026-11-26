import type { Page } from "@playwright/test";
import type { SavedRecord } from "../../support/api/ApiData";
import { expect, test } from "../../support/fixtures";
import { SIDEBAR_TEST_IDS } from "../../support/components/Sidebar";
import { createCategories } from "../../support/flows/records";
import { DATASOURCE } from "../../support/registry/datasources";
import { WINDOWS } from "../../support/registry/windows";

const CATEGORY = DATASOURCE.BUSINESS_PARTNER_CATEGORY;
/** Text of `ETMETA_RecordNoLongerExists`, the same in the local fallback when the database lacks the message. */
const RECORD_NO_LONGER_EXISTS = "The record no longer exists";

/** Chip of a recent document on the Home widget. */
function recentDocument(page: Page, record: SavedRecord) {
  return page.getByTestId(`RecentDocsRenderer__item_${CATEGORY.windowId}_${record.id}`);
}

/** The document the form would add for a category, viewed in its header tab. */
function asRecentDocument(record: SavedRecord) {
  return {
    windowId: CATEGORY.windowId,
    windowTitle: "Business Partner Category",
    tabId: CATEGORY.tabId,
    tabLevel: 0,
    recordId: String(record.id),
    identifier: String(record.name),
  };
}

/** Reloads the app, which reads the recent documents of the user and role again from the server. */
async function reloadHome(page: Page): Promise<void> {
  await page.reload();
  await page.getByTestId(SIDEBAR_TEST_IDS.toggle).waitFor({ state: "visible" });
}

/**
 * Home "Recent documents" (ETP-6431): a document whose record was deleted is not opened as an empty form —
 * the user is told it no longer exists and it leaves the list, also on the server — while a document whose
 * record exists still opens on it.
 */
test.describe("Navigation - recent documents whose record was deleted @regression @nav", () => {
  let records: SavedRecord[] = [];
  let deleted: SavedRecord | undefined;

  test.afterEach(async ({ api }) => {
    for (const record of records) {
      await api.removeRecentDocument(asRecentDocument(record));
      if (record !== deleted) await api.remove(CATEGORY, String(record.id));
    }
    records = [];
    deleted = undefined;
  });

  test("tells a deleted record apart and still opens an existing one", async ({ app, api, data, page }) => {
    records = await createCategories(api, data.uniqueValue("NAVd"), 2);
    const [gone, kept] = records;
    for (const record of records) await api.trackRecentDocument(asRecentDocument(record));
    await api.remove(CATEGORY, String(gone.id));
    deleted = gone;

    await reloadHome(page);
    await expect(recentDocument(page, gone)).toBeVisible();
    await recentDocument(page, gone).click();

    await app.toast.expectWarning(RECORD_NO_LONGER_EXISTS);
    await expect(recentDocument(page, gone)).toHaveCount(0);
    // Nothing was opened: Home, with its other documents, is still on screen.
    await expect(recentDocument(page, kept)).toBeVisible();

    await reloadHome(page);
    await expect(recentDocument(page, kept)).toBeVisible();
    await expect(recentDocument(page, gone)).toHaveCount(0);

    await recentDocument(page, kept).click();
    await app.breadcrumb.waitFor(WINDOWS.businessPartnerCategory.breadcrumb);
    await expect(app.field.input("Name")).toHaveValue(String(kept.name));
  });
});

import { expect, test } from "../../support/fixtures";
import { WINDOWS } from "../../support/registry/windows";

/** Matches only the "Transactions" folders of the core menu: nothing that opens something. */
const FOLDER_ONLY_TERM = "transactions";
/** Matches folders ("Setup" of each area) and entries that open something. */
const MIXED_TERM = "setup";
const SALES_ORDER_TERM = "sales order";
/** AD_Menu_ID of the folders on the path of Sales Order: Sales Management › Transactions. */
const SALES_ORDER_PATH = ["166", "800249"];
/** A window loads its metadata the first time it opens: up to a minute on a busy CI. */
const LANDING_TIMEOUT = 60_000;

/**
 * Sidebar search (ETP-6337): as the Quick Launch of Classic, only entries that open something are
 * results, and folders are shown only as the path of a result. Read-only: it only searches the menu
 * and opens a window.
 */
test.describe("Navigation - sidebar search shows no empty folders @smoke @nav", () => {
  test("only entries that open something are results, with their folders as the path", async ({ app }) => {
    const { sidebar } = app;

    // A term that matches only folder names: no folder is shown, the empty message is
    await sidebar.search(FOLDER_ONLY_TERM);
    await expect(sidebar.noResults).toBeVisible();
    await expect(sidebar.openableEntries).toHaveCount(0);
    expect(await sidebar.emptyFolderNames()).toEqual([]);

    // A term that matches folders and entries: every folder shown holds an entry
    await sidebar.search(MIXED_TERM);
    await expect(sidebar.openableEntries.first()).toBeVisible();
    await expect(sidebar.noResults).toBeHidden();
    expect(await sidebar.emptyFolderNames()).toEqual([]);

    // Clearing the search brings back the whole menu
    await sidebar.clearSearch();
    await expect(sidebar.noResults).toBeHidden();
    await expect(sidebar.menuEntry(SALES_ORDER_PATH[0])).toBeVisible();

    // A window is shown under its folders and opens
    await sidebar.search(SALES_ORDER_TERM);
    for (const folderId of SALES_ORDER_PATH) {
      await expect(sidebar.menuEntry(folderId)).toBeVisible();
    }
    expect(await sidebar.emptyFolderNames()).toEqual([]);
    await sidebar.openMenuEntry(SALES_ORDER_TERM, WINDOWS.salesOrder.menuId);
    await app.breadcrumb.waitFor(WINDOWS.salesOrder.breadcrumb, LANDING_TIMEOUT);
  });
});

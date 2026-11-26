import { expect, test } from "../../support/fixtures";
import type { SavedRecord } from "../../support/api/ApiData";
import { recordLink } from "../../support/flows/navigation";
import { removePreferences, setWindowPreferences } from "../../support/flows/preferences";
import { overrideSessionRole } from "../../support/processOverrides";
import { TABS, WINDOW_IDS } from "../../support/registry/windows";
import { collectGridFetches } from "../../support/wait";

const AUDIT = /^Audit$/;
const LINKED_ITEMS = /^Linked Items$/;
const NOTES = /^Notes/;
const NOTE_INPUT = "New note";
const YES = "Y";
const NO = "N";
/** User level of a role without administration rights (organization only). */
const REGULAR_USER_LEVEL = "  O";
const PAGE_SIZE = 5;

const preferences: SavedRecord[] = [];

// Removed while the page is still open, also when the test failed or timed out
test.afterEach(async ({ api }) => {
  await removePreferences(api, preferences);
});

// PREFa is split in three files so its parts run side by side instead of being the last spec of
// suite-05-regression (ETP-6295): ...ProductPreferences (Product window and tree), ...ReadOnlyTabPreferences
// (Goods Transaction window) and ...SessionPreferences (login, logout and filter messages). Each file changes
// preferences that only its own tests read.
/**
 * Classic interface preferences applied by the new UI (ETP-6356), on the read-only Goods Transaction window.
 * Window preferences are created for the user of the suite and a window no other regression spec reads. The
 * tests share that window, so they run one after another.
 */
test.describe("Session - Classic interface preferences of a read-only window @regression @session", () => {
  test("opens the audit section and hides linked items and the note input of a read-only tab", async ({
    app,
    api,
    data,
    page,
  }) => {
    const movement = recordLink(
      WINDOW_IDS.GOODS_TRANSACTION,
      TABS.GOODS_TRANSACTION,
      data.GOODS_TRANSACTION.LAPTOP_RECEIPT.id
    );
    const openNotes = async () => {
      await app.formSections.open(NOTES);
      return page.getByLabel(NOTE_INPUT);
    };

    await page.goto(movement);
    await expect(app.formSections.main).toBeVisible();
    await expect(app.formSections.header(AUDIT)).toHaveAttribute("aria-expanded", "false");
    await expect(app.formSections.header(LINKED_ITEMS)).toBeVisible();
    await expect(await openNotes()).toBeVisible();

    await setWindowPreferences(app, api, preferences, WINDOW_IDS.GOODS_TRANSACTION, [
      { name: "ShowAuditDefault", value: YES, propertyList: false },
      { name: "OBUIAPP_DisableLinkedItemsSection", value: YES, propertyList: true },
      { name: "DisableNotesForReadOnlyTabs", value: YES, propertyList: true },
    ]);
    await page.goto(movement);
    await expect(app.formSections.main).toBeVisible();
    await expect(app.formSections.header(AUDIT)).toHaveAttribute("aria-expanded", "true");
    await expect(app.formSections.header(LINKED_ITEMS)).toHaveCount(0);
    await expect(await openNotes()).toHaveCount(0);
  });

  test("pages the grid by dataPageSize and fills its height without scrolling", async ({ app, api }) => {
    await setWindowPreferences(app, api, preferences, WINDOW_IDS.GOODS_TRANSACTION, [
      { name: "dataPageSize", value: String(PAGE_SIZE), propertyList: true },
    ]);
    const fetches = collectGridFetches(app.page, TABS.GOODS_TRANSACTION);
    await app.sidebar.navigateTo("goodsTransaction");

    // Five rows leave no scroll bar: the grid asks for the next pages by itself, five records at a time
    await expect.poll(() => fetches.length, { message: "the grid did not ask for a second page" }).toBeGreaterThan(1);
    // The datasource request sends the row range as text
    expect(fetches[0]).toMatchObject({ _startRow: "0", _endRow: String(PAGE_SIZE) });
    // Classic's _endRow is inclusive, so the first page holds PAGE_SIZE + 1 rows: the next one starts after them
    const secondPageStart = PAGE_SIZE + 1;
    expect(fetches[1]).toMatchObject({
      _startRow: String(secondPageStart),
      _endRow: String(secondPageStart + PAGE_SIZE),
    });
    await expect.poll(() => app.grid.rows().count()).toBeGreaterThan(PAGE_SIZE);
  });

  test("lets only administrators personalize the window with the preference set to No", async ({
    app,
    api,
    data,
    page,
  }) => {
    const movement = recordLink(
      WINDOW_IDS.GOODS_TRANSACTION,
      TABS.GOODS_TRANSACTION,
      data.GOODS_TRANSACTION.LAPTOP_RECEIPT.id
    );
    const personalizeForm = app.toolbar.button("personalize-form");
    const saveView = page.getByTestId("SaveViewMenu__save-button");
    await setWindowPreferences(app, api, preferences, WINDOW_IDS.GOODS_TRANSACTION, [
      { name: "OBUIAPP_WindowPersonalization_Override", value: NO, propertyList: true },
    ]);

    // The role of the suite is a client administrator: it keeps every option
    await page.goto(movement);
    await expect(personalizeForm).toBeEnabled();
    await app.sidebar.navigateTo("goodsTransaction");
    await app.savedViews.open();
    await expect(saveView).toBeVisible();

    // The same user seen as a regular one only picks views
    const role = await overrideSessionRole(page, { userLevel: REGULAR_USER_LEVEL });
    await page.goto(movement);
    await expect(personalizeForm).toBeDisabled();
    expect(role.applied, "the session was not loaded again").toBeGreaterThan(0);
    await app.sidebar.navigateTo("goodsTransaction");
    await app.savedViews.open();
    await expect(page.getByTestId("SaveViewMenu__reset-button")).toBeVisible();
    await expect(saveView).toHaveCount(0);
  });
});

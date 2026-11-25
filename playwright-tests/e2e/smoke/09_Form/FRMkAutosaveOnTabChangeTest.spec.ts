import type { ApiData, SavedRecord } from "../../support/api/ApiData";
import type { App } from "../../support/components";
import { expect, test } from "../../support/fixtures";
import type * as Data from "../../support/registry/data";
import { DATASOURCE } from "../../support/registry/datasources";
import { WINDOW_IDS } from "../../support/registry/windows";
import { addWindowPreferences, reloginToReadPreferences, removePreferences } from "../../support/flows/preferences";

const BUSINESS_PARTNER = "Business Partner";
const ORDER_REFERENCE = "Order Reference";
const DOCUMENT_NO = "Document No.";
const MORE_INFORMATION = "More Information";
const LINES = "Lines";
const SAVE_REQUEST = /\/api\/datasource\/.*_operationType=(add|update)/;
const FIRST_REFERENCE = "AUTOSAVE-1";
const CHANGED_REFERENCE = "AUTOSAVE-2";

const AUTOSAVE = "Autosave";
const SHOW_CONFIRMATION = "ShowConfirmationDefault";
const PROMPT_MESSAGE = "SaveDiscardCancelModal__message";
const PROMPT_SAVE = "SaveDiscardCancelModal__save";
const PROMPT_DISCARD = "SaveDiscardCancelModal__discard";
const PROMPT_CANCEL = "SaveDiscardCancelModal__cancel";
const NEXT_RECORD = "next-record-button";
const RECORD_POSITION = "record-position-indicator";

/**
 * Moving to another tab or record with unsaved changes follows the Autosave and Show Confirmation Default
 * preferences, like Classic: it saves (the default), asks first, or leaves the choice to the user. The Sales Order
 * is a test record that is deleted afterwards, and so are the preferences created for the tests.
 */
test.describe("Form - autosave when changing tab or record @smoke @form", () => {
  let savedOrderId: string | undefined;
  const preferences: SavedRecord[] = [];
  const categories: SavedRecord[] = [];
  /** The saves the server answered. */
  const answered: string[] = [];

  test.beforeEach(({ page }) => {
    answered.length = 0;
    page.on("response", async (response) => {
      if (!SAVE_REQUEST.test(response.url()) || response.request().method() !== "POST") return;
      // A rejected save has no record to clean up; any other failure to read the answer must show
      if (!response.ok()) return;
      const body = await response.json();
      savedOrderId ??= body?.response?.data?.[0]?.id;
      answered.push(response.url());
    });
  });

  // Removed while the page is still open, also when the test failed or timed out
  test.afterEach(async ({ api }) => {
    if (savedOrderId) {
      await api.remove(DATASOURCE.SALES_ORDER, savedOrderId);
      savedOrderId = undefined;
    }
    while (categories.length > 0) {
      const category = categories.pop();
      if (category) await api.remove(DATASOURCE.PRODUCT_CATEGORY, category.id);
    }
    await removePreferences(api, preferences);
  });

  /** The preferences are read once per session: a new login reads the ones just created, for this window only. */
  async function setPreferences(app: App, api: ApiData, values: Record<string, string>) {
    const attributes = Object.entries(values).map(([name, value]) => ({ name, value, propertyList: false }));
    preferences.push(...(await addWindowPreferences(api, WINDOW_IDS.SALES_ORDER, attributes)));
    await reloginToReadPreferences(app);
  }

  /** A saved Sales Order open in form view, with its reference filled in and nothing pending. */
  async function openSavedOrder(app: App, data: typeof Data) {
    await app.sidebar.navigateTo("salesOrder");
    await app.toolbar.newRecord();
    await app.field.selectById(BUSINESS_PARTNER, data.BUSINESS_PARTNER.CUSTOMER_A.id);
    // The toolbar save returns once a new record is reloaded into the form: a slower reload would overwrite the
    // value typed next
    await app.toolbar.save();
    await app.breadcrumb.documentNumber();
    await app.formSections.open(MORE_INFORMATION);
    await app.field.fill(ORDER_REFERENCE, FIRST_REFERENCE);
    await app.toolbar.save();
    // Saved: both saves answered, and the form has taken the saved record back as its reference
    await expect.poll(() => answered.length).toBe(2);
    await expect(app.toolbar.button("save")).toBeDisabled();
  }

  /** Changes the reference, which leaves the form with unsaved changes. */
  async function changeReference(app: App) {
    await app.field.fill(ORDER_REFERENCE, CHANGED_REFERENCE);
    await expect(app.field.input(ORDER_REFERENCE)).toHaveValue(CHANGED_REFERENCE);
    await expect(app.toolbar.button("save")).toBeEnabled();
  }

  test("a changed field is saved when the user moves to Lines", async ({ app, data }) => {
    await openSavedOrder(app, data);
    await changeReference(app);

    await app.tabs.open(LINES);

    await expect.poll(() => answered.length).toBe(3);
    await expect(app.field.input(ORDER_REFERENCE)).toHaveValue(CHANGED_REFERENCE);
    await expect(app.toolbar.button("save")).toBeDisabled();
    await expect(app.page.getByTestId(PROMPT_SAVE)).toBeHidden();
  });

  test("a changed field is saved when the user moves to the next record", async ({ app, data }) => {
    await openSavedOrder(app, data);
    await changeReference(app);
    const position = app.page.getByTestId(RECORD_POSITION);
    const before = (await position.textContent()) ?? "";

    await app.page.getByTestId(NEXT_RECORD).click();

    await expect.poll(() => answered.length).toBe(3);
    await expect(position).not.toHaveText(before);
  });

  test("a failed save keeps the user on the record, with the changes", async ({ app, data }) => {
    await openSavedOrder(app, data);
    await changeReference(app);
    // A required field left empty makes the save fail
    await app.field.input(DOCUMENT_NO).fill("");

    await app.tabs.open(LINES);

    await expect(app.page.getByText(/required fields are missing.*Document No/)).toBeVisible();
    await expect(app.field.input(ORDER_REFERENCE)).toHaveValue(CHANGED_REFERENCE);
    await expect(app.toolbar.button("save")).toBeEnabled();
    expect(answered).toHaveLength(2);

    // Moving to the next record stops in the same way
    await app.page.getByTestId(NEXT_RECORD).click();
    await expect(app.field.input(ORDER_REFERENCE)).toHaveValue(CHANGED_REFERENCE);
    expect(answered).toHaveLength(2);
  });

  test("with Autosave off nothing is saved: the user chooses to stay or to discard", async ({ app, api, data }) => {
    await setPreferences(app, api, { [AUTOSAVE]: "N" });
    await openSavedOrder(app, data);
    await changeReference(app);

    await app.tabs.open(LINES);

    await expect(app.page.getByTestId(PROMPT_DISCARD)).toBeVisible();
    // Staying keeps the changes, unsaved
    await app.page.getByTestId(PROMPT_CANCEL).click();
    await expect(app.page.getByTestId(PROMPT_SAVE)).toBeHidden();
    await expect(app.field.input(ORDER_REFERENCE)).toHaveValue(CHANGED_REFERENCE);
    await expect(app.toolbar.button("save")).toBeEnabled();
    expect(answered).toHaveLength(2);

    // Discarding goes on without them
    await app.tabs.open(LINES);
    await app.page.getByTestId(PROMPT_DISCARD).click();
    await expect(app.field.input(ORDER_REFERENCE)).toHaveValue(FIRST_REFERENCE);
    expect(answered).toHaveLength(2);
  });

  test("with Show Confirmation Default on it asks first: accepting saves, cancelling stays", async ({
    app,
    api,
    data,
  }) => {
    await setPreferences(app, api, { [AUTOSAVE]: "Y", [SHOW_CONFIRMATION]: "Y" });
    await openSavedOrder(app, data);
    await changeReference(app);

    await app.tabs.open(LINES);

    await expect(app.page.getByTestId(PROMPT_MESSAGE)).toContainText("Do you want to save the changes");
    // There is nothing to discard: the only choices are to save and move, or to stay
    await expect(app.page.getByTestId(PROMPT_DISCARD)).toBeHidden();
    await app.page.getByTestId(PROMPT_CANCEL).click();
    await expect(app.toolbar.button("save")).toBeEnabled();
    expect(answered).toHaveLength(2);

    await app.tabs.open(LINES);
    await app.page.getByTestId(PROMPT_SAVE).click();
    await expect.poll(() => answered.length).toBe(3);
    await expect(app.toolbar.button("save")).toBeDisabled();
  });

  test("Autosave off for the Sales Order window does not change another window", async ({ app, api, data }) => {
    await setPreferences(app, api, { [AUTOSAVE]: "N" });
    const prefix = data.uniqueValue("FRMk");
    for (const suffix of ["1", "2"]) {
      categories.push(
        await api.add(DATASOURCE.PRODUCT_CATEGORY, {
          organization: data.ORGANIZATION_ID.ALL,
          searchKey: `${prefix}-${suffix}`,
          name: `${prefix}-${suffix}`,
          default: false,
          plannedMargin: 0,
          summaryLevel: false,
        })
      );
    }
    await app.sidebar.navigateTo("productCategory");
    await app.grid.filter("Name", prefix);
    await app.grid.openForm(`${prefix}-1`);
    await app.field.fill("Name", `${prefix}-1-edited`);

    await app.page.getByTestId(NEXT_RECORD).click();

    // Product Category keeps the default (Autosave on): it saves and moves, without asking
    await expect.poll(() => answered.length).toBe(1);
    await expect(app.page.getByTestId(PROMPT_SAVE)).toBeHidden();
    // The saved answer is a category, not an order: nothing for the order clean-up to delete
    savedOrderId = undefined;
  });
});

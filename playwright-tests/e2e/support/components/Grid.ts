import { expect, type Locator, type Page } from "@playwright/test";
import { runAndWaitForDatasource, runAndWaitForResponse } from "../wait";
import { exactText } from "./level";

const ROW_TIMEOUT = 20_000;
const CHECK_TIMEOUT = 10_000;
const VISIBLE_ROWS = "tr:visible";
/** Inline editing actions of a row (actions column): `edit-button-<id>`, `save-button-<id>`. */
const EDIT_ROW_BUTTON = '[data-testid^="edit-button-"]';
const SAVE_ROW_BUTTON = '[data-testid^="save-button-"]';
/** The datasource request that saves an inline edit. */
const ROW_SAVE_REQUEST = /\/api\/datasource\/.*_operationType=update/;
/** Record count of a grid that keeps its own counter bar: "Showing 12 records". */
const SHOWING_RECORDS = /Showing (\d+) records?/;
/** Record count of the root grid, which docks it into the title bar: "(12 records)". */
const TITLE_RECORD_COUNT = /\((\d+) \w+\)/;
/** Accessible name of the selection checkbox of a grid row. */
const ROW_SELECTION_LABEL = "Toggle select row";
/** Entry of the column actions menu that removes the filter of the column. */
const CLEAR_FILTER = "Clear filter";
/** Text the header of a filtered column carries: "Filtering by <column> - …". */
const FILTERING_BY = "Filtering by";

/** Data grid of the active tab or of a process modal. */
export class Grid {
  constructor(private readonly page: Page) {}

  /**
   * Column filter input, by column name (placeholder `Filter <column>...`). Pass `scope` (e.g. a
   * child tab, `Tab__<AD_Tab_ID>`) when another grid on the page has a column with the same name.
   */
  filterInput(column: string, scope: Locator | Page = this.page): Locator {
    return scope.locator(`input[placeholder="Filter ${column}..."]`).filter({ visible: true }).first();
  }

  /** Filters a column and waits for the datasource response that applies the filter. */
  async filter(column: string, value: string, scope: Locator | Page = this.page): Promise<void> {
    const input = this.filterInput(column, scope);
    await input.waitFor({ state: "visible", timeout: ROW_TIMEOUT });
    await input.clear();
    await runAndWaitForDatasource(this.page, async () => {
      await input.fill(value);
      await input.press("Enter");
    });
  }

  /** First visible row containing `text`. */
  row(text: string | RegExp): Locator {
    return this.page.locator(VISIBLE_ROWS).filter({ hasText: text }).first();
  }

  /**
   * Row with a cell showing exactly `cellText`, for values that are the prefix of others (the
   * document number "I/25" is contained in "I/250"). Pass `scope` (e.g. the process modal) when
   * another grid on the page can show the same value.
   */
  rowWithCell(cellText: string, scope: Locator | Page = this.page): Locator {
    return scope
      .locator("tbody tr")
      .filter({ has: this.page.locator("td").filter({ hasText: exactText(cellText) }) })
      .first();
  }

  /**
   * Clicks the sort button of a column header and waits for the data sorted by it (sorting is
   * done by the backend). Each click toggles the direction.
   */
  async sortBy(column: string): Promise<void> {
    // The header text also shows a filter count, so the button is found by its label:
    // "Sort by <column> ascending" or, once sorted, "Sorted by <column> descending"
    const button = this.page
      .locator(`thead:visible [aria-label^="Sort by ${column} "], thead:visible [aria-label^="Sorted by ${column} "]`)
      .first();
    await runAndWaitForDatasource(this.page, () => button.click());
  }

  /**
   * Header cell of a column, found by its sort button: "Sort by <column> ascending" or, once
   * sorted, "Sorted by <column> descending" (the header text also shows filter values and counts).
   */
  columnHeader(column: string, scope: Locator | Page = this.page): Locator {
    const sortButton = `[aria-label^="Sort by ${column} "], [aria-label^="Sorted by ${column} "]`;
    return scope
      .locator("thead:visible th")
      .filter({ has: this.page.locator(sortButton) })
      .first();
  }

  /**
   * Opens the column actions menu ("Column Actions", three dots) of a column header and clicks an
   * entry by test id (`column-actions-group-by`, `column-actions-set-summary`, …).
   */
  async columnAction(column: string, actionTestId: string): Promise<void> {
    await this.columnHeader(column).getByRole("button", { name: "Column Actions" }).click();
    await this.page.getByTestId(actionTestId).click();
  }

  /**
   * Removes the filter of a column through its column actions menu ("Clear filter"), e.g. a
   * filter a process grid applies when it opens. Waits for the header to stop showing the filter,
   * not for a request: when the grid already fetched the data without that filter (a process grid
   * can load once before it applies its own), it shows that data again without asking for it.
   */
  async clearFilter(column: string, scope: Locator | Page = this.page): Promise<void> {
    const header = this.columnHeader(column, scope);
    await header.getByRole("button", { name: "Column Actions" }).click();
    await this.page.getByRole("menuitem", { name: CLEAR_FILTER, exact: true }).click();
    await expect(header).not.toContainText(`${FILTERING_BY} ${column}`);
  }

  /** The record count of the visible grid: "(N records)" in the title bar, or "Showing N records" in its counter bar. */
  async shownRecords(): Promise<number> {
    const title = this.page.getByTestId("TitleRecordCount__table").filter({ visible: true }).first();
    const bar = this.page.getByText(SHOWING_RECORDS).filter({ visible: true }).first();
    const counter = title.or(bar);
    await expect(counter).toHaveText(new RegExp(`${TITLE_RECORD_COUNT.source}|${SHOWING_RECORDS.source}`), {
      timeout: ROW_TIMEOUT,
    });
    const text = (await counter.textContent()) ?? "";
    return Number((TITLE_RECORD_COUNT.exec(text) ?? SHOWING_RECORDS.exec(text))?.[1]);
  }

  /** Visible data rows of the grid in `scope`, in display order. */
  rows(scope: Locator | Page = this.page): Locator {
    return scope.locator("tbody tr:visible");
  }

  /** Trimmed texts of the cells of `row`, to assert exact values ("100" but not "1,100"). */
  cellTexts(row: Locator): Promise<string[]> {
    return row.locator("td").evaluateAll((cells) => cells.map((cell) => cell.textContent?.trim() ?? ""));
  }

  /** Input of a cell of a row being edited, by property name (`data-column-id`). */
  cellEditor(row: Locator, hqlName: string): Locator {
    return row.locator(`input[data-column-id="${hqlName}"]`);
  }

  /** Saves the inline edit of `row` and waits until the backend saved it. */
  async saveRow(row: Locator): Promise<void> {
    await runAndWaitForResponse(this.page, ROW_SAVE_REQUEST, () => row.locator(SAVE_ROW_BUTTON).click());
  }

  /** Checks or unchecks the selection checkbox of `row` and waits until it shows that state. */
  async setRowSelected(row: Locator, selected: boolean): Promise<void> {
    const checkbox = row.getByRole("checkbox", { name: ROW_SELECTION_LABEL });
    await checkbox.setChecked(selected, { timeout: ROW_TIMEOUT });
    await expect(checkbox).toBeChecked({ checked: selected, timeout: CHECK_TIMEOUT });
  }

  /** Waits for a row containing `text`. */
  async waitForRow(text: string | RegExp): Promise<Locator> {
    const row = this.row(text);
    await row.waitFor({ state: "visible", timeout: ROW_TIMEOUT });
    return row;
  }

  /**
   * Checks the selection checkbox of a row. Retried because the checkbox can be briefly
   * non-interactive while the row re-renders after a datasource response.
   */
  async selectRow(text: string | RegExp): Promise<void> {
    const checkbox = (await this.waitForRow(text)).locator('input[type="checkbox"]');
    await expect(async () => {
      await checkbox.scrollIntoViewIfNeeded();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }).toPass({ timeout: CHECK_TIMEOUT });
  }

  /**
   * Scrolls the visible grid to its right end. Columns are virtualized: cells of the last
   * columns (status, pinned actions) only render once scrolled into view.
   */
  async scrollToRightEnd(): Promise<void> {
    await this.scrollHorizontally(true);
  }

  /** Scrolls the visible grid back to its left end (the first columns, the group cells). */
  async scrollToLeftEnd(): Promise<void> {
    await this.scrollHorizontally(false);
  }

  private async scrollHorizontally(toEnd: boolean): Promise<void> {
    await this.page
      .getByRole("table")
      .filter({ visible: true })
      .first()
      .evaluate((table, end) => {
        const container = table.parentElement as HTMLElement;
        container.scrollLeft = end ? container.scrollWidth : 0;
      }, toEnd);
  }

  /**
   * Toggles the selection of a row by clicking one of its plain cells (no input or button).
   * The click is dispatched to the cell: rows outside the virtualized viewport are skipped by
   * the browser hit-testing a coordinate click relies on. Pass `scope` (e.g. the process modal)
   * when another grid on the page can show the same text.
   */
  async clickRowCell(text: string | RegExp, scope: Locator | Page = this.page): Promise<void> {
    const row = scope.locator("tbody tr").filter({ hasText: text }).first();
    await row.waitFor({ state: "attached", timeout: ROW_TIMEOUT });
    await row.evaluate((element) => {
      const cells = Array.from(element.querySelectorAll("td"));
      const plainCell = cells.find((cell) => !cell.querySelector("input") && !cell.querySelector("button"));
      plainCell?.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    });
  }

  /** Row being edited inline (it shows the save button in its actions column). */
  editingRow(): Locator {
    return this.page.locator(VISIBLE_ROWS).filter({ has: this.page.locator('[data-testid^="save-button-"]') });
  }

  /** Inserts an inline row through the cell context menu and waits for its editors. */
  async insertRow(): Promise<Locator> {
    const cell = this.page.locator("tbody tr:visible td").filter({ hasNotText: /^$/ }).first();
    await cell.waitFor({ state: "visible", timeout: ROW_TIMEOUT });
    await cell.click({ button: "right" });
    await this.page.getByText("Insert Row", { exact: true }).click();
    const row = this.editingRow();
    await row.locator('[data-testid^="save-button-new_"]').waitFor({ state: "visible", timeout: ROW_TIMEOUT });
    return row;
  }

  /**
   * Inserts an inline row in an empty grid through its "Create record in grid" button. The last
   * visible one is taken: a child tab's grid is below its parent's.
   */
  async insertRowInEmptyGrid(): Promise<Locator> {
    const button = this.page
      .getByRole("button", { name: /in grid/i })
      .filter({ visible: true })
      .last();
    await button.waitFor({ state: "visible", timeout: ROW_TIMEOUT });
    await button.click();
    const row = this.editingRow();
    await row.locator('[data-testid^="save-button-new_"]').waitFor({ state: "visible", timeout: ROW_TIMEOUT });
    return row;
  }

  /**
   * Starts editing a row inline through its actions column button ("Edit in grid") and returns the
   * row being edited.
   * @param row - the row itself (e.g. {@link rowWithCell}) or a text of it.
   */
  async editRow(row: Locator | string | RegExp): Promise<Locator> {
    const target = typeof row === "string" || row instanceof RegExp ? this.row(row) : row;
    await target.locator(`button${EDIT_ROW_BUTTON}`).click();
    const editing = this.editingRow();
    await editing.waitFor({ state: "visible", timeout: ROW_TIMEOUT });
    return editing;
  }

  /** Opens the form view of a row through its actions column button. */
  async openForm(text: string | RegExp): Promise<void> {
    await this.openRowForm(this.row(text));
  }

  /** Opens the form view of a row (e.g. {@link rowWithCell}) through its actions column button. */
  async openRowForm(row: Locator): Promise<void> {
    await expect(async () => {
      const button = row.locator('button[data-testid^="form-button-"]');
      await button.scrollIntoViewIfNeeded();
      await button.click();
    }).toPass({ intervals: [500, 1_000, 2_000], timeout: ROW_TIMEOUT });
  }
}

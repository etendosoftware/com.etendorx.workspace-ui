import { expect, type Locator, type Page } from "@playwright/test";
import { runAndWaitForDatasource } from "../wait";

const ROW_TIMEOUT = 20_000;
const CHECK_TIMEOUT = 10_000;
const VISIBLE_ROWS = "tr:visible";

/** Data grid of the active tab or of a process modal. */
export class Grid {
  constructor(private readonly page: Page) {}

  /** Column filter input, by column name (placeholder `Filter <column>...`). */
  filterInput(column: string): Locator {
    return this.page.locator(`input[placeholder="Filter ${column}..."]`).filter({ visible: true }).first();
  }

  /** Filters a column and waits for the datasource response that applies the filter. */
  async filter(column: string, value: string): Promise<void> {
    const input = this.filterInput(column);
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
    await this.page
      .getByRole("table")
      .filter({ visible: true })
      .first()
      .evaluate((table) => {
        const container = table.parentElement as HTMLElement;
        container.scrollLeft = container.scrollWidth;
      });
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

  /** Starts editing a row inline through its actions column button. */
  async editRow(text: string | RegExp): Promise<Locator> {
    await this.row(text).locator('button[data-testid^="edit-button-"]').click();
    const row = this.editingRow();
    await row.waitFor({ state: "visible", timeout: ROW_TIMEOUT });
    return row;
  }

  /** Opens the form view of a row through its actions column button. */
  async openForm(text: string | RegExp): Promise<void> {
    await expect(async () => {
      const button = this.row(text).locator('button[data-testid^="form-button-"]');
      await button.scrollIntoViewIfNeeded();
      await button.click();
    }).toPass({ intervals: [500, 1_000, 2_000], timeout: ROW_TIMEOUT });
  }
}

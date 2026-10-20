import { expect, type Locator, type Page } from "@playwright/test";
import { runAndWaitForDatasource } from "../wait";
import { exactText } from "./level";

const ROW_TIMEOUT = 20_000;
const CHECK_TIMEOUT = 10_000;
const VISIBLE_ROWS = "tr:visible";
/** Accessible name of the selection checkbox of a grid row. */
const ROW_SELECTION_LABEL = "Toggle select row";

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

  /** Opens the form view of a row through its actions column button. */
  async openForm(text: string | RegExp): Promise<void> {
    await expect(async () => {
      const button = this.row(text).locator('button[data-testid^="form-button-"]');
      await button.scrollIntoViewIfNeeded();
      await button.click();
    }).toPass({ intervals: [500, 1_000, 2_000], timeout: ROW_TIMEOUT });
  }
}

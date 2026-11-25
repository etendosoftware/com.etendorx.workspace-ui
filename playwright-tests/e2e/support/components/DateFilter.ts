import { expect, type Locator, type Page } from "@playwright/test";
import { runAndWaitForDatasource } from "../wait";

/** Title of the window the calendar icon of a date column opens. */
const SELECT_DATES = "Select dates";
/** Text of the summary while no date is chosen; otherwise it starts with "Filters: ". */
const SUMMARY = /^(Filters: .+|No date filter)$/;
const CONFIRM = "Confirm";
const CANCEL = "Cancel";
const CLEAR_FILTERS = "Clear filters";

/** How the dates of the window are chosen. */
export type DateFilterMode = "One date" | "Range";
/** Text field of the window: "Date" in one-date mode, "From" and "To" in range mode. */
export type DateFilterField = "Date" | "From" | "To";

/** Year, month (1–12) and day of an ISO date ("2011-07-01"), read without any time zone. */
const isoParts = (iso: string): [number, number, number] => {
  const [year, month, day] = iso.split("-").map(Number);
  return [year, month, day];
};

/**
 * Filter of a date column: the text field of the column and the "Select dates" window its calendar icon opens,
 * with a "One date / Range" switch, typed dates and a calendar. Days are named by ISO date ("2011-07-01").
 */
export class DateFilter {
  constructor(private readonly page: Page) {}

  get dialog(): Locator {
    return this.page.getByRole("dialog", { name: SELECT_DATES });
  }

  /** What the window will filter: "Filters: 01/07/2011" or "No date filter". */
  get summary(): Locator {
    return this.dialog.getByText(SUMMARY);
  }

  get confirmButton(): Locator {
    return this.dialog.getByRole("button", { name: CONFIRM });
  }

  /** The message an invalid typed date shows under its field. */
  get invalidDateAlert(): Locator {
    return this.dialog.getByRole("alert");
  }

  /** Text field of the window. */
  field(name: DateFilterField): Locator {
    return this.dialog.getByRole("textbox", { name });
  }

  modeButton(mode: DateFilterMode): Locator {
    return this.dialog.getByRole("button", { name: mode, exact: true });
  }

  /** Month (0–11) and year the calendar shows. */
  get shownMonth(): { month: Locator; year: Locator } {
    return {
      month: this.dialog.getByTestId("DateRangeModal__month"),
      year: this.dialog.getByTestId("DateRangeModal__year"),
    };
  }

  /** Opens the window of a column from its calendar icon. */
  async open(column: string): Promise<void> {
    await this.page.getByTitle(`Open date picker for ${column}`).filter({ visible: true }).first().click();
    await expect(this.dialog).toBeVisible();
  }

  async setMode(mode: DateFilterMode): Promise<void> {
    await this.modeButton(mode).click();
    await expect(this.modeButton(mode)).toHaveAttribute("aria-pressed", "true");
  }

  /** Shows the month of an ISO date in the calendar and clicks that day. */
  async pickDay(iso: string): Promise<void> {
    const [year, month] = isoParts(iso);
    await this.shownMonth.year.selectOption(String(year));
    await this.shownMonth.month.selectOption(String(month - 1));
    await this.dialog.getByTestId(`DateRangeModal__day-${iso}`).click();
  }

  /** Types a date in a field and applies it with Enter, as the user leaving the field would. */
  async type(name: DateFilterField, text: string): Promise<void> {
    const input = this.field(name);
    await input.fill(text);
    await input.press("Enter");
  }

  /** Confirms the window and waits for the grid request that applies the filter. */
  async confirm(): Promise<void> {
    await runAndWaitForDatasource(this.page, () => this.confirmButton.click());
    await expect(this.dialog).toBeHidden();
  }

  /**
   * Empties the dates and confirms, which removes the filter of the column. Waits for the window only, not for
   * a request: the grid can show again the unfiltered rows it already fetched without asking for them, so the
   * caller checks the rows or the count.
   */
  async clear(): Promise<void> {
    await this.dialog.getByRole("button", { name: CLEAR_FILTERS }).click();
    await expect(this.summary).toHaveText("No date filter");
    await this.confirmButton.click();
    await expect(this.dialog).toBeHidden();
  }

  async cancel(): Promise<void> {
    await this.dialog.getByRole("button", { name: CANCEL }).click();
    await expect(this.dialog).toBeHidden();
  }

  /** An ISO date as the browser shows and reads it (the user's format: "07/01/2011" in en-US). */
  async browserDate(iso: string): Promise<string> {
    return this.page.evaluate(([year, month, day]) => {
      const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
      return new Intl.DateTimeFormat(undefined, options).format(new Date(year, month - 1, day));
    }, isoParts(iso));
  }
}

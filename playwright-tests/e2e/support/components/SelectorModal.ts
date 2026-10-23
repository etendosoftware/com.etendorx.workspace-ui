import type { Locator, Page } from "@playwright/test";

const MODAL_TIMEOUT = 15_000;

/**
 * Lookup (magnifying glass) of a search selector: a dialog with a grid of records.
 * Its controls carry the field id (`IconButton__<fieldId>`, `Dialog__<fieldId>`), a stable
 * domain id (AD_Field_ID).
 */
export class SelectorModal {
  constructor(
    private readonly page: Page,
    private readonly fieldId: string
  ) {}

  get dialog(): Locator {
    return this.page.getByTestId(`Dialog__${this.fieldId}`);
  }

  /** Opens the lookup from the magnifying glass next to the field. */
  async open(): Promise<void> {
    const searchIcon = this.page.getByTestId(`SearchIcon__${this.fieldId}`);
    await this.page.getByTestId(`IconButton__${this.fieldId}`).filter({ has: searchIcon }).first().click();
    await this.dialog.getByRole("table").waitFor({ state: "visible", timeout: MODAL_TIMEOUT });
  }

  /** Searches all the columns of the lookup grid. */
  async search(text: string): Promise<void> {
    await this.dialog.locator('input[placeholder="Search..."]').fill(text);
  }

  /** Filters a column of the lookup grid (placeholder `Filter by <column>`). */
  async filter(column: string, value: string): Promise<void> {
    const input = this.dialog.locator(`input[placeholder="Filter by ${column}"]`);
    await input.fill(value);
  }

  /** Picks the first row containing `text`; a single-selection lookup closes on click. */
  async pick(text: string | RegExp): Promise<void> {
    const row = this.dialog.getByRole("row").filter({ hasText: text }).first();
    await row.waitFor({ state: "visible", timeout: MODAL_TIMEOUT });
    await row.click();
  }

  /** Confirms a multiple-selection lookup. */
  async confirm(): Promise<void> {
    await this.page.getByTestId(`SelectorModalConfirm__${this.fieldId}`).click();
  }
}

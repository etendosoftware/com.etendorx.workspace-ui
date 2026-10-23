import type { Locator, Page } from "@playwright/test";

const MODAL_TIMEOUT = 15_000;

/**
 * The buttons of a selector, in a window form or in a process modal, and the search popup the
 * magnifying glass opens: a dialog with a grid of records filtered per column. Its controls carry
 * the id of the field (AD_Field_ID) or of the process parameter (OBUIAPP_Parameter_ID), a stable
 * domain id: `IconButton__<id>` (magnifying glass and "+", told apart by their icon) and
 * `Dialog__<id>`.
 */
export class SelectorModal {
  constructor(
    private readonly page: Page,
    private readonly fieldId: string
  ) {}

  get dialog(): Locator {
    return this.page.getByTestId(`Dialog__${this.fieldId}`);
  }

  /** The magnifying glass next to the field. */
  get searchButton(): Locator {
    return this.buttonWithIcon(`SearchIcon__${this.fieldId}`);
  }

  /** The "+" next to the field, which opens the process that creates a record for it. */
  get addButton(): Locator {
    return this.buttonWithIcon(`PlusIcon__${this.fieldId}`);
  }

  /** Opens the search popup from the magnifying glass next to the field. */
  async open(): Promise<void> {
    await this.searchButton.click();
    await this.dialog.getByRole("table").waitFor({ state: "visible", timeout: MODAL_TIMEOUT });
  }

  /** Filters a column of the popup grid (its filter box, `Filter <column>...`). */
  async filter(column: string, value: string): Promise<void> {
    await this.dialog.getByRole("textbox", { name: `Filter ${column}...`, exact: true }).fill(value);
  }

  /** Picks the first row containing `text`; a single-selection popup closes on click. */
  async pick(text: string | RegExp): Promise<void> {
    const row = this.dialog.getByRole("row").filter({ hasText: text }).first();
    await row.waitFor({ state: "visible", timeout: MODAL_TIMEOUT });
    await row.click();
  }

  /** Confirms a multiple-selection popup. */
  async confirm(): Promise<void> {
    await this.page.getByTestId(`SelectorModalConfirm__${this.fieldId}`).click();
  }

  private buttonWithIcon(iconTestId: string): Locator {
    return this.page
      .getByTestId(`IconButton__${this.fieldId}`)
      .filter({ has: this.page.getByTestId(iconTestId) })
      .first();
  }
}

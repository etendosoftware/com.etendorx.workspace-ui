import { expect, type Locator, type Page } from "@playwright/test";
import { type DatasourceRequestParams, runAndCaptureGridFetch } from "../wait";

/** Field of the "Characteristic Description" column of the Product grid. */
const CHARACTERISTIC_DESCRIPTION = "characteristicDescription";
const NODE_TEST_ID = "TreeColumnFilterNode__";
const CLEAR_TEST_ID = "TreeColumnFilter__clear";

/**
 * Filter of a "Characteristic Description" column: a dropdown with the tree of characteristics, groups and
 * values. Every change of the selection is applied to the grid at once.
 */
export class CharacteristicsFilter {
  constructor(
    private readonly page: Page,
    private readonly fieldName: string = CHARACTERISTIC_DESCRIPTION
  ) {}

  /** The filter cell: the applied values (`Characteristic:[value - value]`) or its placeholder. */
  get cell(): Locator {
    return this.page.getByTestId(`TreeColumnFilter__${this.fieldName}`).filter({ visible: true }).first();
  }

  /** Rows of the open tree, in display order. */
  get nodes(): Locator {
    return this.page.locator(`[data-testid^="${NODE_TEST_ID}"]`);
  }

  /** Checkbox of the node with the given label. */
  checkbox(label: string): Locator {
    return this.nodes.getByRole("checkbox", { name: label, exact: true });
  }

  /**
   * Opens the dropdown and waits for the tree. It asks for the tree on every opening, but the client reuses an
   * identical answer for a few seconds, so there is not always a request to wait for.
   */
  async open(): Promise<void> {
    await this.cell.click();
    await expect(this.nodes.first()).toBeVisible();
  }

  /** Closes the dropdown (a click on the cell toggles it). */
  async close(): Promise<void> {
    await this.cell.click();
    await expect(this.nodes).toHaveCount(0);
  }

  /**
   * Checks or unchecks a node. Waits for the checkbox only: the grid reuses the rows of a selection it already
   * fetched, so the caller checks the rows the new selection shows.
   */
  async toggle(label: string): Promise<void> {
    const checkbox = this.checkbox(label);
    const checked = await checkbox.isChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked({ checked: !checked });
  }

  /** Checks a node the grid has not filtered by yet and returns the grid request that applies it. */
  toggleAndCapture(tabId: string, label: string): Promise<DatasourceRequestParams> {
    return runAndCaptureGridFetch(this.page, tabId, () => this.checkbox(label).click());
  }

  /** Removes the filter with the clear button of the cell (no request to wait for: the grid can reuse the rows it fetched without filter). */
  async clear(): Promise<void> {
    await this.cell.getByTestId(CLEAR_TEST_ID).click();
    await expect(this.cell.getByTestId(CLEAR_TEST_ID)).toHaveCount(0);
  }
}

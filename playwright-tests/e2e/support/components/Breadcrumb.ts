import { expect, type Locator, type Page } from "@playwright/test";

const DEFAULT_TIMEOUT = 15_000;
const RECORD_TIMEOUT = 20_000;
const DIGITS = /(\d+)/;

/**
 * Breadcrumb of the active window.
 *
 * Inactive windows stay mounted with `visibility: hidden`, so only the visible breadcrumb is
 * considered: a hidden one may contain the same text earlier in the DOM.
 */
export class Breadcrumb {
  constructor(private readonly page: Page) {}

  get root(): Locator {
    return this.page.locator('nav[aria-label="breadcrumb"]:visible');
  }

  /**
   * Document number of the open record (e.g. "800023"): the first run of digits in the
   * breadcrumb, whose last item is the record identifier. Waits until the record is shown.
   */
  async documentNumber(timeout = RECORD_TIMEOUT): Promise<string> {
    let documentNumber: string | undefined;
    await expect(async () => {
      const texts = await this.root.getByRole("listitem").allTextContents();
      documentNumber = texts.map((text) => text.match(DIGITS)?.[1]).find(Boolean);
      expect(documentNumber, "the breadcrumb shows no document number").toBeDefined();
    }).toPass({ timeout });
    return documentNumber as string;
  }

  /** Goes back from a record to the grid of its window by clicking the window name (first item). */
  async openWindowGrid(): Promise<void> {
    await this.root.getByRole("listitem").first().click();
  }

  /** Waits until the active breadcrumb shows `text`. */
  async waitFor(text: string | RegExp, timeout = DEFAULT_TIMEOUT): Promise<void> {
    await this.root.getByText(text).first().waitFor({ state: "visible", timeout });
  }
}

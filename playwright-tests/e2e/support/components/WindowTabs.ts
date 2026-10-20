import type { Locator, Page } from "@playwright/test";

/** Close button of each open window in the window tabs bar. */
const CLOSE_WINDOW = 'button[title="Close Window"]';

/** The bar of open windows above the active one: one tab per window, with its close button. */
export class WindowTabs {
  constructor(private readonly page: Page) {}

  /** Tab of an open window, by its title (a dirty window shows "* <title>"). */
  tab(title: string): Locator {
    return this.page.locator(`div:has(> ${CLOSE_WINDOW})`).filter({ hasText: title }).first();
  }

  /** Close buttons of all open windows: their count is the number of open windows. */
  get closeButtons(): Locator {
    return this.page.locator(`${CLOSE_WINDOW}:visible`);
  }

  /** Brings an open window to the front. */
  async switchTo(title: string): Promise<void> {
    await this.tab(title).locator("button").first().click();
  }

  /** Closes an open window (a dirty one asks first, see the unsaved changes guard). */
  async close(title: string): Promise<void> {
    await this.tab(title).locator(CLOSE_WINDOW).click();
  }
}

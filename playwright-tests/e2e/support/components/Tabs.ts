import type { Locator, Page } from "@playwright/test";

const TAB_TIMEOUT = 15_000;

/** Child tabs of a window (e.g. "Lines", "User Roles"), shown as buttons named after the tab. */
export class Tabs {
  constructor(private readonly page: Page) {}

  /**
   * The button of a child tab, by its accessible name. Yes/No fields are buttons with the role
   * switch and their own label (the "Bill of Materials" field of a product shares the name of its
   * tab), so they are left out.
   */
  tab(name: string): Locator {
    return this.page.locator(`button[aria-label="${name}"]:not([role="switch"]):visible`).first();
  }

  /** Opens a child tab. */
  async open(name: string): Promise<void> {
    const tab = this.tab(name);
    await tab.waitFor({ state: "visible", timeout: TAB_TIMEOUT });
    await tab.click();
  }
}

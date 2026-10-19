import type { Locator, Page } from "@playwright/test";

const TAB_TIMEOUT = 15_000;

/** Child tabs of a window (e.g. "Lines", "User Roles"), shown as buttons named after the tab. */
export class Tabs {
  constructor(private readonly page: Page) {}

  /** The button of a child tab, by its accessible name. */
  tab(name: string): Locator {
    return this.page.locator(`button[aria-label="${name}"]:visible`).first();
  }

  /** Opens a child tab. */
  async open(name: string): Promise<void> {
    const tab = this.tab(name);
    await tab.waitFor({ state: "visible", timeout: TAB_TIMEOUT });
    await tab.click();
  }
}

import { expect, type Locator, type Page } from "@playwright/test";

const SECTION_TIMEOUT = 15_000;

/**
 * Collapsible sections of the form view.
 *
 * Every section has a header carrying `aria-controls="section-content-<id>"` and `aria-expanded`.
 * Inactive windows stay mounted with `visibility: hidden`, so only visible headers are considered.
 */
export class FormSections {
  constructor(private readonly page: Page) {}

  /** The header of the section titled `title`. */
  header(title: string | RegExp): Locator {
    return this.page.locator('[aria-controls^="section-content-"]:visible').filter({ hasText: title }).first();
  }

  /** The header of the main section: it is on screen once a record is open in form view. */
  get main(): Locator {
    return this.header(/^Main Section$/);
  }

  /** Expands the section titled `title` when it is collapsed. */
  async open(title: string | RegExp, timeout = SECTION_TIMEOUT): Promise<void> {
    const header = this.header(title);
    await header.waitFor({ state: "visible", timeout });
    await header.scrollIntoViewIfNeeded();
    if ((await header.getAttribute("aria-expanded")) !== "true") {
      await header.click();
    }
    await expect(header).toHaveAttribute("aria-expanded", "true", { timeout });
  }
}

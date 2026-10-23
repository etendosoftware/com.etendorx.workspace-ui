import { expect, type Locator, type Page } from "@playwright/test";

/** Close buttons of the Sonner toasts still on screen (removed toasts keep animating out). */
const OPEN_TOAST_CLOSE_BUTTONS = "[data-sonner-toast]:not([data-removed='true']) [data-close-button]";
/** The Sonner toast list. */
const TOASTER = "[data-sonner-toaster]";
const MAX_TOASTS_TO_CLOSE = 5;
const CLICK_TIMEOUT = 2_000;
const DISMISS_TIMEOUT = 2_000;

const SUCCESS_TOASTS = '[data-sonner-toast][data-type="success"]';
const SUCCESS_TIMEOUT = 15_000;

/** Sonner toasts shown after saves and processes. */
export class Toast {
  constructor(private readonly page: Page) {}

  get closeButtons(): Locator {
    return this.page.locator(OPEN_TOAST_CLOSE_BUTTONS);
  }

  /** Asserts a success toast with the given text is shown. */
  async expectSuccess(text: string | RegExp, timeout = SUCCESS_TIMEOUT): Promise<void> {
    await expect(this.page.locator(SUCCESS_TOASTS).filter({ hasText: text }).first()).toBeVisible({ timeout });
  }

  /**
   * Closes the open toasts. Best effort: toasts are housekeeping, not under test, so one that
   * stays (or a new one that replaces it) does not fail the test. No-op when there are none.
   */
  async closeAll(): Promise<void> {
    for (let attempt = 0; attempt < MAX_TOASTS_TO_CLOSE; attempt++) {
      const open = await this.closeButtons.count();
      if (open === 0) {
        return;
      }
      await this.closeFirst();
      await this.waitForFewerThan(open);
    }
  }

  /** Hovers the toast stack first: Sonner expands it, so the close buttons stop overlapping. */
  private async closeFirst(): Promise<void> {
    try {
      await this.page.locator(TOASTER).first().hover({ timeout: CLICK_TIMEOUT });
      await this.closeButtons.first().click({ timeout: CLICK_TIMEOUT });
    } catch {
      // The toast dismissed itself or is still animating in: the next attempt retries
    }
  }

  /** Waits (best effort) until fewer than `count` toasts are open. */
  private async waitForFewerThan(count: number): Promise<void> {
    try {
      await expect.poll(() => this.closeButtons.count(), { timeout: DISMISS_TIMEOUT }).toBeLessThan(count);
    } catch {
      // A toast that stays open is left to auto-dismiss
    }
  }
}

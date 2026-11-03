import { expect, type Frame, type FrameLocator, type Locator, type Page, type Response } from "@playwright/test";
import { IFRAME_URL } from "../../../playwright.config";

const FRAME_TIMEOUT = 15_000;
const SUBMIT_TIMEOUT = 60_000;
const POLL_INTERVALS = [250, 500, 1_000];
/** Classic pages are proxied under /meta/legacy/. */
const LEGACY_PATH = "/meta/legacy/";

/** The POST a legacy page sends when its form is submitted (e.g. the OK of a process popup). */
export function isLegacySubmit(response: Response): boolean {
  return response.request().method() === "POST" && response.url().includes(LEGACY_PATH);
}

/** Playwright words it "Frame was detached" or "Frame has been detached", depending on where the click was. */
const DETACHED_FRAME = /Frame (?:was|has been) detached|Target page, context or browser has been closed/;

/**
 * Clicks a control whose click may remove its own frame (a legacy popup that closes itself).
 * The click went through in that case, so the detached-frame error is not a failure.
 */
export async function clickClosingFrame(control: Locator): Promise<void> {
  try {
    await control.click();
  } catch (error) {
    if (!(error instanceof Error && DETACHED_FRAME.test(error.message))) {
      throw error;
    }
  }
}

/**
 * Classic (legacy) pages rendered inside iframes: process popups, "Create Lines From", reports.
 *
 * Concrete `Frame` objects are used instead of a `FrameLocator` because several legacy iframes
 * can be mounted at once (strict-mode violations) and nested frames are cross-origin.
 */
export class LegacyFrame {
  constructor(private readonly page: Page) {}

  /** FrameLocator of the main legacy iframe (proxied through `/meta/legacy` or the Classic host). */
  main(): FrameLocator {
    return this.page.frameLocator(
      `iframe[src*="meta/legacy"], iframe[src*="${IFRAME_URL}"], iframe[src*="classic-new-mainui"]`
    );
  }

  /**
   * Clicks a control that submits a legacy form and waits for the server to answer it. The
   * wrapper modal's close button is always on screen: closing it while the submit is in flight
   * unmounts the iframe and cancels the process request.
   */
  async clickAndWaitForSubmit(control: Locator, timeout = SUBMIT_TIMEOUT): Promise<void> {
    await this.runAndWaitForSubmit(() => clickClosingFrame(control), timeout);
  }

  /** Runs `action` (which submits a legacy form) and waits for the submit response. */
  async runAndWaitForSubmit(action: () => Promise<unknown>, timeout = SUBMIT_TIMEOUT): Promise<void> {
    const submitted = this.page.waitForResponse(isLegacySubmit, { timeout });
    await action();
    await submitted;
  }

  /** Waits for the first frame, at any depth, that contains `selector`. */
  async findFrameWith(selector: string, timeout = FRAME_TIMEOUT): Promise<Frame> {
    let found: Frame | undefined;
    await expect(async () => {
      found = await this.firstFrameWith(selector);
      expect(found, `no frame contains ${selector}`).toBeDefined();
    }).toPass({ intervals: POLL_INTERVALS, timeout });
    if (!found) {
      throw new Error(`LegacyFrame: no frame contains ${selector}`);
    }
    return found;
  }

  private async firstFrameWith(selector: string): Promise<Frame | undefined> {
    for (const frame of this.page.frames()) {
      if (await this.containsSelector(frame, selector)) {
        return frame;
      }
    }
    return undefined;
  }

  /** A frame that detaches or navigates while being inspected simply does not match. */
  private async containsSelector(frame: Frame, selector: string): Promise<boolean> {
    try {
      return (await frame.locator(selector).count()) > 0;
    } catch {
      return false;
    }
  }
}

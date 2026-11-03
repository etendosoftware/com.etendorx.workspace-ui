import { expect, type Frame, type Locator, type Page } from "@playwright/test";
import { clickClosingFrame, isLegacySubmit, LegacyFrame } from "./LegacyFrame";

/** Stable test IDs of the process modals (React process definitions and the legacy wrapper). */
export const PROCESS_MODAL_TEST_IDS = {
  /** Panel of a React process modal: scope its grid and fields with it. */
  root: "process-modal",
  title: "process-modal-title",
  /** Title of the wrapper modal of legacy (Classic) processes. */
  legacyTitle: "legacy-process-modal-title",
  close: "process-modal-close-button",
  execute: "process-modal-execute-button",
  /** Close button of the wrapper modal of legacy processes and of the process result. */
  resultClose: "close-button",
  /** Message bar of a React process modal (validation messages, script messages). */
  messageBar: "ProcessMessageBar__container",
} as const;

const OK_TEXT = /^OK$/i;
/** OK buttons of the legacy (Classic) process popups, most specific first. */
const LEGACY_OK_SELECTORS =
  "td.Button_text.Button_width, td.Button_text, #buttonOK, button[value='OK'], input[value='OK'], button";
/** Buttons of the legacy (Classic) pages. */
const LEGACY_BUTTON_SELECTORS = "td.Button_text, button";
const SUCCESS_TEXT = /Process completed successfully/i;
const CONFIRM_TIMEOUT = 10_000;
const SUBMIT_TIMEOUT = 60_000;
const RESULT_TIMEOUT = 30_000;
const LEGACY_FINISH_TIMEOUT = 35_000;
const POLL_INTERVALS = [300];

/** An OK button that was clicked, and what completes its action (the submit of a legacy page). */
interface ClickedOk {
  done: Promise<unknown>;
}

/** Process modal opened from the toolbar process menu, React or legacy. */
export class ProcessModal {
  private readonly legacy: LegacyFrame;

  constructor(private readonly page: Page) {
    this.legacy = new LegacyFrame(page);
  }

  /** Panel of the open React process modal. */
  get root(): Locator {
    return this.page.getByTestId(PROCESS_MODAL_TEST_IDS.root);
  }

  /** Title of a React process modal. */
  get title(): Locator {
    return this.page.getByTestId(PROCESS_MODAL_TEST_IDS.title);
  }

  /** Message bar of the open React process modal. */
  get messageBar(): Locator {
    return this.page.getByTestId(PROCESS_MODAL_TEST_IDS.messageBar);
  }

  /** Title of the wrapper modal of a legacy process. */
  get legacyTitle(): Locator {
    return this.page.getByTestId(PROCESS_MODAL_TEST_IDS.legacyTitle);
  }

  /** Waits for the wrapper modal of a legacy process to open. */
  async waitForLegacy(timeout = CONFIRM_TIMEOUT): Promise<void> {
    await this.legacyTitle.waitFor({ state: "visible", timeout });
  }

  /** Waits until the React process modal has closed (after a successful execution). */
  async waitForClose(timeout = RESULT_TIMEOUT): Promise<void> {
    await expect(this.title).toBeHidden({ timeout });
  }

  /** Asserts the React process modal is open with the given title. */
  async expectTitle(text: string | RegExp): Promise<void> {
    await expect(this.title).toHaveText(text, { timeout: RESULT_TIMEOUT });
  }

  /**
   * Clicks OK in the process popup: a React modal button or the OK button of a legacy page,
   * in whichever frame it renders. Polls until one is clicked, then waits for the submit a
   * legacy OK sends, so closing the modal afterwards does not cancel the process.
   */
  async confirm(timeout = CONFIRM_TIMEOUT): Promise<void> {
    let clicked: ClickedOk | undefined;
    await expect(async () => {
      clicked = await this.clickAnyOk();
      expect(clicked, "OK button not found in the page or any frame").toBeDefined();
    }).toPass({ intervals: POLL_INTERVALS, timeout });
    await clicked?.done;
  }

  /**
   * Clicks a button of a legacy page that only appears in some cases (e.g. "Do not use Credit"
   * when the business partner has credit). Returns whether the button was shown within
   * `timeout`. Follow it with {@link finishLegacy}: the page may also go on by itself.
   */
  async clickLegacyButtonIfShown(text: RegExp, timeout: number): Promise<boolean> {
    const button = await this.waitForLegacyButton(text, timeout);
    if (!button) {
      return false;
    }
    await clickClosingFrame(button);
    return true;
  }

  /** Clicks a button of a legacy page (e.g. "Process") and waits for the submit it sends. */
  async clickLegacyButton(text: RegExp, timeout = CONFIRM_TIMEOUT): Promise<void> {
    const button = await this.waitForLegacyButton(text, timeout);
    if (!button) {
      throw new Error(`Legacy button ${text} not found in any frame within ${timeout}ms`);
    }
    await this.legacy.clickAndWaitForSubmit(button);
  }

  /**
   * Waits for a legacy process to finish successfully: the wrapper modal closes by itself a few
   * seconds after showing the success message. Do not click Close meanwhile — closing it while
   * it auto-closes leaves the record without selection (its toolbar buttons disabled).
   */
  async finishLegacy(timeout = LEGACY_FINISH_TIMEOUT): Promise<void> {
    await expect(this.legacyTitle).toBeHidden({ timeout });
  }

  /** Polls every frame for a visible legacy button with `text`. */
  private async waitForLegacyButton(text: RegExp, timeout: number): Promise<Locator | undefined> {
    let button: Locator | undefined;
    try {
      await expect(async () => {
        button = await this.visibleLegacyButton(text);
        expect(button, `${text} is not shown`).toBeDefined();
      }).toPass({ intervals: POLL_INTERVALS, timeout });
    } catch {
      return undefined;
    }
    return button;
  }

  /**
   * Clicks the execute button of a React process modal.
   * @param value - list value of the button when the process offers several (e.g. "CO").
   */
  async execute(value?: string): Promise<void> {
    await this.executeButton(value).click();
  }

  executeButton(value?: string): Locator {
    if (value) {
      return this.page.getByTestId(`${PROCESS_MODAL_TEST_IDS.execute}-${value}`);
    }
    return this.page.locator(`[data-testid^="${PROCESS_MODAL_TEST_IDS.execute}"]:visible`).first();
  }

  /** Closes the open React process modal without executing it, and waits until it is gone. */
  async close(timeout = RESULT_TIMEOUT): Promise<void> {
    await this.root.getByTestId(PROCESS_MODAL_TEST_IDS.close).click();
    await expect(this.root).toHaveCount(0, { timeout });
  }

  /** Waits for the result view and closes it. Fails if the process never shows its result. */
  async closeResult(timeout = RESULT_TIMEOUT): Promise<void> {
    const close = this.page.getByTestId(PROCESS_MODAL_TEST_IDS.resultClose);
    await close.waitFor({ state: "visible", timeout });
    await close.click();
  }

  /** Waits for "Process completed successfully", in the page or inside the legacy iframe. */
  async expectSuccess(timeout = RESULT_TIMEOUT): Promise<void> {
    // Frame locators cannot be combined with `or`: race one assertion per place instead
    const inPage = expect(this.page.getByText(SUCCESS_TEXT).first()).toBeVisible({ timeout });
    const inFrame = expect(this.legacy.main().getByText(SUCCESS_TEXT).first()).toBeVisible({ timeout });
    await Promise.any([inPage, inFrame]).catch(() => {
      throw new Error(`"Process completed successfully" was not shown within ${timeout}ms`);
    });
  }

  /** Clicks the first OK button found; returns what to wait for afterwards, or undefined. */
  private async clickAnyOk(): Promise<ClickedOk | undefined> {
    const reactOk = this.page.getByRole("button", { name: OK_TEXT });
    if (await reactOk.isVisible()) {
      await reactOk.click();
      return { done: Promise.resolve() };
    }
    for (const frame of this.page.frames()) {
      const ok = await this.visibleLegacyOk(frame);
      if (ok) {
        const done = this.page.waitForResponse(isLegacySubmit, { timeout: SUBMIT_TIMEOUT });
        await ok.click();
        return { done };
      }
    }
    return undefined;
  }

  /** The visible OK button of a legacy frame. */
  private visibleLegacyOk(frame: Frame): Promise<Locator | undefined> {
    return this.visibleInFrame(frame, LEGACY_OK_SELECTORS, OK_TEXT);
  }

  /** The first visible legacy button with `text`, in any frame. */
  private async visibleLegacyButton(text: RegExp): Promise<Locator | undefined> {
    for (const frame of this.page.frames()) {
      const button = await this.visibleInFrame(frame, LEGACY_BUTTON_SELECTORS, text);
      if (button) {
        return button;
      }
    }
    return undefined;
  }

  /** The first visible element of a frame matching `selectors` and `text`. A frame that detaches meanwhile has none. */
  private async visibleInFrame(frame: Frame, selectors: string, text: RegExp): Promise<Locator | undefined> {
    try {
      const element = frame.locator(selectors).filter({ hasText: text }).filter({ visible: true }).first();
      return (await element.isVisible()) ? element : undefined;
    } catch {
      return undefined;
    }
  }
}

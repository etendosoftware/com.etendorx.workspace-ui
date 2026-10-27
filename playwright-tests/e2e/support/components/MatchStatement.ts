import { expect, type Locator, type Page } from "@playwright/test";
import { PROCESS_MODAL_TEST_IDS } from "./ProcessModal";

/** Buttons of a statement line in the Match column, by accessible name (the Classic tooltips). */
export const MATCH_ROW_ACTION = {
  /** Opens "Find Transactions to Match" for the line. */
  SEARCH: "Match to a not cleared transaction",
  /** Opens "Add Transaction" with the data of the line. */
  ADD: "Add new transaction",
  /** Unmatches the transaction of the line. */
  CLEAR: "Unmatch current transaction",
} as const;

export type MatchRowAction = (typeof MATCH_ROW_ACTION)[keyof typeof MATCH_ROW_ACTION];

/** Title of the dialog Match Statement opens with, asking whether to run the matching algorithm. */
const ALGORITHM_PROMPT_TITLE = "Confirm";
const RUN_ALGORITHM = "Confirm";
const SKIP_ALGORITHM = "Cancel";
const UNMATCH_SELECTED = "Unmatch Selected";
const EXECUTE = "Execute";
const MODAL_TIMEOUT = 15_000;
/** An execution runs the process (and its onProcess) before the modal closes. */
const EXECUTE_TIMEOUT = 30_000;
/** Stack levels of the process modals: Match Statement is 0. */
const NESTED_LEVEL = 1;
/** Level of a process opened on top of the nested one (e.g. Add Payment from Add Transaction). */
export const SECOND_NESTED_LEVEL = 2;

/**
 * Match Statement (Financial Account): the process modal with the statement lines, its row buttons
 * in the Match column and the processes those buttons open on top of it.
 */
export class MatchStatement {
  constructor(private readonly page: Page) {}

  /** The Match Statement modal (processes opened from its rows stack on top of it). */
  get modal(): Locator {
    return this.page.getByTestId(PROCESS_MODAL_TEST_IDS.root).first();
  }

  /** The process a row button opened on top of Match Statement. */
  get nestedModal(): Locator {
    return this.modalAt(NESTED_LEVEL);
  }

  /** The process opened on top of the nested one, e.g. Add Payment from the "+" of Add Transaction. */
  get secondNestedModal(): Locator {
    return this.modalAt(SECOND_NESTED_LEVEL);
  }

  /** Title of the process opened on top of the nested one. */
  get secondNestedTitle(): Locator {
    return this.secondNestedModal.getByTestId(PROCESS_MODAL_TEST_IDS.title);
  }

  /** Title of the process a row button opened on top of Match Statement. */
  get nestedTitle(): Locator {
    return this.nestedModal.getByTestId(PROCESS_MODAL_TEST_IDS.title);
  }

  /** The dialog shown when Match Statement opens: run the matching algorithm or not. */
  get algorithmPrompt(): Locator {
    return this.page.getByRole("dialog", { name: ALGORITHM_PROMPT_TITLE });
  }

  /** "Unmatch Selected" footer button, shown while a matched line is selected. */
  get unmatchSelectedButton(): Locator {
    return this.modal.getByRole("button", { name: UNMATCH_SELECTED, exact: true });
  }

  /** Answers the dialog Match Statement opens with: run the matching algorithm or skip it. */
  async answerAlgorithmPrompt(run: boolean): Promise<void> {
    await this.algorithmPrompt.waitFor({ state: "visible", timeout: MODAL_TIMEOUT });
    await this.algorithmPrompt.getByRole("button", { name: run ? RUN_ALGORITHM : SKIP_ALGORITHM, exact: true }).click();
    await expect(this.algorithmPrompt).toBeHidden();
  }

  /** A button of the Match column of a statement line. */
  rowButton(row: Locator, action: MatchRowAction): Locator {
    return row.getByRole("button", { name: action, exact: true });
  }

  /** Clicks a button of a statement line and waits for the process it opens on top. */
  async openFromRow(row: Locator, action: MatchRowAction): Promise<void> {
    await this.rowButton(row, action).click();
    await this.nestedTitle.waitFor({ state: "visible", timeout: MODAL_TIMEOUT });
  }

  /**
   * Executes a process opened on top of Match Statement (`level` 1, or 2 for one opened on top of
   * that) and waits until it closed.
   */
  async executeNested(level = NESTED_LEVEL): Promise<void> {
    await this.modalAt(level).getByRole("button", { name: EXECUTE, exact: true }).click();
    await this.waitForModals(level, EXECUTE_TIMEOUT);
  }

  /** Closes a process opened on top of Match Statement without executing it. */
  async closeNested(level = NESTED_LEVEL): Promise<void> {
    await this.modalAt(level).getByTestId(PROCESS_MODAL_TEST_IDS.close).click();
    await this.waitForModals(level);
  }

  /** The process modal at `level` of the stack: 0 is Match Statement. */
  private modalAt(level: number): Locator {
    return this.page.getByTestId(PROCESS_MODAL_TEST_IDS.root).nth(level);
  }

  /** Waits until `count` process modals are open. */
  private async waitForModals(count: number, timeout = MODAL_TIMEOUT): Promise<void> {
    await expect(this.page.getByTestId(PROCESS_MODAL_TEST_IDS.root)).toHaveCount(count, { timeout });
  }

  /** Column index (`data-index`) of the grid cell an element is in, or of a header cell itself. */
  columnIndexOf(element: Locator): Promise<string | null> {
    return element.evaluate((node) => node.closest("td, th")?.getAttribute("data-index") ?? null);
  }
}

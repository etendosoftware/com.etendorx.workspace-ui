import type { Locator, Page } from "@playwright/test";
import { runAndWaitForDatasource } from "../wait";
import { atLevel, exactText, type TabLevel } from "./level";

/** Toolbar actions; each button carries the semantic class `toolbar-button-<action>`. */
export type ToolbarAction =
  | "new"
  | "save"
  | "refresh"
  | "cancel"
  | "delete"
  | "filter"
  | "toggle-tree-view"
  | "copy-record";

const PROCESS_MENU_TEST_ID = "IconButtonWithText__process-menu";
/** AD key of the toolbar "New Record" button, rendered icon-only (`IconButton__<key>`) in form view. */
const NEW_RECORD_KEY = "33864F5267194AB99C14BD0CE9884FF5";
/** Process menu entries: `ProcessMenuItem__<process id>`. */
const PROCESS_MENU_ITEMS = '[data-testid^="ProcessMenuItem__"]:visible';
const BUTTON_TIMEOUT = 15_000;
const SAVE_TIMEOUT = 60_000;

/** Toolbar of a tab: record actions and the process menu. */
export class Toolbar {
  /**
   * @param scope - where the toolbar buttons are looked up: the whole page (then `level` picks
   *   the header or the child toolbar by DOM order) or one tab, see {@link inTab}.
   */
  constructor(
    private readonly page: Page,
    private readonly scope: Page | Locator = page
  ) {}

  /** The toolbar of one tab (`Tab__<AD_Tab_ID>`), when DOM order cannot tell header and child apart. */
  inTab(tabId: string): Toolbar {
    return new Toolbar(this.page, this.page.getByTestId(`Tab__${tabId}`));
  }

  /** A toolbar button by action. */
  button(action: ToolbarAction, level: TabLevel = "header"): Locator {
    return atLevel(this.scope.locator(`button.toolbar-button-${action}:visible`), level);
  }

  /** Creates a new record. */
  async newRecord(level: TabLevel = "header"): Promise<void> {
    const button = this.scope === this.page ? this.button("new", level) : this.newRecordInTab();
    await button.waitFor({ state: "visible", timeout: BUTTON_TIMEOUT });
    await button.click();
  }

  /** Within one tab the button is the text one in grid view and the icon one in form view. */
  private newRecordInTab(): Locator {
    return this.scope
      .locator(`button.toolbar-button-new:visible, [data-testid="IconButton__${NEW_RECORD_KEY}"]:visible`)
      .first();
  }

  /**
   * Creates a new record from a tab shown in form view, whose "New Record" button is icon-only.
   * (In form view `newRecord` reaches the first text button, i.e. the one of the child tab.)
   */
  async newRecordInForm(): Promise<void> {
    await this.scope.getByTestId(`IconButton__${NEW_RECORD_KEY}`).filter({ visible: true }).first().click();
  }

  /** Saves the current record once the save button is enabled. */
  async save(level: TabLevel = "header"): Promise<void> {
    const button = atLevel(this.scope.locator("button.toolbar-button-save:visible:not([disabled])"), level);
    await button.waitFor({ state: "visible", timeout: SAVE_TIMEOUT });
    await button.click();
  }

  /** Opens the process menu of the tab. */
  async openProcessMenu(level: TabLevel = "header"): Promise<void> {
    await atLevel(this.scope.getByTestId(PROCESS_MENU_TEST_ID).filter({ visible: true }), level).click();
  }

  /**
   * Turns off the implicit filter of the grid (e.g. processed='N') when it is on, and waits
   * for the unfiltered data. The button shows it is on with an inline background color.
   */
  async disableImplicitFilter(): Promise<void> {
    const toggle = this.button("filter");
    await toggle.waitFor({ state: "visible", timeout: BUTTON_TIMEOUT });
    const isOn = await toggle.evaluate((element) => (element as HTMLElement).style.backgroundColor !== "");
    if (isOn) {
      await runAndWaitForDatasource(this.page, () => toggle.click());
    }
  }

  /**
   * Runs a process from the process menu, found by its label (e.g. "Book"), never by position.
   * Opens the process modal; use {@link ProcessModal} to confirm it.
   */
  async process(label: string, level: TabLevel = "header"): Promise<void> {
    await this.openProcessMenu(level);
    await this.page
      .locator(PROCESS_MENU_ITEMS)
      .filter({ hasText: exactText(label) })
      .first()
      .click();
  }
}

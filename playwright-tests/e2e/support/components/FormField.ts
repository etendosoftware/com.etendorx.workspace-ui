import { expect, type Locator, type Page } from "@playwright/test";
import type { SampleRecord } from "../registry/data";
import { runAndWaitForFormInitialization } from "../wait";
import { atLevel, exactText, type TabLevel } from "./level";

const FIELD_TIMEOUT = 15_000;
const CALLOUT_TIMEOUT = 60_000;
const VERIFY_TIMEOUT = 2_000;
const RETRY_TIMEOUT = 30_000;
/** Search box shown inside the dropdown of selectors with many options (list or table selectors). */
const OPTION_SEARCH = 'input[aria-label="Search options"]:visible, input[placeholder="Search..."]:visible';
const OPTION_ITEMS = '[data-testid^="OptionItem__"]';

/** Options to locate a field when the header and a child tab are both on screen. */
export interface FieldOptions {
  level?: TabLevel;
  /** Open the dropdown by field id (`ChevronDown__<AD_Field_ID>`) when the label is not unique or not exposed. */
  fieldId?: string;
}

/** Options to pick an option with the keyboard. */
export interface KeyboardPickOptions extends FieldOptions {
  /** Text typed in the dropdown search box. */
  search: string;
  /** Wait for the FormInitialization callout the selection fires. */
  callout?: boolean;
}

/** Options to pick a dropdown option. */
export interface SelectOptions extends FieldOptions {
  /** Text typed in the dropdown search box (when it has one) to narrow the options. */
  search?: string;
  /** Match the option text exactly (default) or as a substring. */
  exact?: boolean;
  /** Wait for the FormInitialization callout the selection fires. */
  callout?: boolean;
}

/**
 * Form fields located by their accessible label (the field name shown in the form).
 *
 * `fill` types like a user: Playwright fires the same input events as real typing, so React
 * state and callouts stay in sync. Do not set `value` through the native setter.
 */
export class FormField {
  constructor(private readonly page: Page) {}

  /** Field wrapper (label + control), identified by its help text reference `<name>-help`. */
  container(name: string): Locator {
    return this.page.locator(`[aria-describedby="${name}-help"]`);
  }

  /** The `<label>` element of a field. */
  label(name: string): Locator {
    return this.container(name).locator("label");
  }

  /** Text, number or date input by label. */
  input(label: string, { level = "header" }: FieldOptions = {}): Locator {
    return atLevel(this.page.locator(`input[aria-label="${label}"]:visible`), level);
  }

  /** Dropdown trigger (list, table, search selectors) by label. */
  selector(label: string, { level = "header" }: FieldOptions = {}): Locator {
    return atLevel(this.page.locator(`[aria-label="${label}"]:visible`), level)
      .locator('div[tabindex="0"]')
      .first();
  }

  /**
   * Input by field id: `TextInput__<AD_Field_ID>`, a stable domain id. Use it when the label
   * repeats on screen (e.g. the quantity of a line while the header is shown).
   */
  inputById(fieldId: string): Locator {
    return this.page.getByTestId(`TextInput__${fieldId}`).filter({ visible: true }).first();
  }

  /** Replaces the value of the input of a field id, waiting until it is editable. */
  async fillById(fieldId: string, value: string): Promise<void> {
    const input = this.inputById(fieldId);
    await input.waitFor({ state: "visible", timeout: FIELD_TIMEOUT });
    await input.fill(value);
  }

  /** Replaces the value of an input. */
  async fill(label: string, value: string, options?: FieldOptions): Promise<void> {
    const input = this.input(label, options);
    await input.waitFor({ state: "visible", timeout: FIELD_TIMEOUT });
    await input.fill(value);
  }

  /** Picks the option whose text is `optionText` (exactly, unless `exact: false`). */
  async select(label: string, optionText: string, options: SelectOptions = {}): Promise<void> {
    const text = options.exact === false ? optionText : exactText(optionText);
    await this.openSelector(label, options);
    await this.typeInOptionSearch(options.search);
    await this.clickOption(this.page.locator(OPTION_ITEMS).filter({ hasText: text }), options.callout);
  }

  /** Picks an option by its record id (`OptionItem__<id>`), for records from the data registry. */
  async selectById(label: string, optionId: string, options: SelectOptions = {}): Promise<void> {
    await this.openSelector(label, options);
    await this.typeInOptionSearch(options.search);
    await this.clickOption(this.page.getByTestId(`OptionItem__${optionId}`), options.callout);
  }

  /**
   * Picks an option with the keyboard: searches, waits for the option and presses ArrowDown +
   * Enter in the search box. Use it where the search box overlaps the options, so a pointer
   * click would not reach the option (product selectors). With `callout`, waits for the
   * FormInitialization response the selection fires (e.g. the product price), listening from
   * right before the key press so an earlier response is not taken for it.
   */
  async pickWithKeyboard(label: string, optionId: string, options: KeyboardPickOptions): Promise<void> {
    await this.openSelector(label, options);
    await this.typeInOptionSearch(options.search);
    await this.page.getByTestId(`OptionItem__${optionId}`).waitFor({ state: "visible", timeout: FIELD_TIMEOUT });
    const search = this.page.locator(OPTION_SEARCH).first();
    const select = async () => {
      await search.press("ArrowDown");
      await this.page.keyboard.press("Enter");
    };
    if (options.callout) {
      await runAndWaitForFormInitialization(this.page, select, CALLOUT_TIMEOUT);
      return;
    }
    await select();
  }

  /**
   * Picks a sample record with the keyboard and verifies the field shows it, retrying both:
   * right after saving a header the form re-renders the record, which can close the dropdown
   * or reset the selection.
   */
  async pickWithKeyboardAndVerify(label: string, record: SampleRecord, options: FieldOptions = {}): Promise<void> {
    await expect(async () => {
      await this.pickWithKeyboard(label, record.id, { ...options, search: record.name });
      await this.expectToContain(label, record.name, { ...options, timeout: VERIFY_TIMEOUT });
    }).toPass({ timeout: RETRY_TIMEOUT });
  }

  /** Asserts the text shown by a field (selected option or input value). */
  async expectToContain(
    label: string,
    text: string,
    { level = "header", timeout }: FieldOptions & { timeout?: number } = {}
  ): Promise<void> {
    await expect(atLevel(this.page.locator(`[aria-label="${label}"]:visible`), level)).toContainText(text, {
      timeout,
    });
  }

  /**
   * Opens a dropdown. The trigger can re-render while a callout runs: click re-resolves it and
   * scrolls it into view by itself.
   */
  private async openSelector(label: string, options: FieldOptions): Promise<void> {
    const trigger = options.fieldId
      ? this.page.getByTestId(`ChevronDown__${options.fieldId}`)
      : this.selector(label, options);
    await trigger.first().click({ timeout: FIELD_TIMEOUT });
  }

  private async typeInOptionSearch(search: string | undefined): Promise<void> {
    if (search === undefined) {
      return;
    }
    const input = this.page.locator(OPTION_SEARCH).first();
    await input.waitFor({ state: "visible", timeout: FIELD_TIMEOUT });
    await input.fill(search);
  }

  private async clickOption(option: Locator, callout = false): Promise<void> {
    const first = option.first();
    await first.waitFor({ state: "visible", timeout: FIELD_TIMEOUT });
    if (callout) {
      await runAndWaitForFormInitialization(this.page, () => first.click(), CALLOUT_TIMEOUT);
      return;
    }
    await first.click();
  }
}

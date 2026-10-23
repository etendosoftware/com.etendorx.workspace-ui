import { expect, type Locator, type Page } from "@playwright/test";

const TITLE = "Attribute Selector";
const MODAL_TIMEOUT = 15_000;

/** Accessible names of the standard attribute inputs (the modal names them by attribute key). */
export const ATTRIBUTE = {
  SERIAL_NUMBER: "serialNo",
  LOT_NAME: "lot",
} as const;

export type AttributeKey = (typeof ATTRIBUTE)[keyof typeof ATTRIBUTE];

/**
 * Attribute selector of an "Attribute Set Value" field (lot, serial number, dates…): a modal
 * that creates the attribute set instance and puts it in the field. Opened from the field's
 * magnifying glass, `SearchOutlined__<AD_Field_ID>`.
 */
export class AttributeSelector {
  constructor(private readonly page: Page) {}

  /** The modal title; visible while the modal is open. */
  get title(): Locator {
    return this.page.getByText(TITLE, { exact: true });
  }

  /** Opens the selector of the field with the given AD_Field_ID. */
  async open(fieldId: string): Promise<void> {
    await this.page.getByTestId(`SearchOutlined__${fieldId}`).click();
    await this.title.waitFor({ state: "visible", timeout: MODAL_TIMEOUT });
  }

  /** Types the value of a standard attribute (serial number, lot name). */
  async fill(attribute: AttributeKey, value: string): Promise<void> {
    const input = this.page.getByRole("textbox", { name: attribute, exact: true });
    await input.waitFor({ state: "visible", timeout: MODAL_TIMEOUT });
    await input.fill(value);
  }

  /** Confirms: the modal saves the attribute set instance and closes. */
  async confirm(): Promise<void> {
    await this.page.getByRole("button", { name: "OK", exact: true }).click();
    await expect(this.title).toBeHidden({ timeout: MODAL_TIMEOUT });
  }
}

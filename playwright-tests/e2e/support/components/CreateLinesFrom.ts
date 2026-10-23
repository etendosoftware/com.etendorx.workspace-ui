import type { Frame, Page } from "@playwright/test";
import type { StorageBin } from "../registry/data";
import { LegacyFrame } from "./LegacyFrame";

/** Order dropdown of the Classic "Create Lines From" page (Goods Shipment and Goods Receipt). */
const ORDER_SELECT = "#inpPurchaseOrder";
const LOCATOR_ID = "#paramM_Locator_ID";
const LOCATOR_DESCRIPTION = "#paramM_Locator_ID_DES";
const LINE_CHECKBOXES = 'input[type="checkbox"]';
const RELOAD_TIMEOUT = 30_000;
const ELEMENT_TIMEOUT = 15_000;

export interface CreateLinesFromOptions {
  /** Storage bin (locator) the lines go to. */
  locator: StorageBin;
  /** Document number of the order to take the lines from. Defaults to the last order listed. */
  orderDocNumber?: string;
  /** How long to wait for the popup frame to appear. */
  frameTimeout?: number;
}

/**
 * Classic "Create Lines From" popup of Goods Shipments and Goods Receipts, rendered in a legacy
 * iframe. Selects the order, sets the storage bin, checks the line and confirms. The caller
 * closes the wrapper modal.
 */
export class CreateLinesFrom {
  private readonly legacy: LegacyFrame;

  constructor(private readonly page: Page) {
    this.legacy = new LegacyFrame(page);
  }

  async fill({ locator, orderDocNumber, frameTimeout }: CreateLinesFromOptions): Promise<void> {
    const frame = await this.legacy.findFrameWith(ORDER_SELECT, frameTimeout);
    await this.selectOrder(frame, orderDocNumber);
    await this.setLocator(frame, locator);
    await this.checkLastLine(frame);
    await this.legacy.clickAndWaitForSubmit(frame.locator("td.Button_text").filter({ hasText: /^OK$/i }).first());
  }

  /**
   * Picks the order. Its `onchange` submits the page (`FIND_PO`), which reloads the frame with
   * the order lines, so the reload is awaited instead of a fixed sleep.
   */
  private async selectOrder(frame: Frame, orderDocNumber: string | undefined): Promise<void> {
    const options = frame.locator(`${ORDER_SELECT} option`);
    await options.nth(1).waitFor({ state: "attached", timeout: ELEMENT_TIMEOUT });
    const value = await this.orderOptionValue(frame, orderDocNumber);
    const reloaded = this.page.waitForEvent("framenavigated", {
      predicate: (navigated) => navigated === frame,
      timeout: RELOAD_TIMEOUT,
    });
    await frame.locator(ORDER_SELECT).selectOption(value);
    await reloaded;
    await frame.waitForLoadState("load");
  }

  /** Value of the option of `orderDocNumber`, or of the last order when no number is given. */
  private async orderOptionValue(frame: Frame, orderDocNumber: string | undefined): Promise<string> {
    const value = await frame.locator(`${ORDER_SELECT} option`).evaluateAll((elements, docNumber) => {
      const options = elements as HTMLOptionElement[];
      if (!docNumber) {
        return options[options.length - 1].value;
      }
      return options.find((option) => option.text.includes(docNumber) || option.value.includes(docNumber))?.value;
    }, orderDocNumber);
    if (value === undefined) {
      throw new Error(`CreateLinesFrom: order ${orderDocNumber} is not listed`);
    }
    return value;
  }

  /**
   * Sets the storage bin the way its Classic selector popup does: the hidden id and the shown
   * search key. Typing the search key alone leaves the id empty when the field has no default
   * (Goods Shipment), and Classic then rejects the field as blank.
   */
  private async setLocator(frame: Frame, locator: StorageBin): Promise<void> {
    await frame.locator(LOCATOR_DESCRIPTION).waitFor({ state: "visible", timeout: ELEMENT_TIMEOUT });
    await frame.locator(LOCATOR_ID).evaluate((element, id) => {
      (element as HTMLInputElement).value = id;
    }, locator.id);
    await frame.locator(LOCATOR_DESCRIPTION).evaluate((element, value) => {
      const input = element as HTMLInputElement;
      const view = input.ownerDocument.defaultView as Window & typeof globalThis;
      input.value = value;
      for (const type of ["input", "change"]) {
        input.dispatchEvent(new view.Event(type, { bubbles: true, cancelable: true }));
      }
      for (const type of ["keydown", "keyup"]) {
        input.dispatchEvent(new view.KeyboardEvent(type, { key: "Enter", code: "Enter", keyCode: 13, bubbles: true }));
      }
    }, locator.value);
  }

  /** Checks the last checkbox: the order line (the first ones are the header toggles). */
  private async checkLastLine(frame: Frame): Promise<void> {
    const checkboxes = frame.locator(LINE_CHECKBOXES);
    await checkboxes.first().waitFor({ state: "visible", timeout: ELEMENT_TIMEOUT });
    await checkboxes.last().check();
  }
}

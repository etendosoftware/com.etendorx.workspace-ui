import { expect, type Page } from "@playwright/test";
import { runAndWaitForResponse } from "../wait";

/** The check the UI makes on every role change: `{ required }` tells whether the modal opens. */
const PURPOSE_CHECK = /\/api\/erp\/meta\/instance-purpose/;
const TITLE = "Instance Purpose Configuration";
const CLOSE_LABEL = "close";

/**
 * The "Instance Purpose Configuration" modal: shown to system-level roles while the instance has no
 * purpose, as in a freshly installed database (CI). Specs close it instead of choosing a purpose,
 * which would change global configuration.
 */
export class InstancePurpose {
  constructor(private readonly page: Page) {}

  /**
   * Runs an action that changes the role (e.g. to System Administrator) and closes the modal when
   * the purpose check it triggers says the modal opens.
   */
  async runAndDismiss(action: () => Promise<unknown>): Promise<void> {
    const check = await runAndWaitForResponse(this.page, PURPOSE_CHECK, action);
    const { required } = (await check.json()) as { required?: boolean };
    if (!required) {
      return;
    }
    const dialog = this.page.getByTestId("BasicModal_Modal").filter({ hasText: TITLE });
    await dialog.getByRole("button", { name: CLOSE_LABEL, exact: true }).click();
    await expect(dialog).toBeHidden();
  }
}

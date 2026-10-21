import { expect, type Page, type Response } from "@playwright/test";
import { runAndWaitForResponse } from "../wait";
import { Toolbar } from "./Toolbar";

const SAVED_VIEWS_REQUEST = /\/api\/meta\/saved-views/;
const ACTION_TIMEOUT = 5_000;
const MENU_TIMEOUT = 30_000;
const TEST_IDS = {
  container: "SaveViewMenu__container",
  reset: "SaveViewMenu__reset-button",
  save: "SaveViewMenu__save-button",
  name: "SaveViewMenu__name-input",
  confirmSave: "SaveViewMenu__confirm-save",
  apply: "SaveViewMenu__view-apply",
  setDefault: "SaveViewMenu__view-set-default",
};

/** Saved views of the grid (toolbar "save view" menu): stored per user in the backend. */
export class SavedViews {
  private readonly toolbar: Toolbar;

  constructor(private readonly page: Page) {
    this.toolbar = new Toolbar(page);
  }

  /** Content of the open menu (the menu itself forwards no test id). */
  private get content() {
    return this.page.getByTestId(TEST_IDS.container);
  }

  /** A saved view of the menu, by its name. */
  private view(name: string) {
    return this.page.locator('[data-testid^="SaveViewMenu__view-item-"]').filter({ hasText: name });
  }

  /** Opens the menu (its list of views is fetched once and refreshed after every change). */
  async open(): Promise<void> {
    await this.toolbar.button("save-view").click();
    await expect(this.content).toBeVisible();
  }

  /**
   * Runs one click of the menu with the menu open, opening it again when it closed or re-rendered
   * meanwhile (it does right after a change: the toolbar renders again), so a detached entry is
   * retried instead of waited for until the test times out.
   */
  private async inOpenMenu(click: () => Promise<unknown>): Promise<void> {
    await expect(async () => {
      if (!(await this.content.isVisible())) {
        await this.toolbar.button("save-view").click({ timeout: ACTION_TIMEOUT });
      }
      await click();
    }).toPass({ timeout: MENU_TIMEOUT });
  }

  /** Saves the current grid state as a view; returns the id the backend gave it. */
  async saveCurrent(name: string): Promise<string> {
    await this.inOpenMenu(() => this.page.getByTestId(TEST_IDS.save).click({ timeout: ACTION_TIMEOUT }));
    await this.page.getByTestId(TEST_IDS.name).fill(name);
    const saved = await runAndWaitForResponse(this.page, SAVED_VIEWS_REQUEST, () =>
      this.page.getByTestId(TEST_IDS.confirmSave).click()
    );
    await this.close();
    return savedViewId(saved);
  }

  /** Applies a saved view (client side: no request). */
  async apply(name: string): Promise<void> {
    await this.inOpenMenu(() => this.view(name).getByTestId(TEST_IDS.apply).click({ timeout: ACTION_TIMEOUT }));
    await expect(this.content).toBeHidden();
  }

  /** Makes a saved view the default of the tab. */
  async setDefault(name: string): Promise<void> {
    await this.inOpenMenu(() =>
      runAndWaitForResponse(this.page, SAVED_VIEWS_REQUEST, () =>
        this.view(name).getByTestId(TEST_IDS.setDefault).click({ timeout: ACTION_TIMEOUT })
      )
    );
    await this.close();
  }

  /**
   * Closes the menu, which stays open after saving a view or changing the default, with its toolbar
   * button (it toggles). Escape would also reach the grid shortcuts behind it.
   */
  private async close(): Promise<void> {
    await this.toolbar.button("save-view").click();
    await expect(this.content).toBeHidden();
  }

  /** Back to the standard view of the tab (no filters, no default view). */
  async resetToStandard(): Promise<void> {
    await this.inOpenMenu(() => this.page.getByTestId(TEST_IDS.reset).click({ timeout: ACTION_TIMEOUT }));
    await expect(this.content).toBeHidden();
  }

  /** Deletes a saved view through the API (cleanup, also when the test failed halfway). */
  async remove(id: string): Promise<void> {
    const token = await this.page.evaluate(() => localStorage.getItem("token"));
    const response = await this.page.request.delete(`/api/meta/saved-views/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.ok(), `saved view ${id} was not deleted: ${response.status()} ${await response.text()}`).toBe(true);
  }
}

/** The id of the view a save request created: `{ response: { status, data: { id } } }`. */
async function savedViewId(response: Response): Promise<string> {
  const body = (await response.json()) as { response?: { data?: { id?: string } } };
  const id = body.response?.data?.id;
  if (!id) {
    throw new Error(`The saved view request answered without an id: ${JSON.stringify(body)}`);
  }
  return id;
}

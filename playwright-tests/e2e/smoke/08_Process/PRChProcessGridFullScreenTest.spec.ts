import type { Locator, Page } from "@playwright/test";
import { expect, test } from "../../support/fixtures";

/** AD_Menu_ID of "Create Invoices From Orders": a process opened from the menu, with a grid of orders to pick. */
const CREATE_INVOICES_MENU_ID = "28D5CB59D59243FAA495AABD3775C692";
const CREATE_INVOICES = "Create Invoices From Orders";
const TOGGLE_FULL_SCREEN = "Toggle full screen";
const EXIT_FULL_SCREEN = "Exit fullscreen";

/** Position and size of `locator` in the page, or a failure naming what has no box. */
async function boxOf(locator: Locator, name: string): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${name} is not on screen`);
  return box;
}

/** The grid of the process modal: the panel that holds its "Toggle full screen" button. */
function gridPanel(modal: Locator): Locator {
  return modal
    .getByRole("button", { name: TOGGLE_FULL_SCREEN })
    .locator("xpath=ancestor::*[contains(@class,'MuiPaper-root')][1]");
}

/**
 * Full screen of the grid of a process window (ETP-6312). The grid leaves the layout of the process window when
 * it goes full screen: the process window behind must not shrink, move or hide its title, close button and
 * parameters, and Escape leaves the full screen before it closes the process window. Read-only: nothing is run.
 */
test.describe("Process grid - full screen @smoke @process", () => {
  async function openProcess(app: {
    sidebar: { openMenuEntry(text: string, id: string): Promise<void> };
    processModal: { root: Locator };
  }) {
    await app.sidebar.openMenuEntry(CREATE_INVOICES, CREATE_INVOICES_MENU_ID);
    const modal = app.processModal.root;
    await expect(modal.getByRole("button", { name: TOGGLE_FULL_SCREEN })).toBeVisible();
    return modal;
  }

  async function expectCoversTheWindow(page: Page, grid: Locator): Promise<void> {
    const viewport = page.viewportSize();
    if (!viewport) throw new Error("the page has no viewport");
    await expect
      .poll(async () => boxOf(grid, "the grid"), { message: "the grid does not cover the whole browser window" })
      .toMatchObject({ x: 0, y: 0, width: viewport.width, height: viewport.height });
  }

  test("covers the browser window and leaves the process window as it was", async ({ app, page }) => {
    const modal = await openProcess(app);
    const grid = gridPanel(modal);
    const before = await boxOf(modal, "the process window");
    const gridBefore = await boxOf(grid, "the grid");

    await modal.getByRole("button", { name: TOGGLE_FULL_SCREEN }).click();
    await expectCoversTheWindow(page, grid);
    expect(await boxOf(modal, "the process window"), "the process window moved or resized behind the grid").toEqual(
      before
    );

    await page.getByRole("button", { name: TOGGLE_FULL_SCREEN }).click();
    await expect.poll(async () => boxOf(grid, "the grid")).toEqual(gridBefore);
    expect(await boxOf(modal, "the process window")).toEqual(before);
    await expect(app.processModal.title).toBeVisible();
  });

  test("Escape leaves the full screen without closing the process window", async ({ app, page }) => {
    const modal = await openProcess(app);
    const grid = gridPanel(modal);
    const gridBefore = await boxOf(grid, "the grid");

    await modal.getByRole("button", { name: TOGGLE_FULL_SCREEN }).click();
    await expectCoversTheWindow(page, grid);
    await page.keyboard.press("Escape");

    await expect.poll(async () => boxOf(grid, "the grid")).toEqual(gridBefore);
    await expect(
      app.processModal.title,
      "Escape closed the process window instead of leaving the full screen"
    ).toBeVisible();

    // A second Escape, out of full screen, closes the process window as before
    await page.keyboard.press("Escape");
    await expect(app.processModal.title).toBeHidden();
  });

  test("keeps working in the grid of a normal window", async ({ app, page }) => {
    await app.sidebar.navigateTo("salesOrder");
    await page.getByRole("button", { name: TOGGLE_FULL_SCREEN }).click();
    const exit = page.getByRole("button", { name: EXIT_FULL_SCREEN });
    await expect(exit, "the grid of the window did not go full screen").toBeVisible();

    await page.keyboard.press("Escape");
    await expect(exit, "Escape did not leave the full screen").toBeHidden();
    await expect(page.getByRole("button", { name: TOGGLE_FULL_SCREEN })).toBeVisible();
  });
});

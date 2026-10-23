import { expect, type Locator, type Page } from "@playwright/test";
import { WINDOWS, type WindowKey } from "../registry/windows";
import { waitForNoOverlay } from "../wait";
import { Breadcrumb } from "./Breadcrumb";

/** Stable test IDs of the sidebar (drawer). */
export const SIDEBAR_TEST_IDS = {
  toggle: "drawer-toggle-button",
  search: "drawer-search-input",
} as const;

const MENU_ENTRY_TIMEOUT = 10_000;
const TOGGLE_TIMEOUT = 2_000;
const LANDING_TIMEOUT = 30_000;
/** Grid header of a list-only view: proves the window opened when it has no breadcrumb form tab. */
const VISIBLE_GRID_HEADER = "table thead:visible";

/** The navigation sidebar: search box and menu entries. */
export class Sidebar {
  private readonly breadcrumb: Breadcrumb;

  constructor(private readonly page: Page) {
    this.breadcrumb = new Breadcrumb(page);
  }

  /** The search input; only rendered while the sidebar is open. */
  get searchInput(): Locator {
    return this.page.getByTestId(SIDEBAR_TEST_IDS.search).locator("input");
  }

  /** Menu entry by AD_Menu_ID. */
  menuEntry(menuId: string): Locator {
    return this.page.getByTestId(`MenuTitle__${menuId}`).first();
  }

  /**
   * Opens the sidebar when it is closed and returns the search input. Retried: right after login
   * the drawer may still be settling, and a toggle click at that moment can close it again.
   */
  async open(): Promise<Locator> {
    await expect(async () => {
      if (!(await this.searchInput.isVisible())) {
        await this.page.getByTestId(SIDEBAR_TEST_IDS.toggle).click();
      }
      await expect(this.searchInput).toBeVisible({ timeout: TOGGLE_TIMEOUT });
    }).toPass({ timeout: MENU_ENTRY_TIMEOUT });
    return this.searchInput;
  }

  /** Types `text` in the sidebar search box, replacing its content. */
  async search(text: string): Promise<void> {
    await waitForNoOverlay(this.page);
    const input = await this.open();
    await input.fill(text);
  }

  /**
   * Opens a registered window and waits until it is shown.
   * @param key - entry of the window registry (`registry/windows.ts`).
   */
  async navigateTo(key: WindowKey): Promise<void> {
    const window = WINDOWS[key];
    await this.openMenuEntry(window.search, window.menuId);
    if ("landing" in window && window.landing === "grid") {
      await this.page.locator(VISIBLE_GRID_HEADER).first().waitFor({ state: "visible", timeout: LANDING_TIMEOUT });
      return;
    }
    await this.breadcrumb.waitFor(window.breadcrumb, LANDING_TIMEOUT);
  }

  /** Searches and clicks a menu entry that is not in the registry (processes, reports, folders). */
  async openMenuEntry(searchText: string, menuId: string): Promise<void> {
    await this.search(searchText);
    const entry = this.menuEntry(menuId);
    await entry.waitFor({ state: "visible", timeout: MENU_ENTRY_TIMEOUT });
    await entry.scrollIntoViewIfNeeded();
    // Click the entry icon: the center of a short entry is its favorite star, which has its own
    // click handler and does not navigate.
    await entry.getByRole("img").first().click();
  }
}

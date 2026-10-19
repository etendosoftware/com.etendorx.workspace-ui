import type { Page } from "@playwright/test";
import { DEFAULT_PASSWORD, DEFAULT_USER } from "../../../playwright.config";
import { ORGANIZATION, ROLE } from "../registry/data";
import { SIDEBAR_TEST_IDS } from "./Sidebar";

/** Stable test IDs of the login page and the profile menu. */
export const AUTH_TEST_IDS = {
  loginSubmit: "login-submit-button",
  profileMenu: "profile-menu-button",
  profileSave: "profile-save-button",
  logout: "profile-logout-button",
} as const;

const SAVE_AS_DEFAULT_LABEL = "Save as default";
const LOGIN_FORM_TIMEOUT = 10_000;
const LANDING_TIMEOUT = 30_000;

/** Role and organization selected in the profile menu after logging in. */
export interface RoleSelection {
  roleName?: string;
  organizationName?: string;
}

/** Login, logout and role/organization/warehouse selection. */
export class Auth {
  constructor(private readonly page: Page) {}

  /** Clears cookies and storage so every test starts logged out. */
  async cleanup(): Promise<void> {
    await this.page.context().clearCookies();
    // localStorage/sessionStorage only exist on real pages, not on about:blank
    const url = this.page.url();
    if (url && url !== "about:blank") {
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    }
  }

  /** Logs in through the login page and waits for the application shell. */
  async login(username = DEFAULT_USER, password = DEFAULT_PASSWORD): Promise<void> {
    await this.page.goto("/");
    const user = this.page.locator("#username");
    await user.waitFor({ state: "visible", timeout: LOGIN_FORM_TIMEOUT });
    await user.fill(username);
    await this.page.locator("#password").fill(password);
    await this.page.getByTestId(AUTH_TEST_IDS.loginSubmit).click();
    await this.page.getByTestId(SIDEBAR_TEST_IDS.toggle).waitFor({ state: "visible", timeout: LANDING_TIMEOUT });
  }

  /**
   * Selects role and organization by name (the backend returns roles in no stable order, so an
   * index could land on another role), takes the first warehouse and saves them as default.
   */
  async selectRoleOrgWarehouse({
    roleName = ROLE.QA_TESTING_ADMIN.name,
    organizationName = ORGANIZATION.SPAIN,
  }: RoleSelection = {}): Promise<void> {
    await this.page.getByTestId(AUTH_TEST_IDS.profileMenu).click();
    await this.pickOption("role-select", roleName);
    await this.pickOption("organization-select", organizationName);
    await this.page.locator("#warehouse-select").click();
    await this.page.locator('[id^="warehouse-select-option-"]').first().click();
    await this.page.getByRole("checkbox", { name: SAVE_AS_DEFAULT_LABEL }).check();
    await this.page.getByTestId(AUTH_TEST_IDS.profileSave).click();
  }

  /** Logs out through the profile menu. */
  async logout(): Promise<void> {
    await this.page.getByTestId(AUTH_TEST_IDS.profileMenu).click();
    await this.page.getByTestId(AUTH_TEST_IDS.logout).click();
  }

  private async pickOption(selectId: string, optionText: string): Promise<void> {
    await this.page.locator(`#${selectId}`).click();
    await this.page.locator(`[id^="${selectId}-option-"]`).filter({ hasText: optionText }).click();
  }
}

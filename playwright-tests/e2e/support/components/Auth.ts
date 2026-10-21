import { expect, type Page } from "@playwright/test";
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
const CANCEL_LABEL = "Cancel";
const LOGIN_FORM_TIMEOUT = 10_000;
const LANDING_TIMEOUT = 30_000;

/** Role and organization selected in the profile menu after logging in. */
export interface RoleSelection {
  roleName?: string;
  organizationName?: string;
}

/** A profile change: each value given is picked by name, the others keep what the menu shows. */
export interface ProfileSelection extends RoleSelection {
  warehouseName?: string;
}

/** Role, organization and warehouse the profile menu shows. */
export interface Profile {
  role: string;
  organization: string;
  warehouse: string;
}

const PROFILE_SELECTS = { role: "role-select", organization: "organization-select", warehouse: "warehouse-select" };

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

  /**
   * Changes role, organization and/or warehouse for this session only ("Save as default" stays
   * unticked, so the user's defaults and the other specs are not affected). Saving closes every
   * open window. Pick the role before the organization: changing the role resets the rest.
   */
  async switchProfile({ roleName, organizationName, warehouseName }: ProfileSelection): Promise<void> {
    await this.page.getByTestId(AUTH_TEST_IDS.profileMenu).click();
    const picks: [string, string | undefined][] = [
      [PROFILE_SELECTS.role, roleName],
      [PROFILE_SELECTS.organization, organizationName],
      [PROFILE_SELECTS.warehouse, warehouseName],
    ];
    for (const [selectId, optionText] of picks) {
      if (optionText) {
        await this.pickOption(selectId, optionText);
      }
    }
    await this.page.getByTestId(AUTH_TEST_IDS.profileSave).click();
    await expect(this.page.getByTestId(AUTH_TEST_IDS.profileSave)).toBeHidden({ timeout: LANDING_TIMEOUT });
  }

  /** Reads the role, organization and warehouse of the session from the profile menu, then closes it. */
  async currentProfile(): Promise<Profile> {
    await this.page.getByTestId(AUTH_TEST_IDS.profileMenu).click();
    const selectedValue = (selectId: string) => this.page.locator(`#${selectId}`).inputValue();
    const profile = {
      role: await selectedValue(PROFILE_SELECTS.role),
      organization: await selectedValue(PROFILE_SELECTS.organization),
      warehouse: await selectedValue(PROFILE_SELECTS.warehouse),
    };
    await this.page.getByRole("button", { name: CANCEL_LABEL, exact: true }).click();
    return profile;
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

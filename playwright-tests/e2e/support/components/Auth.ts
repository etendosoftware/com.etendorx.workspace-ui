import { expect, type Locator, type Page } from "@playwright/test";
import { DEFAULT_PASSWORD, DEFAULT_USER } from "../../../playwright.config";
import { ORGANIZATION, ROLE } from "../registry/data";
import { runAndWaitForResponse } from "../wait";
import { SIDEBAR_TEST_IDS } from "./Sidebar";

/** Stable test IDs of the login page and the profile menu. */
export const AUTH_TEST_IDS = {
  loginSubmit: "login-submit-button",
  profileMenu: "profile-menu-button",
  profileSave: "profile-save-button",
  logout: "profile-logout-button",
} as const;

const SAVE_AS_DEFAULT_LABEL = "Save as default";
/** The request that stores the profile as the user's default: the last step of a profile save. */
const SAVE_DEFAULTS_REQUEST = /kernel\?command=save/;
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

/** What the profile menu shows after picking a role and/or an organization, with the lists it offers. */
export interface ProfilePreview extends Profile {
  organizations: string[];
  warehouses: string[];
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
    await runAndWaitForResponse(this.page, SAVE_DEFAULTS_REQUEST, () => this.saveProfile());
  }

  /**
   * Changes role, organization and/or warehouse for this session only ("Save as default" stays
   * unticked, so the user's defaults and the other specs are not affected). Saving closes every
   * open window. Pick the role before the organization: changing the role resets the rest.
   */
  async switchProfile(selection: ProfileSelection): Promise<void> {
    await this.page.getByTestId(AUTH_TEST_IDS.profileMenu).click();
    await this.pickProfile(selection);
    await this.saveProfile();
  }

  /** Reads the role, organization and warehouse of the session from the profile menu, then closes it. */
  async currentProfile(): Promise<Profile> {
    await this.page.getByTestId(AUTH_TEST_IDS.profileMenu).click();
    const profile = await this.shownProfile();
    await this.cancelProfile();
    return profile;
  }

  /**
   * Picks a role and/or an organization in the profile menu and reads what it fills in and the
   * organization and warehouse lists it offers, in their order. Cancels the menu: the session
   * does not change.
   */
  async previewProfile(selection: RoleSelection): Promise<ProfilePreview> {
    await this.page.getByTestId(AUTH_TEST_IDS.profileMenu).click();
    await this.pickProfile(selection);
    const preview = {
      ...(await this.shownProfile()),
      organizations: await this.optionTexts(PROFILE_SELECTS.organization),
      warehouses: await this.optionTexts(PROFILE_SELECTS.warehouse),
    };
    await this.cancelProfile();
    return preview;
  }

  /** Logs out through the profile menu. */
  async logout(): Promise<void> {
    await this.page.getByTestId(AUTH_TEST_IDS.profileMenu).click();
    await this.page.getByTestId(AUTH_TEST_IDS.logout).click();
  }

  /** Asserts the session was closed: the login form is back and shows `message` (its title). */
  async expectLoggedOutWith(message: string | RegExp): Promise<void> {
    await expect(this.loginForm).toBeVisible({ timeout: LANDING_TIMEOUT });
    await expect(this.page.getByText(message)).toBeVisible();
  }

  /** Asserts the session is still open: the login form is not on screen. */
  async expectStillLoggedIn(): Promise<void> {
    await expect(this.loginForm).toHaveCount(0);
  }

  /** The user name input of the login form. */
  private get loginForm(): Locator {
    return this.page.locator("#username");
  }

  /**
   * Saves the profile menu and waits until it closes: it closes once the session has the new
   * profile (new token, its server-side session and CSRF token). A request sent before that, such
   * as a datasource write of the `api` fixture, would still carry the previous token.
   */
  private async saveProfile(): Promise<void> {
    await this.page.getByTestId(AUTH_TEST_IDS.profileSave).click();
    await expect(this.page.getByTestId(AUTH_TEST_IDS.profileSave)).toBeHidden({ timeout: LANDING_TIMEOUT });
  }

  /** Picks, in this order, the role, organization and warehouse given; the others are left as filled in. */
  private async pickProfile({ roleName, organizationName, warehouseName }: ProfileSelection): Promise<void> {
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
  }

  /** The role, organization and warehouse the open profile menu shows. */
  private async shownProfile(): Promise<Profile> {
    const selectedValue = (selectId: string) => this.page.locator(`#${selectId}`).inputValue();
    return {
      role: await selectedValue(PROFILE_SELECTS.role),
      organization: await selectedValue(PROFILE_SELECTS.organization),
      warehouse: await selectedValue(PROFILE_SELECTS.warehouse),
    };
  }

  /** Opens a select of the profile menu, reads its options in order and closes it (Escape only closes the list). */
  private async optionTexts(selectId: string): Promise<string[]> {
    const options = this.page.locator(`[id^="${selectId}-option-"]`);
    await this.page.locator(`#${selectId}`).click();
    await options.first().waitFor();
    const texts = (await options.allInnerTexts()).map((text) => text.trim());
    await this.page.keyboard.press("Escape");
    await expect(options).toHaveCount(0);
    return texts;
  }

  private async cancelProfile(): Promise<void> {
    await this.page.getByRole("button", { name: CANCEL_LABEL, exact: true }).click();
  }

  private async pickOption(selectId: string, optionText: string): Promise<void> {
    await this.page.locator(`#${selectId}`).click();
    await this.page.locator(`[id^="${selectId}-option-"]`).filter({ hasText: optionText }).click();
  }
}

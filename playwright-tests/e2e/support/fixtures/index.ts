/**
 * Test fixtures. Specs import `test` and `expect` from here instead of `@playwright/test`.
 *
 *   import { test, expect } from "../../support/fixtures";
 *
 *   test("books an order", async ({ app, data }) => {
 *     await app.sidebar.navigateTo("purchaseOrder");
 *     ...
 *   });
 *
 * Every test starts logged out: cookies and storage are cleared before it runs. `app` then
 * logs in and selects the default role and organization. Change it per file with `test.use({ session: LOGIN_ONLY })` or
 * `test.use({ session: NO_SESSION })`.
 *
 * Sessions are not shared through `storageState`: specs change the role, the default role and
 * even the user (ADMa logs in as the user it creates), and the Classic session keeps that
 * context server side. Logging in per test keeps every test independent.
 */
import { test as base } from "@playwright/test";
import { ApiData } from "../api/ApiData";
import { App, type RoleSelection } from "../components";
import * as data from "../registry/data";

/** What the `app` fixture prepares before the test. */
export interface SessionOptions {
  /** Log in with the default user. */
  login: boolean;
  /** Role and organization to select after logging in; none keeps the user's default. */
  role?: RoleSelection;
}

/** Logged in with the default role ("QA Testing Admin") and organization ("Spain"). */
export const DEFAULT_SESSION: SessionOptions = { login: true, role: {} };
/** Logged in, keeping the user's default role. */
export const LOGIN_ONLY: SessionOptions = { login: true };
/** Logged out, on a blank page. */
export const NO_SESSION: SessionOptions = { login: false };

interface Fixtures {
  /** Clears cookies and storage before every test (automatic). */
  cleanState: undefined;
  /** Session the `app` fixture prepares. An option: override it with `test.use`. */
  session: SessionOptions;
  /** The application, already in the requested session. */
  app: App;
  /** Named test data (`registry/data.ts`). */
  data: typeof data;
  /** Creates and deletes records through the datasource, in the session of `app`. */
  api: ApiData;
}

export const test = base.extend<Fixtures>({
  cleanState: [
    async ({ page }, use) => {
      await new App(page).auth.cleanup();
      await use(undefined);
    },
    { auto: true },
  ],
  session: [DEFAULT_SESSION, { option: true }],
  app: async ({ page, session }, use) => {
    const app = new App(page);
    if (session.login) {
      await app.auth.login();
    }
    if (session.login && session.role) {
      await app.auth.selectRoleOrgWarehouse(session.role);
    }
    await use(app);
  },
  // biome-ignore lint/correctness/noEmptyPattern: Playwright fixtures must destructure their dependencies
  data: async ({}, use) => {
    await use(data);
  },
  api: async ({ app }, use) => {
    await use(new ApiData(app.page));
  },
});

export { expect } from "@playwright/test";

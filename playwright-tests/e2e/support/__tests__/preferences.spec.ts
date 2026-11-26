import { expect, test } from "@playwright/test";
import type { ApiData, SavedRecord } from "../api/ApiData";
import type { App } from "../components";
import { recordLink } from "../flows/navigation";
import { restoreShownPreferences, SAVED_PREFERENCE_REQUEST, setWindowPreferences } from "../flows/preferences";

const WINDOW_ID = "140";
const SHOWN = "OBUIAPP_ShowImplicitFilterMsg";

/** An `api` that records the preferences it adds and saves. */
function fakeApi() {
  const calls: string[] = [];
  const api = {
    add: async (_target: unknown, values: { property?: string; attribute?: string }) => {
      calls.push(`add ${values.property ?? values.attribute}`);
      return { id: `id-${calls.length}` } as SavedRecord;
    },
    savePreference: async (name: string, value: string) => {
      calls.push(`save ${name}=${value}`);
    },
  };
  return { api: api as unknown as ApiData, calls };
}

/** An `app` whose login steps only record their names. */
function fakeApp(calls: string[]) {
  const step = (name: string) => async () => {
    calls.push(name);
  };
  return {
    auth: { logout: step("logout"), login: step("login"), selectRoleOrgWarehouse: step("role") },
  } as unknown as App;
}

test("setWindowPreferences keeps the created records and logs in again to read them", async () => {
  const { api, calls } = fakeApi();
  const created: SavedRecord[] = [];
  await setWindowPreferences(fakeApp(calls), api, created, WINDOW_ID, [
    { name: "ShowAcct", value: "N", propertyList: false },
    { name: "dataPageSize", value: "5", propertyList: true },
  ]);
  expect(created.map(({ id }) => id)).toEqual(["id-1", "id-2"]);
  expect(calls).toEqual(["add ShowAcct", "add dataPageSize", "logout", "login", "role"]);
});

test("restoreShownPreferences sets each preference back to Y once", async () => {
  const { api, calls } = fakeApi();
  const names = new Set([SHOWN]);
  await restoreShownPreferences(api, names);
  await restoreShownPreferences(api, names);
  expect(calls).toEqual([`save ${SHOWN}=Y`]);
  expect(names.size).toBe(0);
});

test("SAVED_PREFERENCE_REQUEST matches the preference request", () => {
  expect(SAVED_PREFERENCE_REQUEST.test("http://localhost:3000/api/erp/meta/preferences")).toBe(true);
  expect(SAVED_PREFERENCE_REQUEST.test("http://localhost:3000/api/erp/meta/session")).toBe(false);
});

test("recordLink opens the record of the tab in a new window instance", () => {
  expect(recordLink(WINDOW_ID, "180", "ABC")).toMatch(/^\/window\?wi_0=140_\d+&ti_0=180&ri_0=ABC$/);
});

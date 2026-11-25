/** Preferences a spec needs for one window of its own user, created through the `api` fixture. */
import type { ApiData, SavedRecord } from "../api/ApiData";
import type { App } from "../components";
import { ORGANIZATION_ID, USER_ID } from "../registry/data";
import { DATASOURCE } from "../registry/datasources";

/** A preference: a property of the Property List (`propertyList`) or a free attribute. */
export interface WindowPreference {
  name: string;
  value: string;
  propertyList: boolean;
}

/** The name of a preference goes in `property` when it is in the Property List, in `attribute` otherwise. */
function preferenceName({ name, propertyList }: WindowPreference): Record<string, string> {
  if (propertyList) {
    return { property: name };
  }
  return { attribute: name };
}

/** Creates a preference for the user of the suite, for `windowId` only or, without it, for every window. */
function addPreference(api: ApiData, preference: WindowPreference, windowId?: string): Promise<SavedRecord> {
  return api.add(DATASOURCE.PREFERENCE, {
    organization: ORGANIZATION_ID.ALL,
    propertyList: preference.propertyList,
    ...preferenceName(preference),
    searchKey: preference.value,
    userContact: USER_ID.ADMIN,
    window: windowId,
  });
}

/**
 * Creates `preferences` for the user of the suite and `windowId` only, so no other spec is affected. The
 * caller removes the returned records in `test.afterEach`.
 */
export async function addWindowPreferences(
  api: ApiData,
  windowId: string,
  preferences: readonly WindowPreference[]
): Promise<SavedRecord[]> {
  const records: SavedRecord[] = [];
  for (const preference of preferences) {
    records.push(await addPreference(api, preference, windowId));
  }
  return records;
}

/**
 * Creates a preference for the user of the suite in every window, for a preference the server reads without
 * a window (e.g. `ShowProductCharacteristicsParents`). The caller removes it in `test.afterEach`.
 */
export function addUserPreference(api: ApiData, preference: WindowPreference): Promise<SavedRecord> {
  return addPreference(api, preference);
}

/**
 * Logs in again with the role of the suite, so the session reads the preferences just created (a page load
 * reads them too) and starts without the windows of the previous steps.
 */
export async function reloginToReadPreferences(app: App): Promise<void> {
  await app.auth.logout();
  await app.auth.login();
  await app.auth.selectRoleOrgWarehouse();
}

/** Removes the preferences a spec created (in `test.afterEach`, while the page is still open). */
export async function removePreferences(api: ApiData, preferences: SavedRecord[]): Promise<void> {
  while (preferences.length > 0) {
    const preference = preferences.pop();
    if (preference) {
      await api.remove(DATASOURCE.PREFERENCE, preference.id);
    }
  }
}

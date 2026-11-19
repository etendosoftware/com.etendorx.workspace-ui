/**
 * Overrides of a process definition, of a field or of a tab inside the window metadata the UI loads. They let a spec
 * reach client behavior the bare core has no data for, e.g. a migrated onProcess
 * (`em_etmeta_onprocess` is empty in every core process): the spec gives the property, the UI
 * runs it as it would run one stored in the database.
 */
import type { Page } from "@playwright/test";

/** Process definition properties to set, e.g. `{ etmetaOnprocess: "async () => …" }`. */
export type ProcessDefinitionOverrides = Readonly<Record<string, unknown>>;

/** How many process definitions an override changed; 0 means it never matched. */
export interface AppliedOverride {
  readonly applied: number;
}

interface FieldMetadata {
  id?: string;
  processDefinition?: { id?: string } & Record<string, unknown>;
}

/** Field properties to set, e.g. `{ readOnlyLogicExpression: "…" }`. */
export type FieldOverrides = Readonly<Record<string, unknown>>;

/** Tab properties to set, e.g. `{ deletableRecords: false }`. */
export type TabOverrides = Readonly<Record<string, unknown>>;

interface TabMetadata {
  id?: string;
  fields?: Record<string, FieldMetadata>;
}

interface WindowMetadata {
  tabs?: TabMetadata[];
}

const SUCCESS_STATUS = 200;

/**
 * Sets `overrides` on every button of `metadata` (`tabs[].fields.<field>.processDefinition`)
 * that runs `processId`.
 * @returns the number of process definitions changed.
 */
export function applyProcessOverrides(
  metadata: WindowMetadata,
  processId: string,
  overrides: ProcessDefinitionOverrides
): number {
  const definitions = (metadata.tabs ?? [])
    .flatMap((tab) => Object.values(tab.fields ?? {}))
    .map((field) => field.processDefinition)
    .filter((definition) => definition?.id === processId);
  for (const definition of definitions) {
    Object.assign(definition as object, overrides);
  }
  return definitions.length;
}

/**
 * Sets `overrides` on every field of `metadata` (`tabs[].fields.<field>`) whose AD_Field_ID is `fieldId`.
 * @returns the number of fields changed.
 */
export function applyFieldOverrides(metadata: WindowMetadata, fieldId: string, overrides: FieldOverrides): number {
  const fields = (metadata.tabs ?? [])
    .flatMap((tab) => Object.values(tab.fields ?? {}))
    .filter((field) => field.id === fieldId);
  for (const field of fields) {
    Object.assign(field, overrides);
  }
  return fields.length;
}

/**
 * Sets `overrides` on the tab of `metadata` (`tabs[]`) whose AD_Tab_ID is `tabId`.
 * @returns the number of tabs changed.
 */
export function applyTabOverrides(metadata: WindowMetadata, tabId: string, overrides: TabOverrides): number {
  const tabs = (metadata.tabs ?? []).filter((tab) => tab.id === tabId);
  for (const tab of tabs) {
    Object.assign(tab, overrides);
  }
  return tabs.length;
}

/** Body of `/api/erp/meta/preferences`: every preference of the session, by key. */
interface PreferencesBody {
  preferences?: Record<string, string>;
}

/** Body of `/api/erp/meta/session`: the role of the session among other data. */
interface SessionBody {
  currentRole?: Record<string, unknown>;
}

/** URL of the request that loads the preferences of the session. */
export const PREFERENCES_URL = /\/api\/erp\/meta\/preferences(\?|$)/;

/** URL of the request that loads the session (user, role, organization). */
export const SESSION_URL = /\/api\/erp\/meta\/session(\?|$)/;

/**
 * Sets `values` in the preference map of a `meta/preferences` answer. Answers without a map (an error, a
 * write) are left as they are.
 * @returns whether the map was changed.
 */
export function applyPreferenceOverrides(body: PreferencesBody, values: Readonly<Record<string, string>>): boolean {
  if (!body.preferences) {
    return false;
  }
  Object.assign(body.preferences, values);
  return true;
}

/**
 * Sets `overrides` on the role of a `meta/session` answer.
 * @returns whether the role was changed.
 */
export function applySessionRoleOverrides(body: SessionBody, overrides: Readonly<Record<string, unknown>>): boolean {
  if (!body.currentRole) {
    return false;
  }
  Object.assign(body.currentRole, overrides);
  return true;
}

/** URL of the metadata request of a window (`/api/erp/meta/window/<id>`, with or without query). */
export function windowMetadataUrl(windowId: string): RegExp {
  return new RegExp(`/api/erp/meta/window/${windowId}(\\?|$)`);
}

/** URL of the metadata request of a process definition (`/api/erp/meta/process/<id>`). */
export function processMetadataUrl(processId: string): RegExp {
  return new RegExp(`/api/erp/meta/process/${processId}(\\?|$)`);
}

/** Answers a metadata request with its live response, changed by `apply` when it succeeded. */
async function routeChanged(page: Page, url: RegExp, apply: (metadata: object) => void): Promise<void> {
  await page.route(url, async (route) => {
    const response = await route.fetch();
    if (response.status() !== SUCCESS_STATUS) {
      await route.fulfill({ response });
      return;
    }
    const metadata = (await response.json()) as object;
    apply(metadata);
    await route.fulfill({ response, json: metadata });
  });
}

/**
 * Applies `overrides` to the process definition `processId`, from the next time the page loads it:
 * in the metadata of `windowId` (the buttons of its tabs) and in the process metadata the modal
 * fetches and merges over it (a definition without parameters is always fetched again). Call it
 * before opening the window. A new browser context has an empty HTTP cache, so the metadata
 * arrives as a full response, never a 304.
 * @returns the count of changed definitions in the window metadata, to assert the override matched.
 */
export async function overrideProcessDefinition(
  page: Page,
  windowId: string,
  processId: string,
  overrides: ProcessDefinitionOverrides
): Promise<AppliedOverride> {
  const state = { applied: 0 };
  await routeChanged(page, windowMetadataUrl(windowId), (metadata) => {
    state.applied += applyProcessOverrides(metadata as WindowMetadata, processId, overrides);
  });
  await routeChanged(page, processMetadataUrl(processId), (metadata) => {
    Object.assign(metadata, overrides);
  });
  return state;
}

/**
 * Applies `overrides` to the field `fieldId` of the window `windowId`, from the next time the page loads
 * its metadata, e.g. a read-only logic on a process button the bare core has none for. Call it before
 * opening the window.
 * @returns the count of changed fields, to assert the override matched.
 */
export async function overrideField(
  page: Page,
  windowId: string,
  fieldId: string,
  overrides: FieldOverrides
): Promise<AppliedOverride> {
  const state = { applied: 0 };
  await routeChanged(page, windowMetadataUrl(windowId), (metadata) => {
    state.applied += applyFieldOverrides(metadata as WindowMetadata, fieldId, overrides);
  });
  return state;
}

/**
 * Applies `overrides` to the tab `tabId` of the window `windowId`, from the next time the page loads its
 * metadata, e.g. `deletableRecords: false` for a table that does not allow deleting records, which the sample
 * data has none of. Call it before opening the window.
 * @returns the count of changed tabs, to assert the override matched.
 */
export async function overrideTab(
  page: Page,
  windowId: string,
  tabId: string,
  overrides: TabOverrides
): Promise<AppliedOverride> {
  const state = { applied: 0 };
  await routeChanged(page, windowMetadataUrl(windowId), (metadata) => {
    state.applied += applyTabOverrides(metadata as WindowMetadata, tabId, overrides);
  });
  return state;
}

/**
 * Adds `values` to the preferences the page loads, from the next time it loads them (a login or a page
 * load). For a preference that cannot be scoped to a window (`StartPage`, `LogoutRedirectURL`): created
 * for real, it would reach every spec logged in as the same user meanwhile. `values` is read on every
 * answer, so a test can change it between two logins.
 * @returns the count of answers changed, to assert the override was used.
 */
export async function overridePreferences(
  page: Page,
  values: Readonly<Record<string, string>>
): Promise<AppliedOverride> {
  const state = { applied: 0 };
  await routeChanged(page, PREFERENCES_URL, (body) => {
    state.applied += Number(applyPreferenceOverrides(body as PreferencesBody, values));
  });
  return state;
}

/**
 * Changes the role of the session the page loads, from the next time it loads it. The sample data has no
 * role without administration rights in the client of the suite; a lower `userLevel` makes the UI treat the
 * user as a regular one (the server keeps its own checks).
 * @returns the count of answers changed, to assert the override was used.
 */
export async function overrideSessionRole(
  page: Page,
  overrides: Readonly<Record<string, unknown>>
): Promise<AppliedOverride> {
  const state = { applied: 0 };
  await routeChanged(page, SESSION_URL, (body) => {
    state.applied += Number(applySessionRoleOverrides(body as SessionBody, overrides));
  });
  return state;
}

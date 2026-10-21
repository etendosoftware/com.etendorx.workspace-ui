/**
 * Overrides of a process definition inside the window metadata the UI loads. They let a spec
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
  processDefinition?: { id?: string } & Record<string, unknown>;
}

interface WindowMetadata {
  tabs?: { fields?: Record<string, FieldMetadata> }[];
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

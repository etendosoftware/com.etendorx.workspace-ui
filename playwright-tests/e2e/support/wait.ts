/**
 * Waiting policy: wait for a network response or a UI state, never for a fixed time.
 *
 * Etendo keeps SSE connections open, so `waitForLoadState("networkidle")` never settles; wait
 * for the specific request the action triggers instead.
 */
import { expect, type Page, type Response } from "@playwright/test";

/** Full-screen overlay shown while the app loads or saves; it intercepts pointer events. */
export const LOADING_OVERLAY = "div.absolute.h-screen.w-screen";

const FORM_INITIALIZATION_URL = /FormInitializationComponent/;
const DATASOURCE_URL = /api\/datasource/;
const DEFAULT_RESPONSE_TIMEOUT = 30_000;
const OVERLAY_TIMEOUT = 20_000;

/** Waits until the loading overlay is gone. Fails if it is still there after the timeout. */
export async function waitForNoOverlay(page: Page, timeout = OVERLAY_TIMEOUT): Promise<void> {
  await expect(page.locator(LOADING_OVERLAY)).toHaveCount(0, { timeout });
}

/**
 * Runs `action` and waits for the first response whose URL matches `url` (or that `url` accepts).
 * The listener is registered before the action, so a fast response is never missed.
 */
export async function runAndWaitForResponse(
  page: Page,
  url: RegExp | ((response: Response) => boolean),
  action: () => Promise<unknown>,
  timeout = DEFAULT_RESPONSE_TIMEOUT
): Promise<Response> {
  const response = page.waitForResponse(url, { timeout });
  await action();
  return response;
}

/** Runs `action` (e.g. picking a product) and waits for the FormInitialization callout response. */
export function runAndWaitForFormInitialization(page: Page, action: () => Promise<unknown>, timeout?: number) {
  return runAndWaitForResponse(page, FORM_INITIALIZATION_URL, action, timeout);
}

/** Runs `action` (e.g. applying a grid filter) and waits for the datasource response. */
export function runAndWaitForDatasource(page: Page, action: () => Promise<unknown>, timeout?: number) {
  return runAndWaitForResponse(page, DATASOURCE_URL, action, timeout);
}

/** Params the UI posts to `/api/datasource` (`{ entity, params }`), e.g. `_orderBy` or `_sortBy`. */
export type DatasourceRequestParams = Record<string, unknown>;

const FETCH_OPERATION = "fetch";

/**
 * Params of a datasource request body when it fetches the grid records of `tabId`: a summary request of the
 * same tab and requests of other tabs give `undefined`.
 */
export function gridFetchParams(body: unknown, tabId: string): DatasourceRequestParams | undefined {
  const params = (body as { params?: DatasourceRequestParams } | null)?.params;
  if (params?.tabId !== tabId || params._operationType !== FETCH_OPERATION || "_summary" in params) {
    return undefined;
  }
  return params;
}

/** A criterion of a datasource request: the field it filters, how and by which value. */
export interface DatasourceCriterion {
  fieldName?: string;
  operator?: string;
  value?: unknown;
}

/**
 * Criteria of datasource request params: the UI posts each criterion as a JSON string, alone or in a list.
 */
export function datasourceCriteria(params: DatasourceRequestParams): DatasourceCriterion[] {
  const criteria = params.criteria;
  if (criteria === undefined) {
    return [];
  }
  const entries = Array.isArray(criteria) ? criteria : [criteria];
  return entries.map((entry) => (typeof entry === "string" ? JSON.parse(entry) : entry) as DatasourceCriterion);
}

/**
 * Runs `action` (e.g. opening a tab) and returns the params of the request that fetches the grid records of
 * `tabId`, to assert what the UI asked the server for (sort, criteria).
 */
export async function runAndCaptureGridFetch(
  page: Page,
  tabId: string,
  action: () => Promise<unknown>,
  timeout?: number
): Promise<DatasourceRequestParams> {
  const isGridFetch = (response: Response) =>
    DATASOURCE_URL.test(response.url()) && gridFetchParams(response.request().postDataJSON(), tabId) !== undefined;
  const response = await runAndWaitForResponse(page, isGridFetch, action, timeout);
  return gridFetchParams(response.request().postDataJSON(), tabId) ?? {};
}

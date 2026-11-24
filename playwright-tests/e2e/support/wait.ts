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

/**
 * Records the ids of the rows every response to a grid fetch of `tabId` brings from now on, in the order they
 * arrive: a record the grid asked for twice shows twice. Await `ids()` once the pages of interest loaded.
 */
export function collectGridFetchedIds(page: Page, tabId: string): { ids: () => Promise<string[]> } {
  const pages = collectFetchedPages(page, (body) => gridFetchParams(body, tabId));
  return { ids: async () => (await pages()).flatMap((fetched) => fetched.ids) };
}

/** A page a datasource answered: the params of its request and the ids of its rows. */
export interface FetchedPage {
  params: DatasourceRequestParams;
  /** Rows of the answer, also those without id (the empty option a dropdown of an optional field gets). */
  rows: number;
  ids: string[];
}

/**
 * Params of a datasource request body when it fetches the options of the dropdown of the field whose property
 * is `hqlName` (`initiatorField`); other requests give `undefined`.
 */
export function optionsFetchParams(body: unknown, hqlName: string): DatasourceRequestParams | undefined {
  const params = (body as { params?: DatasourceRequestParams } | null)?.params;
  if (params?.initiatorField !== hqlName || params._operationType !== FETCH_OPERATION) {
    return undefined;
  }
  return params;
}

/**
 * Records every page of options the dropdown of the field `hqlName` fetches from now on, in the order they
 * arrive. Await `pages()` once the pages of interest loaded.
 */
export function collectFieldOptionPages(page: Page, hqlName: string): { pages: () => Promise<FetchedPage[]> } {
  return { pages: collectFetchedPages(page, (body) => optionsFetchParams(body, hqlName)) };
}

/** Runs `action` (e.g. scrolling a dropdown) and waits for the options the dropdown of `hqlName` fetches. */
export function runAndWaitForFieldOptions(page: Page, hqlName: string, action: () => Promise<unknown>) {
  const isOptionsFetch = (response: Response) =>
    DATASOURCE_URL.test(response.url()) && optionsFetchParams(response.request().postDataJSON(), hqlName) !== undefined;
  return runAndWaitForResponse(page, isOptionsFetch, action);
}

/** Pages of the datasource responses whose request `readParams` accepts, from now on. */
function collectFetchedPages(
  page: Page,
  readParams: (body: unknown) => DatasourceRequestParams | undefined
): () => Promise<FetchedPage[]> {
  const pages: Promise<FetchedPage>[] = [];
  page.on("response", (response) => {
    if (!DATASOURCE_URL.test(response.url())) {
      return;
    }
    const params = readParams(response.request().postDataJSON());
    if (params) {
      pages.push(response.json().then((body) => ({ params, rows: fetchedRows(body).length, ids: fetchedIds(body) })));
    }
  });
  return () => Promise.all(pages);
}

/** Ids of the rows of a datasource response body, leaving out rows without id (a dropdown's empty option). */
export function fetchedIds(body: unknown): string[] {
  return fetchedRows(body)
    .filter((row) => row.id !== undefined && row.id !== null)
    .map((row) => String(row.id));
}

/** Rows of a datasource response body. */
function fetchedRows(body: unknown): Array<{ id?: unknown }> {
  return (body as { response?: { data?: Array<{ id?: unknown }> } } | null)?.response?.data ?? [];
}

/**
 * Records the params of every request that fetches the grid records of `tabId` from now on, as they are
 * sent: to check pages the UI asks for by itself (no response to wait for in between).
 */
export function collectGridFetches(page: Page, tabId: string): DatasourceRequestParams[] {
  const fetches: DatasourceRequestParams[] = [];
  page.on("request", (request) => {
    if (!DATASOURCE_URL.test(request.url())) {
      return;
    }
    const params = gridFetchParams(request.postDataJSON(), tabId);
    if (params) {
      fetches.push(params);
    }
  });
  return fetches;
}

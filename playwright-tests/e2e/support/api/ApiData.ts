import type { Page } from "@playwright/test";
import type { DatasourceTarget } from "../registry/datasources";

/** Record values sent to or returned by the datasource, keyed by property name. */
export type RecordValues = Record<string, unknown>;

/** A record the backend saved: its values plus the id it was given. */
export interface SavedRecord extends RecordValues {
  id: string;
}

export type WriteOperation = "add" | "remove";

const DATASOURCE_PATH = "/api/datasource";
/** Column order, visibility and sort the grid saves per user, window and tab (ETMETA_GridConfiguration). */
const GRID_CONFIGURATION_PATH = "/api/erp/meta/grid-configuration";
const DATA_SOURCE = "isc_OBViewDataSource_0";
const ADD: WriteOperation = "add";
const REMOVE: WriteOperation = "remove";
const FORM_COMPONENT = "isc_OBViewForm_0";
/** The Next.js route replaces it with the CSRF token of the server-side session. */
const CSRF_PLACEHOLDER = "e2e";
const TOKEN_STORAGE_KEY = "token";
const SUCCESS_STATUS = 0;

/** URL of a datasource write, with the same query parameters the UI sends. */
export function datasourceWriteUrl(target: DatasourceTarget, operation: WriteOperation, recordId?: string): string {
  const params = new URLSearchParams({
    windowId: target.windowId,
    tabId: target.tabId,
    moduleId: "0",
    _operationType: operation,
    _noActiveFilter: "true",
    sendOriginalIDBack: "true",
    _extraProperties: "",
    Constants_FIELDSEPARATOR: "$",
    _className: "OBViewDataSource",
    Constants_IDENTIFIER: "_identifier",
    isc_dataFormat: "json",
  });
  if (recordId) {
    params.set("id", recordId);
  }
  return `${DATASOURCE_PATH}/${target.entity}?${params.toString()}`;
}

/** Body of a datasource record creation, as the UI sends it when it saves a new record. */
export function datasourceAddBody(data: RecordValues): RecordValues {
  return {
    dataSource: DATA_SOURCE,
    operationType: ADD,
    componentId: FORM_COMPONENT,
    data,
    csrfToken: CSRF_PLACEHOLDER,
  };
}

/** One condition of a datasource read, e.g. `{ fieldName: "bankStatement.processed", operator: "equals", value: true }`. */
export interface FetchCriterion {
  fieldName: string;
  operator: string;
  value: unknown;
}

/** A datasource read: conditions that must all hold, an optional sort (`-name` descending) and a row limit. */
export interface FetchQuery {
  criteria: FetchCriterion[];
  sortBy?: string;
  limit?: number;
}

const DEFAULT_FETCH_LIMIT = 100;

/** Body of a datasource read (`POST /api/datasource`), with the parameters a grid sends. */
export function datasourceFetchBody(target: DatasourceTarget, query: FetchQuery): RecordValues {
  const params: RecordValues = {
    windowId: target.windowId,
    tabId: target.tabId,
    _operationType: "fetch",
    _noCount: "true",
    _startRow: "0",
    _endRow: String(query.limit ?? DEFAULT_FETCH_LIMIT),
    _constructor: "AdvancedCriteria",
    operator: "and",
    criteria: query.criteria.map((criterion) => JSON.stringify(criterion)),
  };
  if (query.sortBy) {
    params._sortBy = query.sortBy;
  }
  return { entity: target.entity, params };
}

/**
 * The records a datasource read answered with.
 * @throws when the answer has no record list (an error or an unexpected body).
 */
export function fetchedRecordsFrom(body: unknown, entity: string): RecordValues[] {
  const records = (body as { response?: { data?: unknown } })?.response?.data;
  if (!Array.isArray(records)) {
    throw new Error(`Reading ${entity} through the datasource failed: ${JSON.stringify(body)}`);
  }
  return records as RecordValues[];
}

/** Body that removes the saved grid configuration of one tab, as the UI sends it (`configuration: null`). */
export function gridConfigurationResetBody(windowId: string, tabId: string): RecordValues {
  return { windowId, tabId, configuration: null };
}

type WriteResponse = { status?: number; data?: SavedRecord[]; error?: { message?: string } };

/**
 * The `response` of a datasource write (`{ response: { status, data } }`).
 * @throws when the backend rejected the write, with its message.
 */
function acceptedResponse(body: unknown, entity: string): WriteResponse {
  const response = (body as { response?: WriteResponse })?.response;
  if (response?.status !== SUCCESS_STATUS) {
    const reason = response?.error?.message ?? JSON.stringify(body);
    throw new Error(`Writing ${entity} through the datasource failed: ${reason}`);
  }
  return response;
}

/**
 * The record a datasource creation answered with.
 * @throws when the backend rejected it or answered without a record.
 */
export function savedRecordFrom(body: unknown, entity: string): SavedRecord {
  const record = acceptedResponse(body, entity).data?.[0];
  if (!record?.id) {
    throw new Error(`Writing ${entity} through the datasource answered without a record: ${JSON.stringify(body)}`);
  }
  return record;
}

/**
 * Checks the answer of a datasource deletion.
 * @throws when the backend rejected it, with its message.
 */
export function assertRemoved(body: unknown, entity: string): void {
  acceptedResponse(body, entity);
}

/**
 * Creates, reads and deletes records through the datasource, as the UI does when it loads, saves or deletes.
 * For data a spec needs to exist but does not test the creation of: it is much faster than the
 * UI. Needs a logged-in page (the request reuses its token and server-side session).
 */
export class ApiData {
  constructor(private readonly page: Page) {}

  /** Creates a record and returns it as saved (with its id and the defaults the backend set). */
  async add(target: DatasourceTarget, values: RecordValues): Promise<SavedRecord> {
    const response = await this.page.request.post(datasourceWriteUrl(target, ADD), {
      headers: await this.authHeaders(),
      data: datasourceAddBody(values),
    });
    return savedRecordFrom(await response.json(), target.entity);
  }

  /** Reads records through the datasource, as a grid does, with the tab's rules applied. */
  async fetch(target: DatasourceTarget, query: FetchQuery): Promise<RecordValues[]> {
    const response = await this.page.request.post(DATASOURCE_PATH, {
      headers: await this.authHeaders(),
      data: datasourceFetchBody(target, query),
    });
    return fetchedRecordsFrom(await response.json(), target.entity);
  }

  /** Deletes a record by id, with the DELETE request the UI sends (a POST "remove" deletes nothing). */
  async remove(target: DatasourceTarget, id: string): Promise<void> {
    const response = await this.page.request.delete(datasourceWriteUrl(target, REMOVE, id), {
      headers: await this.authHeaders(),
    });
    assertRemoved(await response.json(), target.entity);
  }

  /**
   * Removes the grid configuration (column order, visibility, sort) the user has saved for a tab,
   * so the grid shows its defaults. The grid saves it by itself when it is sorted or rearranged.
   */
  async resetGridConfiguration(windowId: string, tabId: string): Promise<void> {
    const response = await this.page.request.put(GRID_CONFIGURATION_PATH, {
      headers: await this.authHeaders(),
      data: gridConfigurationResetBody(windowId, tabId),
    });
    if (!response.ok()) {
      throw new Error(`Resetting the grid configuration of tab ${tabId} failed: ${response.status()}`);
    }
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.page.evaluate((key) => localStorage.getItem(key), TOKEN_STORAGE_KEY);
    if (!token) {
      throw new Error("The api fixture needs a logged-in page: no token in localStorage");
    }
    return { Authorization: `Bearer ${token}` };
  }
}

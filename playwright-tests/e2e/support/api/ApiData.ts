import type { APIResponse, Page } from "@playwright/test";
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
const PROCESS_METADATA_PATH = "/api/erp/meta/process";
const PREFERENCES_PATH = "/api/erp/meta/preferences";
const RECENT_DOCUMENTS_PATH = "/api/erp/sws/com.etendoerp.metadata.meta/recent-documents";
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
  /** Also read the inactive records, as a window grid does (`_noActiveFilter`). */
  includeInactive?: boolean;
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
  if (query.includeInactive) {
    params._noActiveFilter = "true";
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

/** Body that stores the grid configuration of one tab, as the UI sends it; `null` removes it. */
export function gridConfigurationBody(
  windowId: string,
  tabId: string,
  configuration: RecordValues | null
): RecordValues {
  return { windowId, tabId, configuration };
}

/** Body that removes the saved grid configuration of one tab, as the UI sends it (`configuration: null`). */
export function gridConfigurationResetBody(windowId: string, tabId: string): RecordValues {
  return gridConfigurationBody(windowId, tabId, null);
}

/**
 * Datasource of the trees with an `ADTree` structure (`ADTreeDatasourceService`), e.g. product categories or
 * characteristic values.
 */
export const AD_TREE_DATASOURCE = "90034CAE96E847D78FBEF6D38CB1930D";

/** A tree node moved under a new parent, as a node dropped on another one in the tree view of a tab. */
export interface TreeNodeMove {
  /** AD_Tab_ID of the tab whose tree holds the node. */
  tabId: string;
  /** AD_Table_ID of the records of the tree, which finds the tree of the node. */
  tableId: string;
  /** Id of the record of the node. */
  nodeId: string;
  /** Id of the record of its new parent. */
  parentId: string;
}

/** URL of a tree node move, with the parameters the tree view sends when a node is dropped. */
export function treeNodeMoveUrl(move: TreeNodeMove): string {
  const params = new URLSearchParams({
    _operationType: "update",
    _noActiveFilter: "true",
    tabId: move.tabId,
    referencedTableId: move.tableId,
  });
  return `${DATASOURCE_PATH}/${AD_TREE_DATASOURCE}?${params.toString()}`;
}

/** Body of a tree node move: the node with its new parent. */
export function treeNodeMoveBody(move: TreeNodeMove): RecordValues {
  return {
    operationType: "update",
    data: { id: move.nodeId, parentId: move.parentId },
    oldValues: { id: move.nodeId },
  };
}

type WriteResponse = { status?: number; data?: SavedRecord[]; error?: { message?: string } };

/** What Classic answers to a write whose CSRF token is not the one of its session. */
const INVALID_CSRF_TOKEN = "InvalidCSRFToken";

/**
 * Whether Classic rejected a datasource write for its CSRF token. Right after a login the app's own startup
 * requests can still be settling the server-side session, and a write sent meanwhile is rejected without
 * being applied (ETP-6295), so it is safe to send it again.
 */
export function isInvalidCsrfTokenAnswer(body: unknown): boolean {
  return (body as { response?: WriteResponse })?.response?.error?.message === INVALID_CSRF_TOKEN;
}

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
/** A record the user viewed in form view, as the Home "Recent documents" widget lists it. */
export interface RecentDocument {
  windowId: string;
  windowTitle: string;
  tabId: string;
  tabLevel: number;
  recordId: string;
  identifier: string;
}

/** URL that removes a recent document of the current user and role. */
export function recentDocumentRemoveUrl({ tabId, recordId }: Pick<RecentDocument, "tabId" | "recordId">): string {
  return `${RECENT_DOCUMENTS_PATH}?${new URLSearchParams({ tabId, recordId }).toString()}`;
}

export class ApiData {
  constructor(private readonly page: Page) {}

  /** Creates a record and returns it as saved (with its id and the defaults the backend set). */
  async add(target: DatasourceTarget, values: RecordValues): Promise<SavedRecord> {
    const body = await this.write(async () =>
      this.page.request.post(datasourceWriteUrl(target, ADD), {
        headers: await this.authHeaders(),
        data: datasourceAddBody(values),
      })
    );
    return savedRecordFrom(body, target.entity);
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
    const body = await this.write(async () =>
      this.page.request.delete(datasourceWriteUrl(target, REMOVE, id), { headers: await this.authHeaders() })
    );
    assertRemoved(body, target.entity);
  }

  /**
   * Moves a tree node under another node, with the request the tree view sends when a node is dropped on
   * another one (e.g. a characteristic value into a group).
   * @throws when the backend rejected the move, with its message.
   */
  async moveTreeNode(move: TreeNodeMove): Promise<void> {
    const body = await this.write(async () =>
      this.page.request.put(treeNodeMoveUrl(move), { headers: await this.authHeaders(), data: treeNodeMoveBody(move) })
    );
    acceptedResponse(body, "tree node");
  }

  /**
   * Removes the grid configuration (column order, visibility, sort) the user has saved for a tab,
   * so the grid shows its defaults. The grid saves it by itself when it is sorted or rearranged.
   */
  async resetGridConfiguration(windowId: string, tabId: string): Promise<void> {
    await this.setGridConfiguration(windowId, tabId, null);
  }

  /**
   * Stores a grid configuration (column order, visibility, sort) for the user and a tab, as the grid does
   * when the user rearranges or sorts it; `null` removes it.
   */
  async setGridConfiguration(windowId: string, tabId: string, configuration: RecordValues | null): Promise<void> {
    const response = await this.page.request.put(GRID_CONFIGURATION_PATH, {
      headers: await this.authHeaders(),
      data: gridConfigurationBody(windowId, tabId, configuration),
    });
    if (!response.ok()) {
      throw new Error(`Storing the grid configuration of tab ${tabId} failed: ${response.status()}`);
    }
  }

  /** Resets the stored grid configuration of several tabs, given as `[windowId, tabId]` pairs. */
  async resetGridConfigurations(tabs: ReadonlyArray<readonly [string, string]>): Promise<void> {
    for (const [windowId, tabId] of tabs) {
      await this.resetGridConfiguration(windowId, tabId);
    }
  }

  /**
   * The metadata the backend serves for a process definition (`/meta/process/<id>`), as the process modal
   * loads it: e.g. to wire a core button to a core process the bare core does not attach to any window.
   */
  async processMetadata(processId: string): Promise<RecordValues> {
    const response = await this.page.request.post(`${PROCESS_METADATA_PATH}/${processId}`, {
      headers: await this.authHeaders(),
    });
    if (!response.ok()) {
      throw new Error(`Reading the metadata of process ${processId} failed: ${response.status()}`);
    }
    return (await response.json()) as RecordValues;
  }

  /**
   * Stores a Property List preference for the logged-in user through the endpoint the UI uses
   * (`OB.PropertyStore.set`): the row belongs to the System client, so the datasource cannot delete it, and
   * a spec restores its default value instead.
   */
  async savePreference(property: string, value: string): Promise<void> {
    const response = await this.page.request.post(PREFERENCES_PATH, {
      headers: await this.authHeaders(),
      data: { property, value },
    });
    if (!response.ok()) {
      throw new Error(`Storing the preference ${property} failed: ${response.status()}`);
    }
  }

  /**
   * Adds a record to the recent documents of the user and role, as the form does after the user stays on it.
   * @throws when the backend rejected it.
   */
  async trackRecentDocument(document: RecentDocument): Promise<void> {
    const response = await this.page.request.post(RECENT_DOCUMENTS_PATH, {
      headers: await this.authHeaders(),
      data: document,
    });
    if (!response.ok()) {
      throw new Error(`Tracking the recent document ${document.recordId} failed: ${response.status()}`);
    }
  }

  /** Removes a record from the recent documents of the user and role; nothing happens when it is not there. */
  async removeRecentDocument(document: Pick<RecentDocument, "tabId" | "recordId">): Promise<void> {
    const response = await this.page.request.delete(recentDocumentRemoveUrl(document), {
      headers: await this.authHeaders(),
    });
    if (!response.ok()) {
      throw new Error(`Removing the recent document ${document.recordId} failed: ${response.status()}`);
    }
  }

  /** Sends a datasource write and returns its answer, sending it once more when it was rejected for its CSRF token. */
  private async write(send: () => Promise<APIResponse>): Promise<unknown> {
    const body = await (await send()).json();
    if (!isInvalidCsrfTokenAnswer(body)) {
      return body;
    }
    return (await send()).json();
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.page.evaluate((key) => localStorage.getItem(key), TOKEN_STORAGE_KEY);
    if (!token) {
      throw new Error("The api fixture needs a logged-in page: no token in localStorage");
    }
    return { Authorization: `Bearer ${token}` };
  }
}

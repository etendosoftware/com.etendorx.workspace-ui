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
const DATA_SOURCE = "isc_OBViewDataSource_0";
const COMPONENT_BY_OPERATION: Record<WriteOperation, string> = {
  add: "isc_OBViewForm_0",
  remove: "isc_OBViewGrid_0",
};
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

/** Body of a datasource write, as the UI sends it. */
export function datasourceWriteBody(operation: WriteOperation, data: RecordValues): RecordValues {
  return {
    dataSource: DATA_SOURCE,
    operationType: operation,
    componentId: COMPONENT_BY_OPERATION[operation],
    data,
    csrfToken: CSRF_PLACEHOLDER,
  };
}

/**
 * The record of a datasource write response (`{ response: { status, data: [record] } }`).
 * @throws when the backend rejected the write, with its message.
 */
export function savedRecordFrom(body: unknown, entity: string): SavedRecord {
  const response = (body as { response?: { status?: number; data?: SavedRecord[]; error?: { message?: string } } })
    ?.response;
  const record = response?.data?.[0];
  if (response?.status !== SUCCESS_STATUS || !record?.id) {
    const reason = response?.error?.message ?? JSON.stringify(body);
    throw new Error(`Writing ${entity} through the datasource failed: ${reason}`);
  }
  return record;
}

/**
 * Creates and deletes records through the datasource, as the UI does when it saves or deletes.
 * For data a spec needs to exist but does not test the creation of: it is much faster than the
 * UI. Needs a logged-in page (the request reuses its token and server-side session).
 */
export class ApiData {
  constructor(private readonly page: Page) {}

  /** Creates a record and returns it as saved (with its id and the defaults the backend set). */
  async add(target: DatasourceTarget, values: RecordValues): Promise<SavedRecord> {
    return this.write(target, "add", values);
  }

  /** Deletes a record by id. */
  async remove(target: DatasourceTarget, id: string): Promise<void> {
    await this.write(target, "remove", { id }, id);
  }

  private async write(
    target: DatasourceTarget,
    operation: WriteOperation,
    data: RecordValues,
    recordId?: string
  ): Promise<SavedRecord> {
    const token = await this.page.evaluate((key) => localStorage.getItem(key), TOKEN_STORAGE_KEY);
    if (!token) {
      throw new Error("The api fixture needs a logged-in page: no token in localStorage");
    }
    const response = await this.page.request.post(datasourceWriteUrl(target, operation, recordId), {
      headers: { Authorization: `Bearer ${token}` },
      data: datasourceWriteBody(operation, data),
    });
    return savedRecordFrom(await response.json(), target.entity);
  }
}

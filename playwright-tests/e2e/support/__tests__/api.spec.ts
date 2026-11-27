import { expect, test } from "@playwright/test";
import {
  isInvalidCsrfTokenAnswer,
  assertRemoved,
  datasourceAddBody,
  datasourceFetchBody,
  datasourceWriteUrl,
  fetchedRecordsFrom,
  gridConfigurationBody,
  gridConfigurationResetBody,
  recentDocumentRemoveUrl,
  savedRecordFrom,
  treeNodeMoveBody,
  treeNodeMoveUrl,
  AD_TREE_DATASOURCE,
} from "../api/ApiData";
import { DATASOURCE } from "../registry/datasources";

const TARGET = DATASOURCE.BUSINESS_PARTNER_CATEGORY;
const OPERATION_TYPE = "_operationType";
const RECORD_ID = "44B5B43219F943A99CA55FF32030A9CE";

function queryOf(url: string): URLSearchParams {
  return new URL(url, "http://localhost").searchParams;
}

test.describe("datasourceWriteUrl", () => {
  test("targets the entity with the window and tab of the write", () => {
    const url = datasourceWriteUrl(TARGET, "add");
    expect(url.startsWith(`/api/datasource/${TARGET.entity}?`)).toBe(true);
    const query = queryOf(url);
    expect(query.get("windowId")).toBe(TARGET.windowId);
    expect(query.get("tabId")).toBe(TARGET.tabId);
    expect(query.get(OPERATION_TYPE)).toBe("add");
    expect(query.has("id")).toBe(false);
  });

  test("carries the record id of a removal", () => {
    const query = queryOf(datasourceWriteUrl(TARGET, "remove", RECORD_ID));
    expect(query.get(OPERATION_TYPE)).toBe("remove");
    expect(query.get("id")).toBe(RECORD_ID);
  });
});

test.describe("datasourceAddBody", () => {
  test("builds the body the UI sends to save a new record", () => {
    const body = datasourceAddBody({ name: "x" });
    expect(body).toMatchObject({ operationType: "add", componentId: "isc_OBViewForm_0", data: { name: "x" } });
    expect(body.csrfToken).toBeTruthy();
  });
});

test.describe("gridConfigurationBody", () => {
  test("stores the configuration of one tab of the window", () => {
    const configuration = { version: 1, sorting: [{ id: "Name", desc: true }] };
    expect(gridConfigurationBody("143", "187", configuration)).toEqual({
      windowId: "143",
      tabId: "187",
      configuration,
    });
  });
});

test.describe("gridConfigurationResetBody", () => {
  test("removes the saved configuration of one tab of the window", () => {
    expect(gridConfigurationResetBody("143", "187")).toEqual({ windowId: "143", tabId: "187", configuration: null });
  });
});

test.describe("savedRecordFrom", () => {
  test("returns the saved record", () => {
    const record = { id: RECORD_ID, name: "x" };
    expect(savedRecordFrom({ response: { status: 0, data: [record] } }, TARGET.entity)).toEqual(record);
  });

  const failures: { name: string; body: unknown; message: RegExp }[] = [
    {
      name: "a backend error with its message",
      body: { response: { status: -4, error: { message: "InvalidCSRFToken" } } },
      message: /BusinessPartnerCategory.*InvalidCSRFToken/,
    },
    { name: "a success without record", body: { response: { status: 0, data: [] } }, message: /without a record/ },
    { name: "an unexpected body", body: { error: "Unauthorized" }, message: /Unauthorized/ },
  ];

  for (const { name, body, message } of failures) {
    test(`throws on ${name}`, () => {
      expect(() => savedRecordFrom(body, TARGET.entity)).toThrow(message);
    });
  }
});

test.describe("assertRemoved", () => {
  test("accepts a deletion the backend confirmed", () => {
    expect(() => assertRemoved({ response: { status: 0 } }, TARGET.entity)).not.toThrow();
  });

  test("throws on a rejected deletion, with the backend message", () => {
    expect(() => assertRemoved({ response: { status: -1, error: { message: "In use" } } }, TARGET.entity)).toThrow(
      /BusinessPartnerCategory.*In use/
    );
  });
});

test.describe("datasourceFetchBody", () => {
  const criterion = { fieldName: "bankStatement.processed", operator: "equals", value: true };

  test("reads the inactive records too only when asked, as a window grid does", () => {
    expect(datasourceFetchBody(TARGET, { criteria: [] }).params).not.toHaveProperty("_noActiveFilter");
    expect(datasourceFetchBody(TARGET, { criteria: [], includeInactive: true }).params).toMatchObject({
      _noActiveFilter: "true",
    });
  });

  test("reads the entity with the window and tab of the target and every condition", () => {
    const body = datasourceFetchBody(TARGET, { criteria: [criterion] });
    expect(body.entity).toBe(TARGET.entity);
    expect(body.params).toMatchObject({
      windowId: TARGET.windowId,
      tabId: TARGET.tabId,
      _operationType: "fetch",
      _constructor: "AdvancedCriteria",
      operator: "and",
      criteria: [JSON.stringify(criterion)],
    });
  });

  test("sends the sort and the row limit when given", () => {
    const { params } = datasourceFetchBody(TARGET, { criteria: [], sortBy: "-name", limit: 1 }) as {
      params: Record<string, unknown>;
    };
    expect(params._sortBy).toBe("-name");
    expect(params._endRow).toBe("1");
  });

  test("leaves the sort out when none is given", () => {
    const { params } = datasourceFetchBody(TARGET, { criteria: [] }) as { params: Record<string, unknown> };
    expect(params).not.toHaveProperty("_sortBy");
  });
});

test.describe("fetchedRecordsFrom", () => {
  test("returns the records of the answer", () => {
    const records = [{ id: RECORD_ID }];
    expect(fetchedRecordsFrom({ response: { data: records } }, TARGET.entity)).toEqual(records);
  });

  test("throws on an answer without records, with the body", () => {
    expect(() => fetchedRecordsFrom({ error: "Unauthorized" }, TARGET.entity)).toThrow(
      /BusinessPartnerCategory.*Unauthorized/
    );
  });
});

test.describe("tree node move", () => {
  const move = {
    tabId: "367D9DF685DA42A38CAE641D30A0BEBF",
    tableId: "E913D17C9B3847CF92235082DBE2EC44",
    nodeId: "N1",
    parentId: "P1",
  };

  test("targets the ADTree datasource with the tab and table of the tree", () => {
    const url = treeNodeMoveUrl(move);
    expect(url.startsWith(`/api/datasource/${AD_TREE_DATASOURCE}?`)).toBe(true);
    const query = queryOf(url);
    expect(query.get(OPERATION_TYPE)).toBe("update");
    expect(query.get("tabId")).toBe(move.tabId);
    expect(query.get("referencedTableId")).toBe(move.tableId);
  });

  test("sends the node with its new parent", () => {
    expect(treeNodeMoveBody(move)).toEqual({
      operationType: "update",
      data: { id: "N1", parentId: "P1" },
      oldValues: { id: "N1" },
    });
  });
});

test.describe("recentDocumentRemoveUrl", () => {
  test("names the tab and the record of the document to remove", () => {
    const url = recentDocumentRemoveUrl({ tabId: TARGET.tabId, recordId: RECORD_ID });
    expect(url.startsWith("/api/erp/sws/com.etendoerp.metadata.meta/recent-documents?")).toBe(true);
    const query = queryOf(url);
    expect(query.get("tabId")).toBe(TARGET.tabId);
    expect(query.get("recordId")).toBe(RECORD_ID);
  });
});

test.describe("isInvalidCsrfTokenAnswer", () => {
  test("tells a write rejected for its CSRF token from any other answer", () => {
    expect(isInvalidCsrfTokenAnswer({ response: { status: -1, error: { message: "InvalidCSRFToken" } } })).toBe(true);
    expect(isInvalidCsrfTokenAnswer({ response: { status: -1, error: { message: "Duplicated key" } } })).toBe(false);
    expect(isInvalidCsrfTokenAnswer({ response: { status: 0, data: [] } })).toBe(false);
    expect(isInvalidCsrfTokenAnswer(null)).toBe(false);
  });
});

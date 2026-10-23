import { expect, test } from "@playwright/test";
import {
  assertRemoved,
  datasourceAddBody,
  datasourceFetchBody,
  datasourceWriteUrl,
  fetchedRecordsFrom,
  gridConfigurationResetBody,
  savedRecordFrom,
} from "../api/ApiData";
import { DATASOURCE } from "../registry/datasources";

const TARGET = DATASOURCE.BUSINESS_PARTNER_CATEGORY;
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
    expect(query.get("_operationType")).toBe("add");
    expect(query.has("id")).toBe(false);
  });

  test("carries the record id of a removal", () => {
    const query = queryOf(datasourceWriteUrl(TARGET, "remove", RECORD_ID));
    expect(query.get("_operationType")).toBe("remove");
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

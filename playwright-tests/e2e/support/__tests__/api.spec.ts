import { expect, test } from "@playwright/test";
import { datasourceWriteBody, datasourceWriteUrl, savedRecordFrom } from "../api/ApiData";
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

test.describe("datasourceWriteBody", () => {
  for (const [operation, componentId] of [
    ["add", "isc_OBViewForm_0"],
    ["remove", "isc_OBViewGrid_0"],
  ] as const) {
    test(`builds the ${operation} body the UI sends`, () => {
      const body = datasourceWriteBody(operation, { name: "x" });
      expect(body).toMatchObject({ operationType: operation, componentId, data: { name: "x" } });
      expect(body.csrfToken).toBeTruthy();
    });
  }
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
    { name: "a success without record", body: { response: { status: 0, data: [] } }, message: /"status":0/ },
    { name: "an unexpected body", body: { error: "Unauthorized" }, message: /Unauthorized/ },
  ];

  for (const { name, body, message } of failures) {
    test(`throws on ${name}`, () => {
      expect(() => savedRecordFrom(body, TARGET.entity)).toThrow(message);
    });
  }
});

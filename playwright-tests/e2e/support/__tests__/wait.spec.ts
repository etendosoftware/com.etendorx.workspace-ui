import { expect, test } from "@playwright/test";
import { datasourceCriteria, gridFetchParams } from "../wait";

const TAB_ID = "23691259D1BD4496BCC5F32645BCA4B9";
const OTHER_TAB_ID = "800057";
const FETCH = "fetch";

/** Body the UI posts to `/api/datasource`. */
const body = (params: Record<string, unknown>) => ({ entity: "FIN_Finacc_Transaction", params });

test.describe("gridFetchParams", () => {
  test("returns the params of the grid fetch of the tab", () => {
    const params = { tabId: TAB_ID, _operationType: FETCH, _orderBy: "dateAcct, lineNo" };

    expect(gridFetchParams(body(params), TAB_ID)).toEqual(params);
  });

  test("ignores other tabs, other operations, summaries and bodies without params", () => {
    expect(gridFetchParams(body({ tabId: OTHER_TAB_ID, _operationType: FETCH }), TAB_ID)).toBeUndefined();
    expect(gridFetchParams(body({ tabId: TAB_ID, _operationType: "update" }), TAB_ID)).toBeUndefined();
    expect(gridFetchParams(body({ tabId: TAB_ID, _operationType: FETCH, _summary: "{}" }), TAB_ID)).toBeUndefined();
    expect(gridFetchParams({ entity: "Order" }, TAB_ID)).toBeUndefined();
    expect(gridFetchParams(null, TAB_ID)).toBeUndefined();
  });
});

test.describe("datasourceCriteria", () => {
  const dummy = { fieldName: "_dummy", operator: "equals", value: 1 };
  const byId = { fieldName: "id", operator: "equals", value: "123" };

  test("parses one criterion or a list of them, posted as JSON strings", () => {
    expect(datasourceCriteria({ criteria: JSON.stringify(dummy) })).toEqual([dummy]);
    expect(datasourceCriteria({ criteria: [JSON.stringify(dummy), JSON.stringify(byId)] })).toEqual([dummy, byId]);
  });

  test("keeps criteria already parsed and returns none without criteria", () => {
    expect(datasourceCriteria({ criteria: [byId] })).toEqual([byId]);
    expect(datasourceCriteria({})).toEqual([]);
  });
});

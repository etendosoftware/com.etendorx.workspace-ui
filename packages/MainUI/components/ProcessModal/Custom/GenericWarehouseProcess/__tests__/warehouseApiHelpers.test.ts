/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { createCallAction, createFetchDatasource } from "../warehouseApiHelpers";

const TOKEN = "test-token-abc";
const PROCESS_ID = "PROC001";

describe("createCallAction", () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ result: "ok" }),
    });
    global.fetch = mockFetch;
  });

  it("calls the correct URL with token header", async () => {
    const callAction = createCallAction(TOKEN, PROCESS_ID);
    await callAction("MyActionHandler", { foo: "bar" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("processId=PROC001");
    expect(url).toContain("_action=MyActionHandler");
    expect(opts.headers.Authorization).toBe("Bearer test-token-abc");
    expect(opts.method).toBe("POST");
  });

  it("wraps params in _params by default", async () => {
    const callAction = createCallAction(TOKEN, PROCESS_ID);
    await callAction("Handler", { a: 1, b: 2 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body._params).toEqual({ a: 1, b: 2 });
    expect(body._buttonValue).toBe("DONE");
  });

  it("sends params flat when _topLevel is true", async () => {
    const callAction = createCallAction(TOKEN, PROCESS_ID);
    await callAction("Handler", { _topLevel: true, x: 10 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body._params).toBeUndefined();
    expect(body.x).toBe(10);
    expect(body._buttonValue).toBe("DONE");
  });

  it("allows processId override via params", async () => {
    const callAction = createCallAction(TOKEN, PROCESS_ID);
    await callAction("Handler", { processId: "OVERRIDE999" });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain("processId=OVERRIDE999");
    expect(url).not.toContain("PROC001");
  });

  it("includes _entityName in the body when provided", async () => {
    const callAction = createCallAction(TOKEN, PROCESS_ID);
    await callAction("Handler", { _entityName: "Product", val: 5 });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body._entityName).toBe("Product");
  });

  it("throws when response is not ok", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    const callAction = createCallAction(TOKEN, PROCESS_ID);
    await expect(callAction("Handler", {})).rejects.toThrow("callAction failed: 500");
  });

  it("returns the parsed JSON response", async () => {
    const callAction = createCallAction(TOKEN, PROCESS_ID);
    const result = await callAction("Handler", {});
    expect(result).toEqual({ result: "ok" });
  });
});

describe("createFetchDatasource", () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ data: [{ id: "1" }] }),
    });
    global.fetch = mockFetch;
  });

  it("posts to /api/datasource with entity and params", async () => {
    const fetchDatasource = createFetchDatasource(TOKEN);
    await fetchDatasource("Product", { _where: "id='1'" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/datasource");
    expect(opts.method).toBe("POST");
    const body = JSON.parse(opts.body);
    expect(body.entity).toBe("Product");
    expect(body.params).toEqual({ _where: "id='1'" });
  });

  it("includes Authorization header with token", async () => {
    const fetchDatasource = createFetchDatasource(TOKEN);
    await fetchDatasource("Order", {});

    const opts = mockFetch.mock.calls[0][1];
    expect(opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("throws when response is not ok", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403 });
    const fetchDatasource = createFetchDatasource(TOKEN);
    await expect(fetchDatasource("Entity", {})).rejects.toThrow("fetchDatasource failed: 403");
  });

  it("returns the parsed JSON response", async () => {
    const fetchDatasource = createFetchDatasource(TOKEN);
    const result = await fetchDatasource("Product", {});
    expect(result).toEqual({ data: [{ id: "1" }] });
  });
});

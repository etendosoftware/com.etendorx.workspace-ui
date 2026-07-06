/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { createDatasourceManager } from "../datasource";

const ENTITY = "CharacteristicValue";
const DATA_URL = `/openbravo/org.openbravo.service.datasource/${ENTITY}`;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Wraps a row array in the classic datasource reply envelope. */
const reply = (rows: unknown[], extra: Record<string, unknown> = {}) => ({
  data: { response: { status: 0, data: rows, totalRows: rows.length, ...extra } },
});

describe("createDatasourceManager", () => {
  it("routes a successful fetch through the injected transport", async () => {
    const rows = [{ id: 1 }];
    const fetchDatasource = jest.fn().mockResolvedValue(reply(rows));
    const callback = jest.fn();

    createDatasourceManager({ fetchDatasource }).create({ dataURL: DATA_URL }).fetchData({}, callback);
    await flush();

    expect(callback).toHaveBeenCalledWith({ status: 0, totalRows: 1 }, rows, { criteria: {} });
  });

  it("derives the entity from the last segment of dataURL", async () => {
    const fetchDatasource = jest.fn().mockResolvedValue(reply([]));

    createDatasourceManager({ fetchDatasource }).create({ dataURL: DATA_URL }).fetchData();
    await flush();

    expect(fetchDatasource).toHaveBeenCalledWith(ENTITY, expect.objectContaining({ _operationType: "fetch" }));
  });

  it("falls back to the entity / dataSource config fields", async () => {
    const fetchDatasource = jest.fn().mockResolvedValue(reply([]));
    const manager = createDatasourceManager({ fetchDatasource });

    manager.create({ entity: "BusinessPartner" }).fetchData();
    manager.create({ dataSource: "Currency" }).fetchData();
    await flush();

    expect(fetchDatasource).toHaveBeenNthCalledWith(1, "BusinessPartner", expect.any(Object));
    expect(fetchDatasource).toHaveBeenNthCalledWith(2, "Currency", expect.any(Object));
  });

  it("merges requestProperties.params and the criteria into the payload", async () => {
    const fetchDatasource = jest.fn().mockResolvedValue(reply([]));
    const criteria = { fieldName: "name", operator: "equals", value: "x" };

    createDatasourceManager({ fetchDatasource })
      .create({ dataURL: DATA_URL, requestProperties: { params: { adTabId: "TAB" } } })
      .fetchData(criteria);
    await flush();

    expect(fetchDatasource).toHaveBeenCalledWith(ENTITY, {
      _operationType: "fetch",
      _startRow: 0,
      _endRow: 100,
      adTabId: "TAB",
      criteria,
    });
  });

  it("supports the fetchData(callback) overload", async () => {
    const rows = [{ id: 9 }];
    const fetchDatasource = jest.fn().mockResolvedValue(reply(rows));
    const callback = jest.fn();

    createDatasourceManager({ fetchDatasource }).create({ dataURL: DATA_URL }).fetchData(callback);
    await flush();

    expect(callback).toHaveBeenCalledWith({ status: 0, totalRows: 1 }, rows, { criteria: undefined });
  });

  it("resolves from cached records without hitting the transport once setCacheData is called", async () => {
    const fetchDatasource = jest.fn();
    const callback = jest.fn();
    const cached = [{ id: 1 }, { id: 2 }];

    const ds = createDatasourceManager({ fetchDatasource }).create({ dataURL: DATA_URL });
    ds.setCacheData(cached);
    ds.fetchData({}, callback);
    await flush();

    expect(fetchDatasource).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith({ status: 0, totalRows: 2 }, cached, { criteria: {} });
  });

  it("reports a transport failure as status -1 with empty rows", async () => {
    const fetchDatasource = jest.fn().mockRejectedValue(new Error("boom"));
    const callback = jest.fn();

    createDatasourceManager({ fetchDatasource }).create({ dataURL: DATA_URL }).fetchData({}, callback);
    await flush();

    expect(callback).toHaveBeenCalledWith({ status: -1, totalRows: 0 }, [], { criteria: {} });
  });

  it("throws a traceable error when built without a transport", () => {
    const ds = createDatasourceManager({}).create({ dataURL: DATA_URL });
    expect(() => ds.fetchData({})).toThrow(/requires a fetchDatasource dependency/);
  });

  it("applies safe defaults when the reply envelope is missing fields", async () => {
    const fetchDatasource = jest.fn().mockResolvedValue({ data: {} });
    const callback = jest.fn();

    createDatasourceManager({ fetchDatasource }).create({ dataURL: DATA_URL }).fetchData({}, callback);
    await flush();

    expect(callback).toHaveBeenCalledWith({ status: 0, totalRows: 0 }, [], { criteria: {} });
  });

  it("passes through a negative business status from the reply envelope", async () => {
    const fetchDatasource = jest.fn().mockResolvedValue({ data: { response: { status: -4 } } });
    const callback = jest.fn();

    createDatasourceManager({ fetchDatasource }).create({ dataURL: DATA_URL }).fetchData({}, callback);
    await flush();

    expect(callback).toHaveBeenCalledWith({ status: -4, totalRows: 0 }, [], { criteria: {} });
  });
});

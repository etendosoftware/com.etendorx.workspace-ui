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
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { installLocalStorageMock } from "@/utils/testUtils/localStorageMock";
import { createOBShim } from "../obShim";

const PREF_KEY = "UomManagement";

describe("createOBShim", () => {
  beforeEach(() => {
    installLocalStorageMock();
  });

  it("composes every OB namespace", () => {
    const ob = createOBShim();
    expect(ob.PropertyStore).toBeDefined();
    expect(ob.I18N).toBeDefined();
    expect(ob.Format).toBeDefined();
    expect(typeof ob.Utilities.Number.JSToOBMasked).toBe("function");
    expect(typeof ob.Utilities.Action.set).toBe("function");
    expect(typeof ob.Utilities.generateRandomString).toBe("function");
    expect(ob.Styles.MessageBar).toBeDefined();
  });

  it("exposes the classic OB.MessageBar.TYPE_* severity constants", () => {
    const ob = createOBShim();
    expect(ob.MessageBar.TYPE_INFO).toBe("info");
    expect(ob.MessageBar.TYPE_SUCCESS).toBe("success");
    expect(ob.MessageBar.TYPE_WARNING).toBe("warning");
    expect(ob.MessageBar.TYPE_ERROR).toBe("error");
  });

  it("wires I18N.getLabel to the injected resolver", () => {
    const ob = createOBShim({ getLabel: (key) => (key === "Greet" ? "Hi %0" : key) });
    expect(ob.I18N.getLabel("Greet", ["Sam"])).toBe("Hi Sam");
  });

  it("derives Format defaults from the language", () => {
    expect(createOBShim({ language: "es_ES" }).Format.defaultDecimalSymbol).toBe(",");
  });

  it("reads and writes a single preference via PropertyStore", () => {
    const ob = createOBShim();
    ob.PropertyStore.set(PREF_KEY, "Y");
    expect(ob.PropertyStore.get(PREF_KEY)).toBe("Y");
  });

  it("shares the action registry across calls on the same instance", () => {
    const ob = createOBShim();
    ob.Utilities.Action.set("a", () => "done");
    expect(ob.Utilities.Action.execute("a")).toBe("done");
  });

  it("routes executeJSON built-ins through the injected dispatchBuiltinAction", () => {
    const dispatchBuiltinAction = jest.fn(() => true);
    const ob = createOBShim({ dispatchBuiltinAction });
    ob.Utilities.Action.executeJSON([{ refreshGrid: {} }]);
    expect(dispatchBuiltinAction).toHaveBeenCalledWith("refreshGrid", {});
  });

  it("tolerates module-namespace writes (OB.APRM = {})", () => {
    const ob = createOBShim();
    ob.APRM = {};
    (ob.APRM as Record<string, unknown>).MatchStatement = { ready: true };
    expect((ob.APRM as Record<string, { ready: boolean }>).MatchStatement.ready).toBe(true);
  });

  it("treats TestRegistry.register as a no-op", () => {
    expect(() => createOBShim().TestRegistry.register("x", {})).not.toThrow();
  });

  it("returns a Datasource façade whose fetchData throws when built without a transport", () => {
    const ds = createOBShim().Datasource.create({ dataURL: "/a/b/MyEntity" });
    expect(() => ds.fetchData({})).toThrow(/requires a fetchDatasource dependency/);
  });

  it("routes Datasource.create(...).fetchData through the injected fetchDatasource", async () => {
    const rows = [{ id: 1 }];
    const fetchDatasource = jest.fn().mockResolvedValue({
      data: { response: { status: 0, data: rows, totalRows: 1 } },
    });
    const callback = jest.fn();
    const ob = createOBShim({ fetchDatasource });

    ob.Datasource.create({ dataURL: "/a/b/MyEntity" }).fetchData({}, callback);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchDatasource).toHaveBeenCalledWith("MyEntity", expect.objectContaining({ _operationType: "fetch" }));
    expect(callback).toHaveBeenCalledWith({ status: 0, totalRows: 1 }, rows, { criteria: {} });
  });

  it("throws from RemoteCallManager.call when built without a remoteCall transport", () => {
    expect(() => createOBShim().RemoteCallManager.call("handler")).toThrow(/requires a remoteCall dependency/);
  });

  it("routes RemoteCallManager.call through the injected remoteCall", async () => {
    const remoteCall = jest.fn().mockResolvedValue({ data: { ok: true } });
    const callback = jest.fn();
    const ob = createOBShim({ remoteCall });

    ob.RemoteCallManager.call("handler", { a: 1 }, {}, callback);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(remoteCall).toHaveBeenCalledWith("handler", { a: 1 });
    expect(callback).toHaveBeenCalledWith({ status: 0 }, { ok: true }, { clientContext: undefined });
  });
});

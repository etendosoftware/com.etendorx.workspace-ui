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

  it("tolerates module-namespace writes (OB.APRM = {})", () => {
    const ob = createOBShim();
    ob.APRM = {};
    (ob.APRM as Record<string, unknown>).MatchStatement = { ready: true };
    expect((ob.APRM as Record<string, { ready: boolean }>).MatchStatement.ready).toBe(true);
  });

  it("treats TestRegistry.register as a no-op", () => {
    expect(() => createOBShim().TestRegistry.register("x", {})).not.toThrow();
  });

  it("throws from the not-yet-implemented RemoteCallManager / Datasource stubs", () => {
    const ob = createOBShim();
    expect(() => ob.RemoteCallManager.call()).toThrow(/RemoteCallManager.call is not implemented/);
    expect(() => ob.Datasource.create()).toThrow(/Datasource.create is not implemented/);
  });
});

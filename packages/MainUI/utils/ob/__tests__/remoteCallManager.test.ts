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

import { createRemoteCallManager } from "../remoteCallManager";

const HANDLER = "org.openbravo.test.SomeActionHandler";

/** Resolves after pending microtasks/timers so the call's callback has run. */
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("createRemoteCallManager", () => {
  it("invokes the callback with status 0, the parsed data and the caller context on success", async () => {
    const remoteCall = jest.fn().mockResolvedValue({ data: { x: 1 } });
    const callback = jest.fn();
    const callerContext = { from: "test" };

    createRemoteCallManager({ remoteCall }).call(HANDLER, { a: 1 }, {}, callback, callerContext);
    await flush();

    expect(remoteCall).toHaveBeenCalledWith(HANDLER, { a: 1 });
    expect(callback).toHaveBeenCalledWith({ status: 0 }, { x: 1 }, { clientContext: callerContext });
  });

  it("invokes the callback with a negative status on a transport failure", async () => {
    const remoteCall = jest.fn().mockRejectedValue(new Error("network"));
    const callback = jest.fn();

    createRemoteCallManager({ remoteCall }).call(HANDLER, {}, {}, callback);
    await flush();

    expect(callback).toHaveBeenCalledWith({ status: -1 }, null, { clientContext: undefined });
  });

  it("routes a transport failure to errorCallback (not callback) when one is provided", async () => {
    const remoteCall = jest.fn().mockRejectedValue(new Error("network"));
    const callback = jest.fn();
    const errorCallback = jest.fn();

    createRemoteCallManager({ remoteCall }).call(HANDLER, {}, {}, callback, undefined, errorCallback);
    await flush();

    expect(callback).not.toHaveBeenCalled();
    expect(errorCallback).toHaveBeenCalledWith({ status: -1 }, null, { clientContext: undefined });
  });

  it("sends an empty object to remoteCall when data is omitted", async () => {
    const remoteCall = jest.fn().mockResolvedValue({ data: null });

    createRemoteCallManager({ remoteCall }).call(HANDLER);
    await flush();

    expect(remoteCall).toHaveBeenCalledWith(HANDLER, {});
  });

  it("throws a traceable error when built without a remoteCall transport", () => {
    expect(() => createRemoteCallManager({}).call(HANDLER, {}, {}, jest.fn())).toThrow(
      /requires a remoteCall dependency/
    );
  });
});

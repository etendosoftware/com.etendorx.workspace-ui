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

import type { ActionDispatchContext } from "@/components/ProcessModal/utils/responseActionDispatcher";
import {
  clearActionDispatchContext,
  dispatchBuiltinAction,
  dispatchProcessReturnActions,
  getActionDispatchContext,
  setActionDispatchContext,
} from "../actionDispatcherStore";

const makeCtxMock = (): jest.Mocked<ActionDispatchContext> => ({
  showMessageInProcessView: jest.fn(),
  showMessageInView: jest.fn(),
  openDirectTab: jest.fn(),
  refreshParentGrid: jest.fn(),
  refreshGridParameter: jest.fn(),
  setSelectorValueFromRecord: jest.fn(),
  say: jest.fn(),
  browseReport: jest.fn(),
  downloadReport: jest.fn(),
});

describe("actionDispatcherStore", () => {
  afterEach(() => clearActionDispatchContext());

  it("set / get / clear the active context", () => {
    const ctx = makeCtxMock();
    expect(getActionDispatchContext()).toBeNull();
    setActionDispatchContext(ctx);
    expect(getActionDispatchContext()).toBe(ctx);
    clearActionDispatchContext(ctx);
    expect(getActionDispatchContext()).toBeNull();
  });

  it("clear with a stale context does not wipe a newer registration", () => {
    const oldCtx = makeCtxMock();
    const newCtx = makeCtxMock();
    setActionDispatchContext(oldCtx);
    setActionDispatchContext(newCtx);
    clearActionDispatchContext(oldCtx);
    expect(getActionDispatchContext()).toBe(newCtx);
  });

  describe("dispatchBuiltinAction", () => {
    it("returns false and warns when no context is registered", () => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
      expect(dispatchBuiltinAction("refreshGrid", {})).toBe(false);
      warn.mockRestore();
    });

    it("parses and routes a recognized built-in to its handler", () => {
      const ctx = makeCtxMock();
      setActionDispatchContext(ctx);
      expect(dispatchBuiltinAction("refreshGrid", {})).toBe(true);
      expect(ctx.refreshParentGrid).toHaveBeenCalledTimes(1);
    });

    it("returns false for an unknown action type", () => {
      setActionDispatchContext(makeCtxMock());
      expect(dispatchBuiltinAction("totallyMadeUp", {})).toBe(false);
    });
  });

  describe("dispatchProcessReturnActions", () => {
    it("dispatches non-message actions and skips message + openDirectTab", () => {
      const ctx = makeCtxMock();
      setActionDispatchContext(ctx);
      dispatchProcessReturnActions({
        responseActions: [
          { showMsgInProcessView: { msgType: "success", msgText: "done" } },
          { openDirectTab: { tabId: "T1" } },
          { refreshGrid: {} },
          { refreshGridParameter: { gridName: "g" } },
        ],
      });
      expect(ctx.showMessageInProcessView).not.toHaveBeenCalled();
      expect(ctx.openDirectTab).not.toHaveBeenCalled();
      expect(ctx.refreshParentGrid).toHaveBeenCalledTimes(1);
      expect(ctx.refreshGridParameter).toHaveBeenCalledWith({ gridName: "g" });
    });

    it("is a no-op when no context is registered", () => {
      expect(() => dispatchProcessReturnActions({ responseActions: [{ refreshGrid: {} }] })).not.toThrow();
    });
  });
});

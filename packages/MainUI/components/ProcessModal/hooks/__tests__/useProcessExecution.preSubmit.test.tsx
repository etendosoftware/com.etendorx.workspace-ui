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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { renderHook } from "@testing-library/react";
import { useProcessExecution } from "../useProcessExecution";
import { makeParams } from "../testUtils/makeProcessExecutionParams";

// onProcess body is driven through executeStringFunction; each test supplies the
// migrated validation script's return value.
const executeStringFunction = jest.fn();
jest.mock("@/utils/functions", () => ({
  executeStringFunction: (...args: unknown[]) => executeStringFunction(...args),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
const setMessage = jest.fn();
jest.mock("@/utils/processes/definition/messageBarStore", () => ({
  messageBar: { setMessage: (...a: unknown[]) => setMessage(...a), hide: jest.fn() },
  MESSAGE_BAR_TYPES: {},
}));
jest.mock("sonner", () => ({
  toast: Object.assign(jest.fn(), { success: jest.fn(), warning: jest.fn(), error: jest.fn() }),
}));

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Pick&Execute params with a Window Reference grid (hasWindowReference = true). */
const makePEParams = (overrides: Record<string, unknown> = {}) =>
  makeParams({
    hasWindowReference: true,
    etmetaOnprocess: "async (process, view) => undefined",
    tab: { id: "TAB-001", window: "WIN-001", entityName: "Payment" },
    form: { getValues: jest.fn(() => ({})), setValue: jest.fn() } as never,
    ...overrides,
  });

describe("useProcessExecution — Pick&Execute pre-submit validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: jest.fn(),
      json: jest.fn().mockResolvedValue({}),
    }) as jest.Mock;
  });

  it("aborts the submit (no Java post) when onProcess returns an error severity", async () => {
    executeStringFunction.mockResolvedValue({ severity: "error", text: "Credit exceeds pending" });
    const { result } = renderHook(() => useProcessExecution(makePEParams()));

    await result.current.handleExecute("DONE");
    await flushPromises();

    expect(executeStringFunction).toHaveBeenCalledTimes(1);
    expect(setMessage).toHaveBeenCalledWith("error", null, "Credit exceeds pending");
    expect(global.fetch).not.toHaveBeenCalled(); // handleWindowReferenceExecute never ran
  });

  it("aborts and titles the bar when the error arrives as a `message` object", async () => {
    executeStringFunction.mockResolvedValue({
      message: { msgType: "error", msgTitle: "Cannot pay", msgText: "Credit exceeds pending" },
    });
    const { result } = renderHook(() => useProcessExecution(makePEParams()));

    await result.current.handleExecute("DONE");
    await flushPromises();

    expect(setMessage).toHaveBeenCalledWith("error", "Cannot pay", "Credit exceeds pending");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("proceeds with the submit when onProcess returns no error", async () => {
    executeStringFunction.mockResolvedValue(undefined);
    const { result } = renderHook(() => useProcessExecution(makePEParams()));

    await result.current.handleExecute("DONE");
    await flushPromises();

    expect(executeStringFunction).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalled(); // submitted to the Java handler
  });

  it("submits directly without evaluating onProcess when none is configured", async () => {
    const { result } = renderHook(() => useProcessExecution(makePEParams({ etmetaOnprocess: undefined })));

    await result.current.handleExecute("DONE");
    await flushPromises();

    expect(executeStringFunction).not.toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
  });

  describe("onProcess calling view.executeProcess() (Classic actionHandlerCall)", () => {
    /** onProcess body that submits through the view, as the migrated Find Transactions script does. */
    const submitThroughView = async (
      _fn: unknown,
      _ctx: unknown,
      _pd: unknown,
      view: { executeProcess: () => Promise<{ message?: unknown }> }
    ) => (await view.executeProcess())?.message;

    const mockResponse = (body: unknown) => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: jest.fn(),
        json: jest.fn().mockResolvedValue(body),
      }) as jest.Mock;
    };

    const postedBody = () => JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);

    it("posts once and handles that response as the submit", async () => {
      executeStringFunction.mockImplementation(submitThroughView);
      const onClose = jest.fn();
      const { result } = renderHook(() => useProcessExecution(makePEParams({ onClose })));

      await result.current.handleExecute("DONE");
      await flushPromises();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(postedBody()._buttonValue).toBe("DONE");
      expect(onClose).toHaveBeenCalled(); // `{}` response: success, the modal closes
    });

    it("keeps the modal open when that response asks to retry", async () => {
      executeStringFunction.mockImplementation(submitThroughView);
      mockResponse({
        responseActions: [{ showMsgInProcessView: { msgType: "error", msgText: "Select a record" } }],
        retryExecution: true,
      });
      const setResult = jest.fn();
      const { result } = renderHook(() => useProcessExecution(makePEParams({ setResult })));

      await result.current.handleExecute("DONE");
      await flushPromises();

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ keepOpen: true }));
    });

    it("sends the nested launch's externalParams in _params", async () => {
      executeStringFunction.mockImplementation(submitThroughView);
      const { result } = renderHook(() =>
        useProcessExecution(makePEParams({ externalParams: { bankStatementLineId: "BSL-1" } }))
      );

      await result.current.handleExecute("DONE");
      await flushPromises();

      expect(postedBody()._params).toEqual(expect.objectContaining({ bankStatementLineId: "BSL-1" }));
    });
  });

  it("aborts silently when onProcess returns an error without text", async () => {
    executeStringFunction.mockResolvedValue({ severity: "error", text: "" });
    const setResult = jest.fn();
    const { result } = renderHook(() => useProcessExecution(makePEParams({ setResult })));

    await result.current.handleExecute("DONE");
    await flushPromises();

    expect(setMessage).not.toHaveBeenCalled();
    expect(setResult).not.toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

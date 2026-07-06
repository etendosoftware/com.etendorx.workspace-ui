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
import type { ViewData } from "@/utils/processes/definition/scriptProxies";
import { useProcessExecution } from "../useProcessExecution";
import { makeParams } from "../testUtils/makeProcessExecutionParams";

// The onProcess body is driven through executeStringFunction: each test supplies
// an implementation that exercises `view.executeProcess()` (the actionHandlerCall
// reproduction) and returns whatever the migrated script would return.
const executeStringFunction = jest.fn();
jest.mock("@/utils/functions", () => ({
  executeStringFunction: (...args: unknown[]) => executeStringFunction(...args),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
const toastSuccess = jest.fn();
const toastWarning = jest.fn();
jest.mock("sonner", () => ({
  toast: Object.assign(jest.fn(), {
    success: (...a: unknown[]) => toastSuccess(...a),
    warning: (...a: unknown[]) => toastWarning(...a),
    error: jest.fn(),
  }),
}));

const HANDLER = "org.openbravo.common.actionhandler.SetNewBPCurrency";
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const mockFetchJson = (data: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: jest.fn(),
    json: jest.fn().mockResolvedValue(data),
  }) as jest.Mock;
};

/** Params for an onProcess process wired to a Java class (the Set New Currency shape). */
const makeOnProcessParams = (overrides: Record<string, unknown> = {}) =>
  makeParams({
    etmetaOnprocess: "async (process, view) => view.executeProcess()",
    javaClassName: HANDLER,
    tab: { id: "TAB-001", window: "WIN-001", entityName: "BusinessPartner" },
    viewData: { windowId: "WIN-001", parentRecord: {} } as ViewData,
    form: { getValues: jest.fn(() => ({})), setValue: jest.fn() },
    ...overrides,
  });

describe("useProcessExecution — view.executeProcess (actionHandlerCall reproduction)", () => {
  beforeEach(() => {
    executeStringFunction.mockReset();
    toastSuccess.mockClear();
    toastWarning.mockClear();
  });

  it("exposes view.executeProcess as a function in the onProcess path", async () => {
    mockFetchJson({ message: { severity: "success", text: "ok" } });
    executeStringFunction.mockResolvedValue({});

    const { result } = renderHook(() => useProcessExecution(makeOnProcessParams() as never));
    await result.current.handleExecute("DONE");
    await flushPromises();

    const view = executeStringFunction.mock.calls[0][3] as Record<string, unknown>;
    expect(typeof view.executeProcess).toBe("function");
  });

  it("posts the standard payload to the configured Java class and returns the response", async () => {
    mockFetchJson({ message: { severity: "success", text: "Currency updated" } });
    // Migrated body: validate (passes), then proceed via executeProcess.
    executeStringFunction.mockImplementation(async (_code, _ctx, _def, view: Record<string, unknown>) => {
      const response = (await (view.executeProcess as () => Promise<{ message: unknown }>)()) as {
        message: unknown;
      };
      return response.message;
    });

    const params = makeOnProcessParams({
      getMergedProcessValues: jest.fn(() => ({ C_Currency_ID: "EUR" })),
      getRecordIds: jest.fn(() => ["bp-1"]),
    });

    const { result } = renderHook(() => useProcessExecution(params as never));
    await result.current.handleExecute("DONE");
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain(`_action=${encodeURIComponent(HANDLER)}`);
    expect(url).toContain("processId=PROC-001");

    const body = JSON.parse((init as RequestInit).body as string);
    expect(body._buttonValue).toBe("DONE");
    expect(body._entityName).toBe("BusinessPartner");
    expect(body._params).toEqual({ C_Currency_ID: "EUR" });
    expect(body.recordIds).toEqual(["bp-1"]);

    // The handler message is surfaced exactly once through the onProcess flow.
    expect(toastSuccess).toHaveBeenCalledTimes(1);
  });

  it("dispatches server responseActions registry-first via the shared OB shim", async () => {
    const executeJSON = jest.fn();
    mockFetchJson({
      message: { severity: "success", text: "done" },
      responseActions: [{ refreshGrid: {} }, { showMsgInProcessView: { msgText: "skip" } }],
    });
    executeStringFunction.mockImplementation(async (_code, _ctx, _def, view: Record<string, unknown>) => {
      await (view.executeProcess as () => Promise<unknown>)();
      return { severity: "success", text: "done" };
    });

    const params = makeOnProcessParams({
      scriptContext: { OB: { Utilities: { Action: { executeJSON } } } },
    });

    const { result } = renderHook(() => useProcessExecution(params as never));
    await result.current.handleExecute("DONE");
    await flushPromises();

    // refreshGrid dispatched; the message key is filtered out (handled by the flow).
    expect(executeJSON).toHaveBeenCalledTimes(1);
    expect(executeJSON).toHaveBeenCalledWith([{ refreshGrid: {} }]);
  });

  it("does not submit when onProcess validation fails (clientSideValidationFail)", async () => {
    mockFetchJson({ message: { severity: "success", text: "should not happen" } });
    const setResult = jest.fn();
    // Migrated body aborts before calling executeProcess.
    executeStringFunction.mockResolvedValue({ severity: "error", text: "BPCurrencyChangeRate" });

    const params = makeOnProcessParams({ setResult });
    const { result } = renderHook(() => useProcessExecution(params as never));
    await result.current.handleExecute("DONE");
    await flushPromises();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: "BPCurrencyChangeRate" }));
    expect(toastSuccess).not.toHaveBeenCalled();
  });
});

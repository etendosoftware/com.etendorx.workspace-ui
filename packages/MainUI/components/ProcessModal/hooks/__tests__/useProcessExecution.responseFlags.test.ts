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

import "../testUtils/useProcessExecution.mocks";
import { renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { useProcessExecution } from "../useProcessExecution";
import { makeParams } from "../testUtils/makeProcessExecutionParams";

const mockFetchJson = (data: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(data),
  }) as jest.Mock;
};

const SUCCESS_RESPONSE = {
  responseActions: [{ showMsgInProcessView: { msgType: "success", msgText: "Done" } }],
};

/**
 * Mocks two sequential fetch calls:
 *   1st — process execution returning the given responseActions
 *   2nd — tab metadata fetch used by handleNavigateToTab
 * Returns the mock router so tests can assert on `replace`.
 */
const mockDirectTabNavigation = (responseActions: unknown[]) => {
  const mockRouter = { replace: jest.fn() };
  let callCount = 0;
  global.fetch = jest.fn().mockImplementation(() => {
    callCount++;
    return Promise.resolve({
      ok: true,
      json: jest.fn().mockResolvedValue(callCount === 1 ? { responseActions } : { window: "WIN-X" }),
    });
  }) as jest.Mock;
  return mockRouter;
};

const runProcess = async (params: Parameters<typeof makeParams>[0]) => {
  const { result } = renderHook(() => useProcessExecution(makeParams(params)));
  await result.current.executeJavaProcess({});
  return result;
};

const runDirectTabProcess = async (responseActions: unknown[]) => {
  const mockRouter = mockDirectTabNavigation(responseActions);
  const { result } = renderHook(() => useProcessExecution(makeParams({ router: mockRouter })));
  await result.current.executeJavaProcess({});
  return mockRouter;
};

describe("useProcessExecution — executeJavaProcess response flags", () => {
  it("refreshes the grid when retryExecution=true and refreshParent is absent", async () => {
    mockFetchJson({ retryExecution: true });
    const setGridRefreshKey = jest.fn();
    const setResult = jest.fn();

    await runProcess({ setGridRefreshKey, setResult });

    expect(setGridRefreshKey).toHaveBeenCalledWith(expect.any(Function));
    expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ keepOpen: true }));
  });

  it("refreshes the grid when retryExecution=true and refreshParent=true", async () => {
    mockFetchJson({ retryExecution: true, refreshParent: true });
    const setGridRefreshKey = jest.fn();

    await runProcess({ setGridRefreshKey });

    expect(setGridRefreshKey).toHaveBeenCalledWith(expect.any(Function));
  });

  it("does not refresh the grid when retryExecution=true and refreshParent=false", async () => {
    mockFetchJson({ retryExecution: true, refreshParent: false });
    const setGridRefreshKey = jest.fn();
    const setResult = jest.fn();

    await runProcess({ setGridRefreshKey, setResult });

    expect(setGridRefreshKey).not.toHaveBeenCalled();
    expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ keepOpen: true }));
  });

  it("does not set keepOpen=true when retryExecution is absent from the response", async () => {
    mockFetchJson(SUCCESS_RESPONSE);
    const setResult = jest.fn();

    await runProcess({ setResult });

    const keepOpenCall = setResult.mock.calls.find(
      ([arg]) => arg && typeof arg === "object" && "keepOpen" in arg && arg.keepOpen === true
    );
    expect(keepOpenCall).toBeUndefined();
  });

  it("reads retryExecution nested under response.data", async () => {
    mockFetchJson({ response: { data: { retryExecution: true } } });
    const setGridRefreshKey = jest.fn();
    const setResult = jest.fn();

    await runProcess({ setGridRefreshKey, setResult });

    expect(setGridRefreshKey).toHaveBeenCalledWith(expect.any(Function));
    expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ keepOpen: true }));
  });

  /** Builds a scriptContext whose OB shim exposes a spyable executeJSON. */
  const makeScriptContextWithExecuteJSON = (executeJSON: jest.Mock) => ({
    OB: { Utilities: { Action: { executeJSON } } },
  });

  it("dispatches the server responseActions registry-first via OB.Utilities.Action.executeJSON", async () => {
    const responseActions = [
      { refreshGridParameter: { gridName: "Accounts" } },
      { refreshGrid: {} },
      { showVATGrid: {} },
      { updateVATTotal: { amount: "0.00" } },
      { showMsgInProcessView: { msgText: "done" } },
    ];
    mockFetchJson({ retryExecution: true, responseActions });
    const executeJSON = jest.fn();

    const { result } = renderHook(() =>
      useProcessExecution(makeParams({ scriptContext: makeScriptContextWithExecuteJSON(executeJSON) }))
    );
    await result.current.executeJavaProcess({});

    // Custom (showVATGrid/updateVATTotal) + built-in refreshes dispatched; the
    // message key is skipped (handled by the success flow → no double effect).
    expect(executeJSON).toHaveBeenCalledTimes(1);
    expect(executeJSON).toHaveBeenCalledWith([
      { refreshGridParameter: { gridName: "Accounts" } },
      { refreshGrid: {} },
      { showVATGrid: {} },
      { updateVATTotal: { amount: "0.00" } },
    ]);
  });

  it("does not call executeJSON when the response has no dispatchable actions", async () => {
    mockFetchJson({ retryExecution: true });
    const executeJSON = jest.fn();

    const { result } = renderHook(() =>
      useProcessExecution(makeParams({ scriptContext: makeScriptContextWithExecuteJSON(executeJSON) }))
    );
    await result.current.executeJavaProcess({});

    expect(executeJSON).not.toHaveBeenCalled();
  });
});

describe("SyncServerButton-style error response (responseActions as a single-key map)", () => {
  it("surfaces the error via setResult (inline banner) and skips the toast, since the modal stays open", async () => {
    // Real payload from com.smf.schedule.servers.ad_actionbutton.SyncServerButton.
    mockFetchJson({
      responseActions: {
        showMsgInProcessView: {
          severity: "error",
          msgType: "error",
          msgTitle: "Error",
          msgText: "Synchronization error:  The requested item does not exist.",
        },
      },
      retryExecution: true,
      refreshParent: true,
    });
    const setResult = jest.fn();

    await runProcess({ setResult });

    expect(setResult).toHaveBeenCalledWith(
      expect.objectContaining({ keepOpen: true, success: false, messageType: "error" })
    );
    // The modal renders this same message inline (renderResponse()); a toast would duplicate it.
    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("refreshGrid response action", () => {
  it("refreshes grid when refreshGrid action is present with retryExecution=true and refreshParent=false", async () => {
    mockFetchJson({
      retryExecution: true,
      refreshParent: false,
      responseActions: [{ refreshGrid: {} }],
    });
    const setGridRefreshKey = jest.fn();
    const setResult = jest.fn();

    await runProcess({ setGridRefreshKey, setResult });

    expect(setGridRefreshKey).toHaveBeenCalledWith(expect.any(Function));
    expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ keepOpen: true }));
  });
});

describe("openDirectTab auto-navigation", () => {
  it("navigates automatically when openDirectTab accompanies a success message", async () => {
    const mockRouter = await runDirectTabProcess([
      { showMsgInProcessView: { msgType: "success", msgText: "Done" } },
      { openDirectTab: { tabId: "TAB-X", recordId: "REC-Y" } },
    ]);
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining("window"));
  });

  it("navigates automatically when only openDirectTab is in responseActions (no message)", async () => {
    const mockRouter = await runDirectTabProcess([{ openDirectTab: { tabId: "TAB-Z", recordId: "REC-Z" } }]);
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining("window"));
  });

  it("navigates to grid mode (no recordId) when openDirectTab has no recordId", async () => {
    const mockRouter = await runDirectTabProcess([
      { showMsgInProcessView: { msgType: "success", msgText: "Done" } },
      { openDirectTab: { tabId: "TAB-G" } },
    ]);
    expect(mockRouter.replace).toHaveBeenCalledWith(expect.stringContaining("window"));
  });
});

describe("multi-record invocation", () => {
  const TWO_RECORDS = [{ id: "REC-1" }, { id: "REC-2" }];

  const renderMultiRecordHook = (isMultiRecord: boolean) => {
    mockFetchJson(SUCCESS_RESPONSE);
    return renderHook(() =>
      useProcessExecution(
        makeParams({
          javaClassName: "com.example.MyProcess",
          button: { processDefinition: { id: "PDef-001", parameters: {}, isMultiRecord } },
          selectedRecords: TWO_RECORDS,
        })
      )
    );
  };

  it("sends one request per selected record when isMultiRecord=true", async () => {
    const { result } = renderMultiRecordHook(true);
    result.current.handleDirectJavaProcessExecute();
    // startTransition fires the loop without awaiting it — waitFor flushes the microtasks
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });

  it("sends a single request when isMultiRecord=false even with multiple records", async () => {
    const { result } = renderMultiRecordHook(false);
    await result.current.handleDirectJavaProcessExecute();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

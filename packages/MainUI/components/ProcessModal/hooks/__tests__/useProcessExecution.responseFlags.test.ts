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
import { renderHook } from "@testing-library/react";
import { useProcessExecution } from "../useProcessExecution";
import { makeParams } from "../testUtils/makeProcessExecutionParams";

const mockFetchJson = (data: unknown) => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: jest.fn().mockResolvedValue(data),
  }) as jest.Mock;
};

describe("useProcessExecution — executeJavaProcess response flags", () => {
  it("refreshes the grid when retryExecution=true and refreshParent is absent", async () => {
    mockFetchJson({ retryExecution: true });
    const setGridRefreshKey = jest.fn();
    const setResult = jest.fn();

    const { result } = renderHook(() => useProcessExecution(makeParams({ setGridRefreshKey, setResult })));
    await result.current.executeJavaProcess({});

    expect(setGridRefreshKey).toHaveBeenCalledWith(expect.any(Function));
    expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ keepOpen: true }));
  });

  it("refreshes the grid when retryExecution=true and refreshParent=true", async () => {
    mockFetchJson({ retryExecution: true, refreshParent: true });
    const setGridRefreshKey = jest.fn();

    const { result } = renderHook(() => useProcessExecution(makeParams({ setGridRefreshKey })));
    await result.current.executeJavaProcess({});

    expect(setGridRefreshKey).toHaveBeenCalledWith(expect.any(Function));
  });

  it("does not refresh the grid when retryExecution=true and refreshParent=false", async () => {
    mockFetchJson({ retryExecution: true, refreshParent: false });
    const setGridRefreshKey = jest.fn();
    const setResult = jest.fn();

    const { result } = renderHook(() => useProcessExecution(makeParams({ setGridRefreshKey, setResult })));
    await result.current.executeJavaProcess({});

    expect(setGridRefreshKey).not.toHaveBeenCalled();
    expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ keepOpen: true }));
  });

  it("does not set keepOpen=true when retryExecution is absent from the response", async () => {
    mockFetchJson({
      responseActions: [{ showMsgInProcessView: { msgType: "success", msgText: "Done" } }],
    });
    const setResult = jest.fn();

    const { result } = renderHook(() => useProcessExecution(makeParams({ setResult })));
    await result.current.executeJavaProcess({});

    const keepOpenCall = setResult.mock.calls.find(
      ([arg]) => arg && typeof arg === "object" && "keepOpen" in arg && arg.keepOpen === true
    );
    expect(keepOpenCall).toBeUndefined();
  });

  it("reads retryExecution nested under response.data", async () => {
    mockFetchJson({ response: { data: { retryExecution: true } } });
    const setGridRefreshKey = jest.fn();
    const setResult = jest.fn();

    const { result } = renderHook(() => useProcessExecution(makeParams({ setGridRefreshKey, setResult })));
    await result.current.executeJavaProcess({});

    expect(setGridRefreshKey).toHaveBeenCalledWith(expect.any(Function));
    expect(setResult).toHaveBeenCalledWith(expect.objectContaining({ keepOpen: true }));
  });
});

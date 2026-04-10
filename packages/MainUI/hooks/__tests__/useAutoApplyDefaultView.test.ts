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

import { renderHook, act } from "@testing-library/react";
import { useAutoApplyDefaultView } from "../useAutoApplyDefaultView";

jest.mock("@/utils/logger");
jest.mock("@/hooks/useUserContext", () => ({
  useUserContext: jest.fn(() => ({ token: "test-token" })),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_GRID_CONFIG = JSON.stringify({
  version: 1,
  source: "workspace-ui",
  filters: [{ id: "status", value: "active" }],
  visibility: { status: true },
  sorting: [{ id: "status", desc: false }],
  order: ["status"],
  implicitFilterApplied: true,
});

function makeDefaultViewRecord(overrides = {}) {
  return {
    id: "view-001",
    name: "Default View",
    tab: "tab-abc",
    user: "100",
    isdefault: true,
    filterclause: "",
    gridconfiguration: VALID_GRID_CONFIG,
    ...overrides,
  };
}

function makeSmartClientResponse(data: unknown[]) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ response: { status: 0, data, totalRows: data.length } }),
  } as Response);
}

function makeErrorResponse(status = 500) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: "Server error" }),
  } as Response);
}

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => jest.restoreAllMocks());

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAutoApplyDefaultView", () => {
  it("fetches and applies the default view on mount", async () => {
    jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord()]));

    const onApplyView = jest.fn();

    await act(async () => {
      renderHook(() =>
        useAutoApplyDefaultView({
          tabId: "tab-abc",
          windowIdentifier: "win-1",
          onApplyView,
        })
      );
    });

    expect(onApplyView).toHaveBeenCalledTimes(1);
    expect(onApplyView).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: [{ id: "status", value: "active" }],
        visibility: { status: true },
        sorting: [{ id: "status", desc: false }],
        order: ["status"],
        implicitFilterApplied: true,
      })
    );
  });

  it("does not fetch when tabId is empty", async () => {
    const spy = jest.spyOn(global, "fetch");
    const onApplyView = jest.fn();

    await act(async () => {
      renderHook(() =>
        useAutoApplyDefaultView({
          tabId: "",
          windowIdentifier: "win-1",
          onApplyView,
        })
      );
    });

    expect(spy).not.toHaveBeenCalled();
    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not fetch when windowIdentifier is empty", async () => {
    const spy = jest.spyOn(global, "fetch");
    const onApplyView = jest.fn();

    await act(async () => {
      renderHook(() =>
        useAutoApplyDefaultView({
          tabId: "tab-abc",
          windowIdentifier: "",
          onApplyView,
        })
      );
    });

    expect(spy).not.toHaveBeenCalled();
    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not apply view when the server returns no data", async () => {
    jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([]));

    const onApplyView = jest.fn();

    await act(async () => {
      renderHook(() =>
        useAutoApplyDefaultView({
          tabId: "tab-abc",
          windowIdentifier: "win-1",
          onApplyView,
        })
      );
    });

    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not apply view when the response is not ok", async () => {
    jest.spyOn(global, "fetch").mockReturnValue(makeErrorResponse(500));

    const onApplyView = jest.fn();

    await act(async () => {
      renderHook(() =>
        useAutoApplyDefaultView({
          tabId: "tab-abc",
          windowIdentifier: "win-1",
          onApplyView,
        })
      );
    });

    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not apply view when gridConfiguration is unparseable", async () => {
    jest
      .spyOn(global, "fetch")
      .mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord({ gridconfiguration: "{invalid json}" })]));

    const onApplyView = jest.fn();

    await act(async () => {
      renderHook(() =>
        useAutoApplyDefaultView({
          tabId: "tab-abc",
          windowIdentifier: "win-1",
          onApplyView,
        })
      );
    });

    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("does not apply view when gridConfiguration is empty", async () => {
    jest
      .spyOn(global, "fetch")
      .mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord({ gridconfiguration: "" })]));

    const onApplyView = jest.fn();

    await act(async () => {
      renderHook(() =>
        useAutoApplyDefaultView({
          tabId: "tab-abc",
          windowIdentifier: "win-1",
          onApplyView,
        })
      );
    });

    expect(onApplyView).not.toHaveBeenCalled();
  });

  it("sends tabId and isdefault=true in the fetch URL", async () => {
    const spy = jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([]));
    const onApplyView = jest.fn();

    await act(async () => {
      renderHook(() =>
        useAutoApplyDefaultView({
          tabId: "tab-xyz",
          windowIdentifier: "win-1",
          onApplyView,
        })
      );
    });

    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain("tab-xyz");
    expect(url).toContain("isdefault=true");
    expect(url).toContain("/meta/saved-views");
  });

  it("applies the view only once per windowIdentifier+tabId combination", async () => {
    jest.spyOn(global, "fetch").mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord()]));

    const onApplyView = jest.fn();

    const { rerender } = renderHook(
      ({ tabId, windowIdentifier }: { tabId: string; windowIdentifier: string }) =>
        useAutoApplyDefaultView({ tabId, windowIdentifier, onApplyView }),
      { initialProps: { tabId: "tab-abc", windowIdentifier: "win-1" } }
    );

    await act(async () => {});

    // Re-render with same props — should NOT apply again
    rerender({ tabId: "tab-abc", windowIdentifier: "win-1" });

    await act(async () => {});

    expect(onApplyView).toHaveBeenCalledTimes(1);
  });

  it("restores implicitFilterApplied:false when it was saved as false", async () => {
    const configWithFalse = JSON.stringify({
      version: 1,
      source: "workspace-ui",
      filters: [],
      visibility: {},
      sorting: [],
      order: [],
      implicitFilterApplied: false,
    });

    jest
      .spyOn(global, "fetch")
      .mockReturnValue(makeSmartClientResponse([makeDefaultViewRecord({ gridconfiguration: configWithFalse })]));

    const onApplyView = jest.fn();

    await act(async () => {
      renderHook(() =>
        useAutoApplyDefaultView({
          tabId: "tab-abc",
          windowIdentifier: "win-1",
          onApplyView,
        })
      );
    });

    expect(onApplyView).toHaveBeenCalledWith(expect.objectContaining({ implicitFilterApplied: false }));
  });
});

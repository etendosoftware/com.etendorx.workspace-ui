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

/**
 * @fileoverview Unit tests for MetadataStoreProvider and useMetadataStore
 *
 * Tests the metadata store implementation:
 * - MetadataStoreProvider state management
 * - useMetadataStore hook functionality
 * - Window metadata loading and caching
 * - Error handling and loading states
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { MetadataStoreProvider, useMetadataStore } from "../metadataStore";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { Etendo } from "@workspaceui/api-client/src/api/metadata";
import type { Tab } from "@workspaceui/api-client/src/api/types";

// Mock dependencies
jest.mock("@workspaceui/api-client/src/api/metadata");
jest.mock("@/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockMetadata = Metadata as jest.Mocked<typeof Metadata>;

/**
 * Test helpers
 */

const createMockTab = (id: string): Tab => ({
  id,
  name: `Tab ${id}`,
  title: `Tab ${id}`,
  window: "TestWindow",
  tabLevel: 0,
  parentTabId: undefined,
  uIPattern: "STD",
  table: "test_table",
  entityName: "TestEntity",
  fields: {},
  parentColumns: [],
  _identifier: "test_identifier",
  records: {},
  hqlfilterclause: "",
  hqlwhereclause: "",
  sQLWhereClause: "",
  module: "test_module",
});

const createMockWindowMetadata = (windowId: string): Etendo.WindowMetadata => ({
  id: windowId,
  name: `Window ${windowId}`,
  tabs: [createMockTab("tab1"), createMockTab("tab2")],
  properties: {
    windowId,
    multiDocumentEnabled: false,
    viewProperties: {
      fields: [],
      tabTitle: "Test Tab",
      entity: "TestEntity",
      statusBarFields: [],
      iconToolbarButtons: [],
      actionToolbarButtons: [],
      isDeleteableTable: true,
      tabId: "tab1",
      moduleId: "test_module",
      showCloneButton: false,
      askToCloneChildren: false,
      standardProperties: {} as any,
      showParentButtons: false,
      buttonsHaveSessionLogic: false,
      initialPropertyToColumns: [],
    },
  },
  window$_identifier: "window_identifier",
});

const setupMocks = () => {
  jest.clearAllMocks();
  mockMetadata.clearWindowCache = jest.fn();
  mockMetadata.forceWindowReload = jest.fn();
};

const renderMetadataStoreHook = () => {
  return renderHook(() => useMetadataStore(), {
    wrapper: MetadataStoreProvider,
  });
};

const setupLoadingPromise = (windowMetadata: Etendo.WindowMetadata) => {
  let resolveLoad: (value: Etendo.WindowMetadata) => void;
  const loadPromise = new Promise<Etendo.WindowMetadata>((resolve) => {
    resolveLoad = resolve;
  });
  mockMetadata.forceWindowReload.mockReturnValue(loadPromise);
  return { loadPromise, resolveLoad: resolveLoad!, windowMetadata };
};

const expectInitialState = (result: any) => {
  expect(result.current.windowsData).toEqual({});
  expect(result.current.loadingWindows).toEqual({});
  expect(result.current.errors).toEqual({});
};

const expectWindowLoaded = (result: any, windowId: string, metadata: Etendo.WindowMetadata) => {
  expect(result.current.windowsData[windowId]).toEqual(metadata);
  expect(result.current.isWindowLoading(windowId)).toBe(false);
  expect(result.current.getWindowError(windowId)).toBeUndefined();
};

const expectWindowError = (result: any, windowId: string, error: Error) => {
  expect(result.current.getWindowError(windowId)).toBe(error);
  expect(result.current.isWindowLoading(windowId)).toBe(false);
  expect(result.current.getWindowMetadata(windowId)).toBeUndefined();
};

describe("MetadataStoreProvider", () => {
  beforeEach(setupMocks);

  it("should provide initial empty state", () => {
    const { result } = renderMetadataStoreHook();
    expectInitialState(result);
  });

  it("should provide all required functions", () => {
    const { result } = renderMetadataStoreHook();

    expect(typeof result.current.loadWindowData).toBe("function");
    expect(typeof result.current.getWindowMetadata).toBe("function");
    expect(typeof result.current.isWindowLoading).toBe("function");
    expect(typeof result.current.getWindowError).toBe("function");
  });
});

describe("loadWindowData", () => {
  beforeEach(setupMocks);

  it("should load window metadata successfully", async () => {
    const windowMetadata = createMockWindowMetadata("window1");
    mockMetadata.forceWindowReload.mockResolvedValue(windowMetadata);

    const { result } = renderMetadataStoreHook();

    let loadedData: Etendo.WindowMetadata | undefined;

    await act(async () => {
      loadedData = await result.current.loadWindowData("window1");
    });

    expect(mockMetadata.clearWindowCache).toHaveBeenCalledWith("window1");
    expect(mockMetadata.forceWindowReload).toHaveBeenCalledWith("window1");
    expect(loadedData).toEqual(windowMetadata);
    expect(result.current.windowsData.window1).toEqual(windowMetadata);
  });

  it("should set loading state during load", async () => {
    const { loadPromise, resolveLoad, windowMetadata } = setupLoadingPromise(createMockWindowMetadata("window1"));
    const { result } = renderMetadataStoreHook();

    // Start loading
    act(() => {
      result.current.loadWindowData("window1");
    });

    // Check loading state is true
    await waitFor(() => {
      expect(result.current.isWindowLoading("window1")).toBe(true);
    });

    // Resolve the load
    await act(async () => {
      resolveLoad(windowMetadata);
      await loadPromise;
    });

    // Check loading state is false
    await waitFor(() => {
      expect(result.current.isWindowLoading("window1")).toBe(false);
    });
  });

  it("should clear loading state after successful load", async () => {
    const windowMetadata = createMockWindowMetadata("window1");
    mockMetadata.forceWindowReload.mockResolvedValue(windowMetadata);
    const { result } = renderMetadataStoreHook();

    await act(async () => {
      await result.current.loadWindowData("window1");
    });

    expect(result.current.isWindowLoading("window1")).toBe(false);
  });

  it("should return cached data if already loaded", async () => {
    const windowMetadata = createMockWindowMetadata("window1");
    mockMetadata.forceWindowReload.mockResolvedValue(windowMetadata);
    const { result } = renderMetadataStoreHook();

    // First load
    await act(async () => {
      await result.current.loadWindowData("window1");
    });

    // Clear mocks
    jest.clearAllMocks();

    // Second load should return cached data
    let cachedData: Etendo.WindowMetadata | undefined;
    await act(async () => {
      cachedData = await result.current.loadWindowData("window1");
    });

    expect(mockMetadata.clearWindowCache).not.toHaveBeenCalled();
    expect(mockMetadata.forceWindowReload).not.toHaveBeenCalled();
    expect(cachedData).toEqual(windowMetadata);
  });

  it("should handle load errors correctly", async () => {
    const loadError = new Error("Failed to load window");
    mockMetadata.forceWindowReload.mockRejectedValue(loadError);
    const { result } = renderMetadataStoreHook();

    await act(async () => {
      try {
        await result.current.loadWindowData("window1");
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expectWindowError(result, "window1", loadError);
    });
  });

  it("should clear error state before new load attempt", async () => {
    const loadError = new Error("Failed to load window");
    mockMetadata.forceWindowReload.mockRejectedValueOnce(loadError);
    const { result } = renderMetadataStoreHook();

    // First load fails
    await act(async () => {
      try {
        await result.current.loadWindowData("window1");
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.getWindowError("window1")).toBe(loadError);
    });

    // Second load succeeds
    const windowMetadata = createMockWindowMetadata("window1");
    mockMetadata.forceWindowReload.mockResolvedValue(windowMetadata);

    await act(async () => {
      await result.current.loadWindowData("window1");
    });

    await waitFor(() => {
      expect(result.current.errors.window1).toBeUndefined();
      expect(result.current.windowsData.window1).toEqual(windowMetadata);
    });
  });

  it("should load multiple windows independently", async () => {
    const window1Metadata = createMockWindowMetadata("window1");
    const window2Metadata = createMockWindowMetadata("window2");

    mockMetadata.forceWindowReload.mockResolvedValueOnce(window1Metadata).mockResolvedValueOnce(window2Metadata);
    const { result } = renderMetadataStoreHook();

    await act(async () => {
      await result.current.loadWindowData("window1");
      await result.current.loadWindowData("window2");
    });

    expect(result.current.windowsData.window1).toEqual(window1Metadata);
    expect(result.current.windowsData.window2).toEqual(window2Metadata);
  });

  it("should handle concurrent loads of the same window", async () => {
    const windowMetadata = createMockWindowMetadata("window1");
    mockMetadata.forceWindowReload.mockResolvedValue(windowMetadata);

    const { result } = renderHook(() => useMetadataStore(), {
      wrapper: MetadataStoreProvider,
    });

    // First load
    await act(async () => {
      await result.current.loadWindowData("window1");
    });

    expect(result.current.windowsData.window1).toEqual(windowMetadata);

    // Clear mocks to verify second call uses cache
    jest.clearAllMocks();

    // Second load should use cached data
    await act(async () => {
      const cachedData = await result.current.loadWindowData("window1");
      expect(cachedData).toEqual(windowMetadata);
    });

    // Should not reload if data is already cached
    expect(mockMetadata.forceWindowReload).not.toHaveBeenCalled();
  });
});

describe("getWindowMetadata", () => {
  beforeEach(setupMocks);

  it("should return undefined for non-existent window", () => {
    const { result } = renderMetadataStoreHook();

    expect(result.current.getWindowMetadata("nonexistent")).toBeUndefined();
  });

  it("should return window metadata after loading", async () => {
    const windowMetadata = createMockWindowMetadata("window1");
    mockMetadata.forceWindowReload.mockResolvedValue(windowMetadata);
    const { result } = renderMetadataStoreHook();

    await act(async () => {
      await result.current.loadWindowData("window1");
    });

    expect(result.current.getWindowMetadata("window1")).toEqual(windowMetadata);
  });

  it("should return correct metadata for multiple windows", async () => {
    const window1Metadata = createMockWindowMetadata("window1");
    const window2Metadata = createMockWindowMetadata("window2");

    mockMetadata.forceWindowReload.mockResolvedValueOnce(window1Metadata).mockResolvedValueOnce(window2Metadata);

    const { result } = renderHook(() => useMetadataStore(), {
      wrapper: MetadataStoreProvider,
    });

    await act(async () => {
      await result.current.loadWindowData("window1");
      await result.current.loadWindowData("window2");
    });

    expect(result.current.getWindowMetadata("window1")).toEqual(window1Metadata);
    expect(result.current.getWindowMetadata("window2")).toEqual(window2Metadata);
  });
});

describe("isWindowLoading", () => {
  beforeEach(setupMocks);

  it("should return false for non-loading window", () => {
    const { result } = renderMetadataStoreHook();

    expect(result.current.isWindowLoading("window1")).toBe(false);
  });

  it("should return true during loading", async () => {
    const { loadPromise, resolveLoad, windowMetadata } = setupLoadingPromise(createMockWindowMetadata("window1"));
    const { result } = renderMetadataStoreHook();

    act(() => {
      result.current.loadWindowData("window1");
    });

    await waitFor(() => {
      expect(result.current.isWindowLoading("window1")).toBe(true);
    });

    await act(async () => {
      resolveLoad(windowMetadata);
      await loadPromise;
    });

    expect(result.current.isWindowLoading("window1")).toBe(false);
  });

  it("should return false after load completes", async () => {
    const windowMetadata = createMockWindowMetadata("window1");
    mockMetadata.forceWindowReload.mockResolvedValue(windowMetadata);
    const { result } = renderMetadataStoreHook();

    await act(async () => {
      await result.current.loadWindowData("window1");
    });

    expect(result.current.isWindowLoading("window1")).toBe(false);
  });

  it("should return false after load fails", async () => {
    const loadError = new Error("Failed to load window");
    mockMetadata.forceWindowReload.mockRejectedValue(loadError);

    const { result } = renderHook(() => useMetadataStore(), {
      wrapper: MetadataStoreProvider,
    });

    await expect(
      act(async () => {
        await result.current.loadWindowData("window1");
      })
    ).rejects.toThrow("Failed to load window");

    expect(result.current.isWindowLoading("window1")).toBe(false);
  });
});

describe("getWindowError", () => {
  beforeEach(setupMocks);

  it("should return undefined for window without error", () => {
    const { result } = renderMetadataStoreHook();

    expect(result.current.getWindowError("window1")).toBeUndefined();
  });

  it("should return error after failed load", async () => {
    const loadError = new Error("Failed to load window");
    mockMetadata.forceWindowReload.mockRejectedValue(loadError);
    const { result } = renderMetadataStoreHook();

    await act(async () => {
      try {
        await result.current.loadWindowData("window1");
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.getWindowError("window1")).toBe(loadError);
    });
  });

  it("should clear error after successful reload", async () => {
    const loadError = new Error("Failed to load window");
    mockMetadata.forceWindowReload.mockRejectedValueOnce(loadError);

    const { result } = renderHook(() => useMetadataStore(), {
      wrapper: MetadataStoreProvider,
    });

    // First load fails
    await act(async () => {
      try {
        await result.current.loadWindowData("window1");
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.getWindowError("window1")).toBe(loadError);
    });

    // Second load succeeds
    const windowMetadata = createMockWindowMetadata("window1");
    mockMetadata.forceWindowReload.mockResolvedValue(windowMetadata);

    await act(async () => {
      await result.current.loadWindowData("window1");
    });

    expect(result.current.getWindowError("window1")).toBeUndefined();
  });

  it("should handle errors for multiple windows independently", async () => {
    const error1 = new Error("Error 1");
    const error2 = new Error("Error 2");

    mockMetadata.forceWindowReload.mockRejectedValueOnce(error1).mockRejectedValueOnce(error2);

    const { result } = renderHook(() => useMetadataStore(), {
      wrapper: MetadataStoreProvider,
    });

    await act(async () => {
      try {
        await result.current.loadWindowData("window1");
      } catch (error) {
        // Expected to throw
      }
    });

    await act(async () => {
      try {
        await result.current.loadWindowData("window2");
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.getWindowError("window1")).toBe(error1);
      expect(result.current.getWindowError("window2")).toBe(error2);
    });
  });
});

describe("Integration scenarios", () => {
  beforeEach(setupMocks);

  it("should handle complete workflow: load, error, retry, success", async () => {
    const loadError = new Error("Network error");
    const windowMetadata = createMockWindowMetadata("window1");

    mockMetadata.forceWindowReload.mockRejectedValueOnce(loadError).mockResolvedValueOnce(windowMetadata);
    const { result } = renderMetadataStoreHook();

    // Initial state
    expect(result.current.getWindowMetadata("window1")).toBeUndefined();
    expect(result.current.isWindowLoading("window1")).toBe(false);
    expect(result.current.getWindowError("window1")).toBeUndefined();

    // First load fails
    await act(async () => {
      try {
        await result.current.loadWindowData("window1");
      } catch (error) {
        // Expected to throw
      }
    });

    await waitFor(() => {
      expect(result.current.getWindowMetadata("window1")).toBeUndefined();
      expect(result.current.isWindowLoading("window1")).toBe(false);
      expect(result.current.getWindowError("window1")).toBe(loadError);
    });

    // Retry succeeds
    await act(async () => {
      await result.current.loadWindowData("window1");
    });

    expectWindowLoaded(result, "window1", windowMetadata);
  });

  it("should manage state for multiple windows simultaneously", async () => {
    const window1Metadata = createMockWindowMetadata("window1");
    const window2Metadata = createMockWindowMetadata("window2");
    const window3Error = new Error("Window 3 error");

    mockMetadata.forceWindowReload
      .mockResolvedValueOnce(window1Metadata)
      .mockResolvedValueOnce(window2Metadata)
      .mockRejectedValueOnce(window3Error);
    const { result } = renderMetadataStoreHook();

    await act(async () => {
      await result.current.loadWindowData("window1");
      await result.current.loadWindowData("window2");
    });

    await act(async () => {
      try {
        await result.current.loadWindowData("window3");
      } catch (error) {
        // Expected to throw
      }
    });

    // Verify all windows have independent state
    expect(result.current.getWindowMetadata("window1")).toEqual(window1Metadata);
    expect(result.current.getWindowMetadata("window2")).toEqual(window2Metadata);
    expect(result.current.getWindowMetadata("window3")).toBeUndefined();

    expect(result.current.isWindowLoading("window1")).toBe(false);
    expect(result.current.isWindowLoading("window2")).toBe(false);
    expect(result.current.isWindowLoading("window3")).toBe(false);

    await waitFor(() => {
      expect(result.current.getWindowError("window1")).toBeUndefined();
      expect(result.current.getWindowError("window2")).toBeUndefined();
      expect(result.current.getWindowError("window3")).toBe(window3Error);
    });
  });
});

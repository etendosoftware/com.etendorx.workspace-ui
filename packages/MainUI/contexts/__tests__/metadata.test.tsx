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
 * @fileoverview Unit tests for metadata context (MetadataSynchronizer and useMetadataContext)
 *
 * Tests the metadata context implementation:
 * - MetadataSynchronizer component behavior
 * - useMetadataContext hook functionality
 * - Integration with WindowContext and MetadataStore
 * - Metadata loading and error handling
 */

import { render, renderHook, waitFor } from "@testing-library/react";
import { MetadataSynchronizer, useMetadataContext } from "../metadata";
import { useWindowStore } from "@/stores/windowStore";
import { useMetadataStore } from "../metadataStore";
import { useDatasourceContext } from "../datasourceContext";
import type { Tab, WindowMetadata } from "@workspaceui/api-client/src/api/types";

// Mock dependencies
jest.mock("@/stores/windowStore");
jest.mock("../metadataStore");
jest.mock("../datasourceContext");
jest.mock("@workspaceui/api-client/src/utils/metadata", () => ({
  groupTabsByLevel: jest.fn((window) => {
    if (!window?.tabs) return [];
    return [window.tabs];
  }),
}));

const mockUseWindowStore = useWindowStore as unknown as jest.Mock;
const mockUseMetadataStore = useMetadataStore as jest.MockedFunction<typeof useMetadataStore>;
const mockUseDatasourceContext = useDatasourceContext as jest.MockedFunction<typeof useDatasourceContext>;

// Mock data helpers
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

const createMockWindowMetadata = (windowId: string): WindowMetadata => ({
  id: windowId,
  name: `Window ${windowId}`,
  tabs: [createMockTab("tab1"), createMockTab("tab2")],
  _identifier: "window_identifier",
});

// Mock store state helpers
const mockCleanupWindow = jest.fn();

const createMockWindowStoreState = (activeWindow: any = null) => {
  const windows: Record<string, any> = {};
  if (activeWindow) {
    windows[activeWindow.windowIdentifier] = activeWindow;
  }
  return {
    windows,
    cleanupWindow: mockCleanupWindow,
  };
};

const setWindowStoreState = (activeWindow: any = null) => {
  const storeState = createMockWindowStoreState(activeWindow);
  mockUseWindowStore.mockImplementation((selector: (s: any) => any) => selector(storeState));
};

const createMockActiveWindow = (windowId: string) => ({
  windowId,
  windowIdentifier: `${windowId}_123`,
  isActive: true,
  initialized: false,
  title: "Test Window",
  navigation: {
    activeLevels: [0],
    activeTabsByLevel: new Map(),
    initialized: false,
  },
  tabs: {},
});

describe("MetadataSynchronizer", () => {
  let mockLoadWindowData: jest.Mock;
  let mockIsWindowLoading: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLoadWindowData = jest.fn().mockResolvedValue(createMockWindowMetadata("window1"));
    mockIsWindowLoading = jest.fn().mockReturnValue(false);

    mockUseMetadataStore.mockReturnValue({
      windowsData: {},
      loadingWindows: {},
      errors: {},
      loadWindowData: mockLoadWindowData,
      getWindowMetadata: jest.fn(),
      isWindowLoading: mockIsWindowLoading,
      getWindowError: jest.fn(),
    });

    setWindowStoreState();
  });

  it("should render without errors", () => {
    expect(() => {
      render(<MetadataSynchronizer />);
    }).not.toThrow();
  });

  it("should return null (no visual output)", () => {
    const { container } = render(<MetadataSynchronizer />);
    expect(container.firstChild).toBeNull();
  });

  it("should not load metadata when no active window", () => {
    setWindowStoreState(null);

    render(<MetadataSynchronizer />);

    expect(mockLoadWindowData).not.toHaveBeenCalled();
  });

  it("should load metadata when active window exists and data is not loaded", async () => {
    setWindowStoreState(createMockActiveWindow("window1"));

    render(<MetadataSynchronizer />);

    await waitFor(() => {
      expect(mockLoadWindowData).toHaveBeenCalledWith("window1");
    });
  });

  it("should not load metadata when window data is already loaded", () => {
    const windowMetadata = createMockWindowMetadata("window1");

    setWindowStoreState(createMockActiveWindow("window1"));

    mockUseMetadataStore.mockReturnValue({
      windowsData: { window1: windowMetadata },
      loadingWindows: {},
      errors: {},
      loadWindowData: mockLoadWindowData,
      getWindowMetadata: jest.fn().mockReturnValue(windowMetadata),
      isWindowLoading: mockIsWindowLoading,
      getWindowError: jest.fn(),
    });

    render(<MetadataSynchronizer />);

    expect(mockLoadWindowData).not.toHaveBeenCalled();
  });

  it("should not load metadata when window is already loading", () => {
    mockIsWindowLoading.mockReturnValue(true);

    setWindowStoreState(createMockActiveWindow("window1"));

    render(<MetadataSynchronizer />);

    expect(mockLoadWindowData).not.toHaveBeenCalled();
  });

  it("should handle load errors gracefully", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const loadError = new Error("Failed to load metadata");
    mockLoadWindowData.mockRejectedValue(loadError);

    setWindowStoreState(createMockActiveWindow("window1"));

    render(<MetadataSynchronizer />);

    await waitFor(() => {
      expect(mockLoadWindowData).toHaveBeenCalledWith("window1");
    });

    consoleErrorSpy.mockRestore();
  });
});

describe("useMetadataContext", () => {
  let mockGetWindowMetadata: jest.Mock;
  let mockIsWindowLoading: jest.Mock;
  let mockGetWindowError: jest.Mock;
  let mockLoadWindowData: jest.Mock;
  let mockRemoveRecordFromDatasource: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetWindowMetadata = jest.fn();
    mockIsWindowLoading = jest.fn().mockReturnValue(false);
    mockGetWindowError = jest.fn();
    mockLoadWindowData = jest.fn().mockResolvedValue(createMockWindowMetadata("window1"));
    mockRemoveRecordFromDatasource = jest.fn();

    mockUseMetadataStore.mockReturnValue({
      windowsData: {},
      loadingWindows: {},
      errors: {},
      loadWindowData: mockLoadWindowData,
      getWindowMetadata: mockGetWindowMetadata,
      isWindowLoading: mockIsWindowLoading,
      getWindowError: mockGetWindowError,
    });

    mockUseDatasourceContext.mockReturnValue({
      removeRecordFromDatasource: mockRemoveRecordFromDatasource,
      datasources: {},
      getDatasource: jest.fn(),
      setDatasource: jest.fn(),
      updateDatasource: jest.fn(),
      clearDatasource: jest.fn(),
    });

    setWindowStoreState(null);
  });

  it("should return default values when no active window", () => {
    const { result } = renderHook(() => useMetadataContext());

    expect(result.current.windowId).toBeUndefined();
    expect(result.current.windowIdentifier).toBeUndefined();
    expect(result.current.window).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.groupedTabs).toEqual([]);
    expect(result.current.tabs).toEqual({});
  });

  it("should return window metadata when active window exists", () => {
    const windowMetadata = createMockWindowMetadata("window1");
    mockGetWindowMetadata.mockReturnValue(windowMetadata);

    setWindowStoreState(createMockActiveWindow("window1"));

    const { result } = renderHook(() => useMetadataContext());

    expect(result.current.windowId).toBe("window1");
    expect(result.current.windowIdentifier).toBe("window1_123");
    expect(result.current.window).toEqual(windowMetadata);
    expect(result.current.loading).toBe(false);
  });

  it("should return loading state correctly", () => {
    mockIsWindowLoading.mockReturnValue(true);

    setWindowStoreState(createMockActiveWindow("window1"));

    const { result } = renderHook(() => useMetadataContext());

    expect(result.current.loading).toBe(true);
  });

  it("should return error state correctly", () => {
    const testError = new Error("Test error");
    mockGetWindowError.mockReturnValue(testError);

    setWindowStoreState(createMockActiveWindow("window1"));

    const { result } = renderHook(() => useMetadataContext());

    expect(result.current.error).toBe(testError);
  });

  it("should provide removeRecord function that proxies to datasource", () => {
    const { result } = renderHook(() => useMetadataContext());

    result.current.removeRecord("tab1", "record1");

    expect(mockRemoveRecordFromDatasource).toHaveBeenCalledWith("tab1", "record1");
  });

  it("should provide all metadata store functions", () => {
    const { result } = renderHook(() => useMetadataContext());

    expect(result.current.loadWindowData).toBe(mockLoadWindowData);
    expect(result.current.getWindowMetadata).toBe(mockGetWindowMetadata);
    expect(result.current.isWindowLoading).toBe(mockIsWindowLoading);
    expect(result.current.getWindowError).toBe(mockGetWindowError);
  });

  it("should compute grouped tabs correctly", () => {
    const windowMetadata = createMockWindowMetadata("window1");
    mockGetWindowMetadata.mockReturnValue(windowMetadata);

    setWindowStoreState(createMockActiveWindow("window1"));

    const { result } = renderHook(() => useMetadataContext());

    expect(result.current.groupedTabs).toEqual([windowMetadata.tabs]);
  });

  it("should compute tabs map correctly", () => {
    const windowMetadata = createMockWindowMetadata("window1");
    mockGetWindowMetadata.mockReturnValue(windowMetadata);

    setWindowStoreState(createMockActiveWindow("window1"));

    const { result } = renderHook(() => useMetadataContext());

    expect(result.current.tabs).toEqual({
      tab1: windowMetadata.tabs[0],
      tab2: windowMetadata.tabs[1],
    });
  });
});

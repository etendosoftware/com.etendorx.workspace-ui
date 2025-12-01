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
 * @fileoverview Unit tests for useGlobalUrlStateRecovery hook
 *
 * Tests the URL state recovery implementation:
 * - Recovery from URL parameters
 * - Metadata loading integration
 * - Window state reconstruction
 * - Error handling and loading states
 * - Empty state and edge cases
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useGlobalUrlStateRecovery } from "../useGlobalUrlStateRecovery";
import { useSearchParams } from "next/navigation";
import { useMetadataStore } from "@/contexts/metadataStore";
import { parseWindowRecoveryData } from "@/utils/url/utils";
import { parseUrlState, getWindowName } from "@/utils/recovery/urlStateParser";
import { calculateHierarchy } from "@/utils/recovery/hierarchyCalculator";
import { reconstructState } from "@/utils/recovery/stateReconstructor";
import type { WindowMetadata, Tab } from "@workspaceui/api-client/src/api/types";
import type { WindowRecoveryInfo } from "@/utils/window/constants";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));
jest.mock("@/contexts/metadataStore");
jest.mock("@/utils/url/utils");
jest.mock("@/utils/recovery/urlStateParser");
jest.mock("@/utils/recovery/hierarchyCalculator");
jest.mock("@/utils/recovery/stateReconstructor");

const mockUseSearchParams = useSearchParams as jest.Mock;
const mockUseMetadataStore = useMetadataStore as jest.MockedFunction<typeof useMetadataStore>;
const mockParseWindowRecoveryData = parseWindowRecoveryData as jest.MockedFunction<typeof parseWindowRecoveryData>;
const mockParseUrlState = parseUrlState as jest.MockedFunction<typeof parseUrlState>;
const mockGetWindowName = getWindowName as jest.MockedFunction<typeof getWindowName>;
const mockCalculateHierarchy = calculateHierarchy as jest.MockedFunction<typeof calculateHierarchy>;
const mockReconstructState = reconstructState as jest.MockedFunction<typeof reconstructState>;

// Mock data
const createMockTab = (id: string, level = 0): Tab => ({
  id,
  name: `Tab ${id}`,
  title: `Tab ${id}`,
  window: "TestWindow",
  tabLevel: level,
  parentTabId: level > 0 ? "parentTab" : undefined,
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
  tabs: [createMockTab("tab1", 0), createMockTab("tab2", 1)],
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

const createMockRecoveryInfo = (windowIdentifier: string, hasRecoveryData = false): WindowRecoveryInfo => ({
  windowIdentifier,
  tabId: hasRecoveryData ? "tab2" : undefined,
  recordId: hasRecoveryData ? "record123" : undefined,
  hasRecoveryData,
});

const createMockSearchParams = (params: Record<string, string>): URLSearchParams => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value);
  });
  return searchParams;
};

describe("useGlobalUrlStateRecovery", () => {
  let mockLoadWindowData: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLoadWindowData = jest.fn();

    mockUseMetadataStore.mockReturnValue({
      windowsData: {},
      loadingWindows: {},
      errors: {},
      loadWindowData: mockLoadWindowData,
      getWindowMetadata: jest.fn(),
      isWindowLoading: jest.fn(),
      getWindowError: jest.fn(),
    });

    mockUseSearchParams.mockReturnValue(null);
  });

  describe("Initial state", () => {
    it("should return initial loading state when no search params", () => {
      mockUseSearchParams.mockReturnValue(null);

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      // When searchParams is null, the effect doesn't run, so loading stays true
      expect(result.current.isRecoveryLoading).toBe(true);
      expect(result.current.recoveredWindows).toEqual([]);
      expect(result.current.recoveryError).toBeNull();
    });

    it("should return empty state when search params are empty", async () => {
      const emptyParams = createMockSearchParams({});
      mockUseSearchParams.mockReturnValue(emptyParams);
      mockParseWindowRecoveryData.mockReturnValue([]);

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(result.current.recoveredWindows).toEqual([]);
      expect(result.current.recoveryError).toBeNull();
    });

    it("should start with loading state true", () => {
      const params = createMockSearchParams({ wi_0: "143_123456" });
      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([createMockRecoveryInfo("143_123456")]);

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      expect(result.current.isRecoveryLoading).toBe(true);
      expect(result.current.recoveredWindows).toEqual([]);
      expect(result.current.recoveryError).toBeNull();
    });
  });

  describe("Simple recovery (window ID only)", () => {
    it("should recover single window without tab/record data", async () => {
      const params = createMockSearchParams({ wi_0: "143_123456" });
      const recoveryInfo = createMockRecoveryInfo("143_123456", false);
      const windowMetadata = createMockWindowMetadata("143");

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo]);
      mockLoadWindowData.mockResolvedValue(windowMetadata);
      mockGetWindowName.mockReturnValue("Sales Order");

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(mockLoadWindowData).toHaveBeenCalledWith("143");
      expect(mockGetWindowName).toHaveBeenCalledWith(windowMetadata);
      expect(result.current.recoveredWindows).toHaveLength(1);
      expect(result.current.recoveredWindows[0]).toMatchObject({
        windowId: "143",
        windowIdentifier: "143_123456",
        title: "Sales Order",
        initialized: true,
        isActive: true,
      });
      expect(result.current.recoveryError).toBeNull();
    });

    it("should recover multiple windows without recovery data", async () => {
      const params = createMockSearchParams({ wi_0: "143_123456", wi_1: "144_789012" });
      const recoveryInfo1 = createMockRecoveryInfo("143_123456", false);
      const recoveryInfo2 = createMockRecoveryInfo("144_789012", false);
      const windowMetadata1 = createMockWindowMetadata("143");
      const windowMetadata2 = createMockWindowMetadata("144");

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo1, recoveryInfo2]);
      mockLoadWindowData.mockResolvedValueOnce(windowMetadata1).mockResolvedValueOnce(windowMetadata2);
      mockGetWindowName.mockReturnValueOnce("Sales Order").mockReturnValueOnce("Purchase Order");

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(mockLoadWindowData).toHaveBeenCalledTimes(2);
      expect(result.current.recoveredWindows).toHaveLength(2);
      expect(result.current.recoveredWindows[0].isActive).toBe(false);
      expect(result.current.recoveredWindows[1].isActive).toBe(true);
      expect(result.current.recoveryError).toBeNull();
    });
  });

  describe("Complex recovery (with tab and record data)", () => {
    it("should recover single window with tab and record data", async () => {
      const params = createMockSearchParams({
        wi_0: "143_123456",
        ti_0: "tab2",
        ri_0: "record123",
      });
      const recoveryInfo = createMockRecoveryInfo("143_123456", true);
      const windowMetadata = createMockWindowMetadata("143");

      const mockUrlState = {
        windowIdentifier: "143_123456",
        tabId: "tab2",
        recordId: "record123",
        windowId: "143",
        tabTitle: "Order Lines",
        tabLevel: 1,
        keyParameter: "cOrderId",
      };

      const mockHierarchy = {
        targetTab: {
          tabId: "tab2",
          tab: createMockTab("tab2", 1),
          level: 1,
          recordId: "record123",
          children: [],
        },
        parentTabs: [],
        rootTab: {
          tabId: "tab1",
          tab: createMockTab("tab1", 0),
          level: 0,
          children: [],
        },
      };

      const mockReconstructed = {
        tabs: {
          tab1: {
            table: {
              filters: [],
              visibility: {},
              sorting: [],
              order: [],
              isImplicitFilterApplied: true,
            },
            form: {},
            level: 0,
            selectedRecord: "parentRecord",
          },
          tab2: {
            table: {
              filters: [],
              visibility: {},
              sorting: [],
              order: [],
              isImplicitFilterApplied: true,
            },
            form: {
              recordId: "record123",
              mode: "form",
              formMode: "edit",
            },
            level: 1,
            selectedRecord: "record123",
          },
        },
        navigation: {
          activeLevels: [1],
          activeTabsByLevel: new Map([
            [0, "tab1"],
            [1, "tab2"],
          ]),
          initialized: true,
        },
      };

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo]);
      mockLoadWindowData.mockResolvedValue(windowMetadata);
      mockParseUrlState.mockResolvedValue(mockUrlState);
      mockCalculateHierarchy.mockResolvedValue(mockHierarchy);
      mockReconstructState.mockResolvedValue(mockReconstructed);

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(mockLoadWindowData).toHaveBeenCalledWith("143");
      expect(mockParseUrlState).toHaveBeenCalledWith(recoveryInfo, windowMetadata);
      expect(mockCalculateHierarchy).toHaveBeenCalledWith(mockUrlState, windowMetadata);
      expect(mockReconstructState).toHaveBeenCalledWith(mockHierarchy, windowMetadata);

      expect(result.current.recoveredWindows).toHaveLength(1);
      expect(result.current.recoveredWindows[0]).toMatchObject({
        windowId: "143",
        windowIdentifier: "143_123456",
        title: "Order Lines",
        initialized: true,
        isActive: true,
        tabs: mockReconstructed.tabs,
        navigation: mockReconstructed.navigation,
      });
      expect(result.current.recoveryError).toBeNull();
    });

    it("should recover multiple windows with mixed recovery types", async () => {
      const params = createMockSearchParams({
        wi_0: "143_123456",
        wi_1: "144_789012",
        ti_1: "tab2",
        ri_1: "record456",
      });

      const recoveryInfo1 = createMockRecoveryInfo("143_123456", false);
      const recoveryInfo2 = createMockRecoveryInfo("144_789012", true);
      recoveryInfo2.tabId = "tab2";
      recoveryInfo2.recordId = "record456";

      const windowMetadata1 = createMockWindowMetadata("143");
      const windowMetadata2 = createMockWindowMetadata("144");

      const mockUrlState = {
        windowIdentifier: "144_789012",
        tabId: "tab2",
        recordId: "record456",
        windowId: "144",
        tabTitle: "Purchase Lines",
        tabLevel: 1,
        keyParameter: "cOrderId",
      };

      const mockHierarchy = {
        targetTab: {
          tabId: "tab2",
          tab: createMockTab("tab2", 1),
          level: 1,
          recordId: "record456",
          children: [],
        },
        parentTabs: [],
        rootTab: {
          tabId: "tab1",
          tab: createMockTab("tab1", 0),
          level: 0,
          children: [],
        },
      };

      const mockReconstructed = {
        tabs: {
          tab2: {
            table: {
              filters: [],
              visibility: {},
              sorting: [],
              order: [],
              isImplicitFilterApplied: true,
            },
            form: {
              recordId: "record456",
              mode: "form",
              formMode: "edit",
            },
            level: 1,
            selectedRecord: "record456",
          },
        },
        navigation: {
          activeLevels: [1],
          activeTabsByLevel: new Map([[1, "tab2"]]),
          initialized: true,
        },
      };

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo1, recoveryInfo2]);
      mockLoadWindowData.mockResolvedValueOnce(windowMetadata1).mockResolvedValueOnce(windowMetadata2);
      mockGetWindowName.mockReturnValue("Sales Order");
      mockParseUrlState.mockResolvedValue(mockUrlState);
      mockCalculateHierarchy.mockResolvedValue(mockHierarchy);
      mockReconstructState.mockResolvedValue(mockReconstructed);

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(result.current.recoveredWindows).toHaveLength(2);
      expect(result.current.recoveredWindows[0].hasRecoveryData).toBeUndefined();
      expect(result.current.recoveredWindows[1].tabs).toEqual(mockReconstructed.tabs);
      expect(result.current.recoveryError).toBeNull();
    });
  });

  describe("Error handling", () => {
    it("should handle metadata loading error", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const params = createMockSearchParams({ wi_0: "143_123456" });
      const recoveryInfo = createMockRecoveryInfo("143_123456", false);

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo]);
      mockLoadWindowData.mockRejectedValue(new Error("Failed to load metadata"));

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(result.current.recoveredWindows).toEqual([]);
      expect(result.current.recoveryError).toBe("Failed to recover windows");
      expect(consoleErrorSpy).toHaveBeenCalledWith("Global recovery failed", expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it("should handle URL state parsing error", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const params = createMockSearchParams({
        wi_0: "143_123456",
        ti_0: "tab2",
        ri_0: "record123",
      });
      const recoveryInfo = createMockRecoveryInfo("143_123456", true);
      const windowMetadata = createMockWindowMetadata("143");

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo]);
      mockLoadWindowData.mockResolvedValue(windowMetadata);
      mockParseUrlState.mockRejectedValue(new Error("Failed to parse URL state"));

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(result.current.recoveredWindows).toEqual([]);
      expect(result.current.recoveryError).toBe("Failed to recover windows");
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should handle hierarchy calculation error", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const params = createMockSearchParams({
        wi_0: "143_123456",
        ti_0: "tab2",
        ri_0: "record123",
      });
      const recoveryInfo = createMockRecoveryInfo("143_123456", true);
      const windowMetadata = createMockWindowMetadata("143");

      const mockUrlState = {
        windowIdentifier: "143_123456",
        tabId: "tab2",
        recordId: "record123",
        windowId: "143",
        tabTitle: "Order Lines",
        tabLevel: 1,
        keyParameter: "cOrderId",
      };

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo]);
      mockLoadWindowData.mockResolvedValue(windowMetadata);
      mockParseUrlState.mockResolvedValue(mockUrlState);
      mockCalculateHierarchy.mockRejectedValue(new Error("Failed to calculate hierarchy"));

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(result.current.recoveredWindows).toEqual([]);
      expect(result.current.recoveryError).toBe("Failed to recover windows");
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should handle state reconstruction error", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const params = createMockSearchParams({
        wi_0: "143_123456",
        ti_0: "tab2",
        ri_0: "record123",
      });
      const recoveryInfo = createMockRecoveryInfo("143_123456", true);
      const windowMetadata = createMockWindowMetadata("143");

      const mockUrlState = {
        windowIdentifier: "143_123456",
        tabId: "tab2",
        recordId: "record123",
        windowId: "143",
        tabTitle: "Order Lines",
        tabLevel: 1,
        keyParameter: "cOrderId",
      };

      const mockHierarchy = {
        targetTab: {
          tabId: "tab2",
          tab: createMockTab("tab2", 1),
          level: 1,
          recordId: "record123",
          children: [],
        },
        parentTabs: [],
        rootTab: {
          tabId: "tab1",
          tab: createMockTab("tab1", 0),
          level: 0,
          children: [],
        },
      };

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo]);
      mockLoadWindowData.mockResolvedValue(windowMetadata);
      mockParseUrlState.mockResolvedValue(mockUrlState);
      mockCalculateHierarchy.mockResolvedValue(mockHierarchy);
      mockReconstructState.mockRejectedValue(new Error("Failed to reconstruct state"));

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(result.current.recoveredWindows).toEqual([]);
      expect(result.current.recoveryError).toBe("Failed to recover windows");
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Active window selection", () => {
    it("should mark last window as active", async () => {
      const params = createMockSearchParams({
        wi_0: "143_123456",
        wi_1: "144_789012",
        wi_2: "145_345678",
      });

      const recoveryInfo1 = createMockRecoveryInfo("143_123456", false);
      const recoveryInfo2 = createMockRecoveryInfo("144_789012", false);
      const recoveryInfo3 = createMockRecoveryInfo("145_345678", false);

      const windowMetadata1 = createMockWindowMetadata("143");
      const windowMetadata2 = createMockWindowMetadata("144");
      const windowMetadata3 = createMockWindowMetadata("145");

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo1, recoveryInfo2, recoveryInfo3]);
      mockLoadWindowData
        .mockResolvedValueOnce(windowMetadata1)
        .mockResolvedValueOnce(windowMetadata2)
        .mockResolvedValueOnce(windowMetadata3);
      mockGetWindowName.mockReturnValue("Test Window");

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(result.current.recoveredWindows).toHaveLength(3);
      expect(result.current.recoveredWindows[0].isActive).toBe(false);
      expect(result.current.recoveredWindows[1].isActive).toBe(false);
      expect(result.current.recoveredWindows[2].isActive).toBe(true);
    });

    it("should mark single window as active", async () => {
      const params = createMockSearchParams({ wi_0: "143_123456" });
      const recoveryInfo = createMockRecoveryInfo("143_123456", false);
      const windowMetadata = createMockWindowMetadata("143");

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo]);
      mockLoadWindowData.mockResolvedValue(windowMetadata);
      mockGetWindowName.mockReturnValue("Test Window");

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(result.current.recoveredWindows).toHaveLength(1);
      expect(result.current.recoveredWindows[0].isActive).toBe(true);
    });
  });

  describe("Hook lifecycle", () => {
    it("should only run recovery once", async () => {
      const params = createMockSearchParams({ wi_0: "143_123456" });
      const recoveryInfo = createMockRecoveryInfo("143_123456", false);
      const windowMetadata = createMockWindowMetadata("143");

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo]);
      mockLoadWindowData.mockResolvedValue(windowMetadata);
      mockGetWindowName.mockReturnValue("Test Window");

      const { result, rerender } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      const firstCallCount = mockLoadWindowData.mock.calls.length;

      // Rerender should not trigger another recovery
      rerender();

      await waitFor(() => {
        expect(mockLoadWindowData).toHaveBeenCalledTimes(firstCallCount);
      });
    });

    it("should not run when searchParams is null", () => {
      mockUseSearchParams.mockReturnValue(null);

      renderHook(() => useGlobalUrlStateRecovery());

      expect(mockParseWindowRecoveryData).not.toHaveBeenCalled();
      expect(mockLoadWindowData).not.toHaveBeenCalled();
    });
  });

  describe("Parallel processing", () => {
    it("should load all windows in parallel", async () => {
      const params = createMockSearchParams({
        wi_0: "143_123456",
        wi_1: "144_789012",
        wi_2: "145_345678",
      });

      const recoveryInfos = [
        createMockRecoveryInfo("143_123456", false),
        createMockRecoveryInfo("144_789012", false),
        createMockRecoveryInfo("145_345678", false),
      ];

      const windowMetadatas = [
        createMockWindowMetadata("143"),
        createMockWindowMetadata("144"),
        createMockWindowMetadata("145"),
      ];

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue(recoveryInfos);

      const loadResolvers: Array<(value: WindowMetadata) => void> = [];
      const loadPromises = windowMetadatas.map(
        () =>
          new Promise<WindowMetadata>((resolve) => {
            loadResolvers.push(resolve);
          })
      );

      loadPromises.forEach((promise) => {
        mockLoadWindowData.mockReturnValueOnce(promise);
      });

      mockGetWindowName.mockReturnValue("Test Window");

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      expect(result.current.isRecoveryLoading).toBe(true);

      // Resolve all promises simultaneously to simulate parallel loading
      loadResolvers.forEach((resolve, index) => {
        resolve(windowMetadatas[index]);
      });

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(mockLoadWindowData).toHaveBeenCalledTimes(3);
      expect(result.current.recoveredWindows).toHaveLength(3);
    });
  });

  describe("Window identifier extraction", () => {
    it("should extract window ID from identifier correctly", async () => {
      const params = createMockSearchParams({ wi_0: "143_123456789" });
      const recoveryInfo = createMockRecoveryInfo("143_123456789", false);
      const windowMetadata = createMockWindowMetadata("143");

      mockUseSearchParams.mockReturnValue(params);
      mockParseWindowRecoveryData.mockReturnValue([recoveryInfo]);
      mockLoadWindowData.mockResolvedValue(windowMetadata);
      mockGetWindowName.mockReturnValue("Test Window");

      const { result } = renderHook(() => useGlobalUrlStateRecovery());

      await waitFor(() => {
        expect(result.current.isRecoveryLoading).toBe(false);
      });

      expect(mockLoadWindowData).toHaveBeenCalledWith("143");
      expect(result.current.recoveredWindows[0].windowId).toBe("143");
      expect(result.current.recoveredWindows[0].windowIdentifier).toBe("143_123456789");
    });
  });
});

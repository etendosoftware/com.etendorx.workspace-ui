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
 * @fileoverview Unit tests for URL state parser utilities
 *
 * Tests the URL state parsing implementation:
 * - parseUrlState function for recovery information parsing
 * - getWindowName function for window metadata extraction
 * - Error handling and validation
 * - Integration with metadata API
 */

import { parseUrlState, getWindowName } from "../urlStateParser";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import type { WindowRecoveryInfo } from "@/utils/window/constants";
import type { WindowMetadata, Tab } from "@workspaceui/api-client/src/api/types";

// Mock dependencies
jest.mock("@workspaceui/api-client/src/api/metadata");

const mockMetadata = Metadata as jest.Mocked<typeof Metadata>;

// Test data builders
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

// Test helpers
const createMockRecoveryInfo = (overrides?: Partial<WindowRecoveryInfo>): WindowRecoveryInfo => ({
  windowIdentifier: "143_123456",
  tabId: "tab2",
  recordId: "record123",
  hasRecoveryData: true,
  ...overrides,
});

const createMockApiResponse = (overrides?: Partial<{ windowId: string; tabTitle: string; keyParameter: string }>) => ({
  ok: true,
  data: {
    windowId: "143",
    tabTitle: "Order Lines",
    keyParameter: "cOrderId",
    ...overrides,
  },
});

const setupMockKernelClient = () => {
  const mockKernelClient = {
    request: jest.fn(),
  };
  mockMetadata.kernelClient = mockKernelClient as any;
  return mockKernelClient;
};

const mockConsoleError = () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  return spy;
};

const verifyApiRequest = (mockKernelClient: { request: jest.Mock }, expectedParams: string[]) => {
  const calledUrl = mockKernelClient.request.mock.calls[0][0];
  expectedParams.forEach((param) => {
    expect(calledUrl).toContain(param);
  });
};

describe("parseUrlState", () => {
  let mockKernelClient: { request: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockKernelClient = setupMockKernelClient();
  });

  it("should parse URL state successfully with valid data", async () => {
    const recoveryInfo = createMockRecoveryInfo();
    const windowData = createMockWindowMetadata("143");
    const mockApiResponse = createMockApiResponse();

    mockKernelClient.request.mockResolvedValue(mockApiResponse);
    const result = await parseUrlState(recoveryInfo, windowData);

    expect(result).toEqual({
      windowIdentifier: "143_123456",
      tabId: "tab2",
      recordId: "record123",
      windowId: "143",
      tabTitle: "Order Lines",
      tabLevel: 1,
      keyParameter: "cOrderId",
    });

    verifyApiRequest(mockKernelClient, [
      "tabId=tab2",
      "recordId=record123",
      "_action=org.openbravo.client.application.ComputeWindowActionHandler",
    ]);
  });

  it("should throw error when tabId is missing", async () => {
    const recoveryInfo = createMockRecoveryInfo({ tabId: undefined, hasRecoveryData: false });
    const windowData = createMockWindowMetadata("143");

    await expect(parseUrlState(recoveryInfo, windowData)).rejects.toThrow(
      "Missing tabId or recordId for URL state parsing"
    );
    expect(mockKernelClient.request).not.toHaveBeenCalled();
  });

  it("should throw error when recordId is missing", async () => {
    const recoveryInfo = createMockRecoveryInfo({ recordId: undefined, hasRecoveryData: false });
    const windowData = createMockWindowMetadata("143");

    await expect(parseUrlState(recoveryInfo, windowData)).rejects.toThrow(
      "Missing tabId or recordId for URL state parsing"
    );
    expect(mockKernelClient.request).not.toHaveBeenCalled();
  });

  it("should throw error when both tabId and recordId are missing", async () => {
    const recoveryInfo = createMockRecoveryInfo({ tabId: undefined, recordId: undefined, hasRecoveryData: false });
    const windowData = createMockWindowMetadata("143");

    await expect(parseUrlState(recoveryInfo, windowData)).rejects.toThrow(
      "Missing tabId or recordId for URL state parsing"
    );
    expect(mockKernelClient.request).not.toHaveBeenCalled();
  });

  it("should throw error when API request fails", async () => {
    const recoveryInfo = createMockRecoveryInfo();
    const windowData = createMockWindowMetadata("143");

    mockKernelClient.request.mockResolvedValue({ ok: false, data: null });

    await expect(parseUrlState(recoveryInfo, windowData)).rejects.toThrow(
      "Failed to parse URL state: Failed to fetch window action handler data"
    );
  });

  it("should throw error when API returns no data", async () => {
    const recoveryInfo = createMockRecoveryInfo();
    const windowData = createMockWindowMetadata("143");

    mockKernelClient.request.mockResolvedValue({ ok: true, data: null });

    await expect(parseUrlState(recoveryInfo, windowData)).rejects.toThrow(
      "Failed to parse URL state: Failed to fetch window action handler data"
    );
  });

  it("should throw error when target tab is not found in window metadata", async () => {
    const recoveryInfo = createMockRecoveryInfo({ tabId: "nonexistentTab" });
    const windowData = createMockWindowMetadata("143");
    const mockApiResponse = createMockApiResponse();

    mockKernelClient.request.mockResolvedValue(mockApiResponse);

    await expect(parseUrlState(recoveryInfo, windowData)).rejects.toThrow(
      "Failed to parse URL state: Tab nonexistentTab not found in window metadata"
    );
  });

  it("should handle API request network error", async () => {
    const consoleErrorSpy = mockConsoleError();
    const recoveryInfo = createMockRecoveryInfo();
    const windowData = createMockWindowMetadata("143");

    mockKernelClient.request.mockRejectedValue(new Error("Network error"));

    await expect(parseUrlState(recoveryInfo, windowData)).rejects.toThrow("Failed to parse URL state: Network error");

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error parsing URL state:", expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it("should handle tab at level 0", async () => {
    const recoveryInfo = createMockRecoveryInfo({ tabId: "tab1" });
    const windowData = createMockWindowMetadata("143");
    const mockApiResponse = createMockApiResponse({ tabTitle: "Main Tab" });

    mockKernelClient.request.mockResolvedValue(mockApiResponse);
    const result = await parseUrlState(recoveryInfo, windowData);

    expect(result.tabLevel).toBe(0);
    expect(result.tabId).toBe("tab1");
  });

  it("should construct proper query parameters", async () => {
    const recoveryInfo = createMockRecoveryInfo();
    const windowData = createMockWindowMetadata("143");
    const mockApiResponse = createMockApiResponse();

    mockKernelClient.request.mockResolvedValue(mockApiResponse);
    await parseUrlState(recoveryInfo, windowData);

    verifyApiRequest(mockKernelClient, [
      "tabId=tab2",
      "recordId=record123",
      "_action=org.openbravo.client.application.ComputeWindowActionHandler",
    ]);
  });

  it("should preserve all recovery info properties", async () => {
    const recoveryInfo = createMockRecoveryInfo({
      windowIdentifier: "CUSTOM_143_123456",
      recordId: "CUSTOM_RECORD_123",
    });
    const windowData = createMockWindowMetadata("143");
    const mockApiResponse = createMockApiResponse({ keyParameter: "customKey" });

    mockKernelClient.request.mockResolvedValue(mockApiResponse);
    const result = await parseUrlState(recoveryInfo, windowData);

    expect(result.windowIdentifier).toBe("CUSTOM_143_123456");
    expect(result.tabId).toBe("tab2");
    expect(result.recordId).toBe("CUSTOM_RECORD_123");
    expect(result.keyParameter).toBe("customKey");
  });

  it("should handle window metadata with many tabs", async () => {
    const recoveryInfo = createMockRecoveryInfo({ tabId: "tab5" });
    const windowData: WindowMetadata = {
      ...createMockWindowMetadata("143"),
      tabs: [
        createMockTab("tab1", 0),
        createMockTab("tab2", 1),
        createMockTab("tab3", 2),
        createMockTab("tab4", 3),
        createMockTab("tab5", 4),
      ],
    };
    const mockApiResponse = createMockApiResponse({ tabTitle: "Deep Tab", keyParameter: "deepKey" });

    mockKernelClient.request.mockResolvedValue(mockApiResponse);
    const result = await parseUrlState(recoveryInfo, windowData);

    expect(result.tabLevel).toBe(4);
    expect(result.tabId).toBe("tab5");
  });

  it("should handle non-Error thrown values", async () => {
    const consoleErrorSpy = mockConsoleError();
    const recoveryInfo = createMockRecoveryInfo();
    const windowData = createMockWindowMetadata("143");

    mockKernelClient.request.mockRejectedValue("String error");

    await expect(parseUrlState(recoveryInfo, windowData)).rejects.toThrow("Failed to parse URL state: Unknown error");

    consoleErrorSpy.mockRestore();
  });

  it("should handle empty tabId and recordId strings", async () => {
    const recoveryInfo = createMockRecoveryInfo({ tabId: "", recordId: "", hasRecoveryData: false });
    const windowData = createMockWindowMetadata("143");

    await expect(parseUrlState(recoveryInfo, windowData)).rejects.toThrow(
      "Missing tabId or recordId for URL state parsing"
    );
    expect(mockKernelClient.request).not.toHaveBeenCalled();
  });
});

describe("getWindowName", () => {
  it("should return window name from metadata", () => {
    const windowData = createMockWindowMetadata("143");

    const result = getWindowName(windowData);

    expect(result).toBe("Window 143");
  });

  it("should return correct name for different windows", () => {
    const windowData1 = createMockWindowMetadata("143");
    const windowData2 = createMockWindowMetadata("144");

    expect(getWindowName(windowData1)).toBe("Window 143");
    expect(getWindowName(windowData2)).toBe("Window 144");
  });

  it("should handle window with custom name", () => {
    const windowData: WindowMetadata = {
      ...createMockWindowMetadata("143"),
      name: "Sales Order Window",
    };

    const result = getWindowName(windowData);

    expect(result).toBe("Sales Order Window");
  });

  it("should handle window with empty name", () => {
    const windowData: WindowMetadata = {
      ...createMockWindowMetadata("143"),
      name: "",
    };

    const result = getWindowName(windowData);

    expect(result).toBe("");
  });

  it("should handle window name with special characters", () => {
    const windowData: WindowMetadata = {
      ...createMockWindowMetadata("143"),
      name: "Order & Invoice - Window",
    };

    const result = getWindowName(windowData);

    expect(result).toBe("Order & Invoice - Window");
  });

  it("should throw error when window name access fails", () => {
    const consoleErrorSpy = mockConsoleError();

    // Create a metadata object that will throw when accessing name
    const windowData = new Proxy(createMockWindowMetadata("143"), {
      get(target, prop) {
        if (prop === "name") {
          throw new Error("Property access error");
        }
        return target[prop as keyof typeof target];
      },
    }) as WindowMetadata;

    expect(() => getWindowName(windowData)).toThrow("Failed to get window name: Property access error");

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error getting window name:", expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it("should work with null-prototype object", () => {
    const windowData: WindowMetadata = Object.assign(Object.create(null), {
      ...createMockWindowMetadata("143"),
      name: "Test Window",
    });

    const result = getWindowName(windowData);

    expect(result).toBe("Test Window");
  });

  it("should handle very long window names", () => {
    const longName = "A".repeat(1000);
    const windowData: WindowMetadata = {
      ...createMockWindowMetadata("143"),
      name: longName,
    };

    const result = getWindowName(windowData);

    expect(result).toBe(longName);
    expect(result.length).toBe(1000);
  });

  it("should handle window name with unicode characters", () => {
    const windowData: WindowMetadata = {
      ...createMockWindowMetadata("143"),
      name: "窓口 - Window 📊",
    };

    const result = getWindowName(windowData);

    expect(result).toBe("窓口 - Window 📊");
  });
});

describe("Integration scenarios", () => {
  let mockKernelClient: { request: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockKernelClient = setupMockKernelClient();
  });

  it("should handle complete recovery flow", async () => {
    const recoveryInfo = createMockRecoveryInfo();
    const windowData = createMockWindowMetadata("143");
    const mockApiResponse = createMockApiResponse();

    mockKernelClient.request.mockResolvedValue(mockApiResponse);
    const urlState = await parseUrlState(recoveryInfo, windowData);
    const windowName = getWindowName(windowData);

    expect(urlState.windowId).toBe(windowData.id);
    expect(windowName).toBe(windowData.name);
  });

  it("should handle parseUrlState followed by getWindowName", async () => {
    const recoveryInfo = createMockRecoveryInfo({ tabId: "tab1" });
    const windowData = createMockWindowMetadata("143");
    const mockApiResponse = createMockApiResponse({ tabTitle: "Main Tab", keyParameter: "mainKey" });

    mockKernelClient.request.mockResolvedValue(mockApiResponse);
    const urlState = await parseUrlState(recoveryInfo, windowData);
    expect(urlState).toBeDefined();

    const windowName = getWindowName(windowData);
    expect(windowName).toBe("Window 143");
  });

  it("should maintain data consistency across function calls", async () => {
    const windowData = createMockWindowMetadata("143");

    const name1 = getWindowName(windowData);

    const recoveryInfo = createMockRecoveryInfo({ tabId: "tab1" });
    const mockApiResponse = createMockApiResponse({ tabTitle: "Main Tab", keyParameter: "mainKey" });

    mockKernelClient.request.mockResolvedValue(mockApiResponse);
    await parseUrlState(recoveryInfo, windowData);

    const name2 = getWindowName(windowData);

    expect(name1).toBe(name2);
  });
});

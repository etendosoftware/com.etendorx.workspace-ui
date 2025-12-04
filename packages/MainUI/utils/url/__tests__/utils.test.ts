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
 * @fileoverview Unit tests for URL utility functions
 *
 * Tests the URL parameter handling utilities:
 * - Window parameter encoding/decoding
 * - URL navigation utilities
 * - Recovery parameter management
 */

import {
  buildWindowsUrlParams,
  parseWindowRecoveryData,
  validateRecoveryParameters,
  cleanInvalidRecoveryParams,
  removeRecoveryParameters,
  removeWindowParameters,
  appendWindowToUrl,
} from "../utils";
import type { WindowState } from "../../window/constants";
import { TAB_MODES, FORM_MODES, URL_PREFIXS } from "../constants";

/**
 * Test helpers
 */

const createMockTabState = (level: number, selectedRecord: string | undefined, recordId: string) => ({
  level,
  selectedRecord,
  table: {
    filters: [],
    visibility: {},
    sorting: [],
    order: [],
    isImplicitFilterApplied: false,
  },
  form: {
    recordId,
    mode: TAB_MODES.FORM,
    formMode: FORM_MODES.EDIT,
  },
});

const createMockTabStateEmpty = (level: number, selectedRecord: string) => ({
  level,
  selectedRecord,
  table: {
    filters: [],
    visibility: {},
    sorting: [],
    order: [],
    isImplicitFilterApplied: false,
  },
  form: {},
});

const createMockWindowState = (
  windowId: string,
  windowIdentifier: string,
  tabs: Record<string, any> = {},
  isActive = true,
  navigation: any = {
    activeLevels: [],
    activeTabsByLevel: new Map(),
    initialized: false,
  }
): WindowState => ({
  windowId,
  windowIdentifier,
  title: `Window ${windowId}`,
  isActive,
  initialized: true,
  tabs,
  navigation,
});

const createMockNavigation = (activeTabsByLevel: Map<number, string>) => ({
  activeLevels: Array.from(activeTabsByLevel.keys()),
  activeTabsByLevel,
  initialized: true,
});

const createMockRecoveryInfo = (
  windowIdentifier: string,
  tabId: string | undefined = undefined,
  recordId: string | undefined = undefined,
  hasRecoveryData = false
) => ({
  windowIdentifier,
  tabId,
  recordId,
  hasRecoveryData,
});

const createSearchParams = (params: string) => new URLSearchParams(params);

/**
 * Helper to verify URLSearchParams has expected keys and values
 */
const expectParamsToHave = (params: URLSearchParams, expectations: Record<string, string | boolean>) => {
  Object.entries(expectations).forEach(([key, value]) => {
    if (typeof value === "boolean") {
      expect(params.has(key)).toBe(value);
    } else {
      expect(params.get(key)).toBe(value);
    }
  });
};

/**
 * Helper to verify URL string contains expected parameters
 */
const expectUrlToContain = (url: string, params: Record<string, string>) => {
  Object.entries(params).forEach(([key, value]) => {
    expect(url).toContain(`${key}=${value}`);
  });
};

/**
 * Helper to call appendWindowToUrl and return parsed URLSearchParams
 */
const appendWindowAndParse = (
  currentParams: URLSearchParams,
  windowData: { windowIdentifier: string; tabId: string; recordId: string }
) => {
  const result = appendWindowToUrl(currentParams, windowData);
  return new URLSearchParams(result);
};

/**
 * Helper to verify window parameters at a specific index
 */
const expectWindowAtIndex = (
  params: URLSearchParams,
  index: number,
  expected: { windowIdentifier: string; tabId?: string; recordId?: string }
) => {
  expect(params.get(`wi_${index}`)).toBe(expected.windowIdentifier);
  if (expected.tabId !== undefined) {
    expect(params.get(`ti_${index}`)).toBe(expected.tabId);
  }
  if (expected.recordId !== undefined) {
    expect(params.get(`ri_${index}`)).toBe(expected.recordId);
  }
};

/**
 * Helper to append window, parse result, and verify window at index 0
 * Combines appendWindowAndParse + expectWindowAtIndex for common test pattern
 */
const appendWindowAndExpectAtIndex0 = (
  currentParams: URLSearchParams,
  windowData: { windowIdentifier: string; tabId: string; recordId: string }
) => {
  const params = appendWindowAndParse(currentParams, windowData);
  expectWindowAtIndex(params, 0, windowData);
  return params;
};

describe("URL Utility Functions", () => {
  describe("buildWindowsUrlParams", () => {
    it("should build params for single window with no tabs", () => {
      const windows: WindowState[] = [createMockWindowState("143", "143_123456")];

      const result = buildWindowsUrlParams(windows);

      expect(result).toBe("wi_0=143_123456");
    });

    it("should include deepest tab with record", () => {
      const windows: WindowState[] = [
        createMockWindowState(
          "143",
          "143_123456",
          {
            tab1: createMockTabState(0, "rec1", "rec1"),
            tab2: createMockTabState(1, "rec2", "rec2"),
          },
          true,
          createMockNavigation(
            new Map([
              [0, "tab1"],
              [1, "tab2"],
            ])
          )
        ),
      ];

      const result = buildWindowsUrlParams(windows);

      expectUrlToContain(result, {
        wi_0: "143_123456",
        ti_0: "tab2",
        ri_0: "rec2",
      });
    });

    it("should handle multiple windows", () => {
      const windows: WindowState[] = [
        createMockWindowState("143", "143_123456"),
        createMockWindowState(
          "144",
          "144_789012",
          { tab1: createMockTabState(0, "rec1", "rec1") },
          false,
          createMockNavigation(new Map([[0, "tab1"]]))
        ),
      ];

      const result = buildWindowsUrlParams(windows);

      expectUrlToContain(result, {
        wi_0: "143_123456",
        wi_1: "144_789012",
        ti_1: "tab1",
        ri_1: "rec1",
      });
    });

    it("should only include tabs with both selectedRecord and form.recordId", () => {
      const windows: WindowState[] = [
        createMockWindowState("143", "143_123456", {
          tab1: createMockTabState(0, "rec1", ""),
          tab2: createMockTabState(1, undefined, "rec2"),
        }),
      ];

      const result = buildWindowsUrlParams(windows);

      // Should only have window identifier, no tab or record
      expect(result).toBe("wi_0=143_123456");
    });

    it("should handle empty windows array", () => {
      const result = buildWindowsUrlParams([]);

      expect(result).toBe("");
    });

    it("should select deepest tab among multiple tabs with records", () => {
      const windows: WindowState[] = [
        createMockWindowState(
          "143",
          "143_123456",
          {
            tab1: createMockTabState(0, "rec1", "rec1"),
            tab2: createMockTabState(1, "rec2", "rec2"),
            tab3: createMockTabState(2, "rec3", "rec3"),
          },
          true,
          createMockNavigation(
            new Map([
              [0, "tab1"],
              [1, "tab2"],
              [2, "tab3"],
            ])
          )
        ),
      ];

      const result = buildWindowsUrlParams(windows);

      expectUrlToContain(result, {
        wi_0: "143_123456",
        ti_0: "tab3",
        ri_0: "rec3",
      });
      expect(result).not.toContain("ti_0=tab1");
      expect(result).not.toContain("ti_0=tab2");
    });

    it("should handle tabs with same level correctly", () => {
      const windows: WindowState[] = [
        createMockWindowState(
          "143",
          "143_123456",
          {
            tab1: createMockTabState(1, "rec1", "rec1"),
            tab2: createMockTabState(1, "rec2", "rec2"),
          },
          true,
          createMockNavigation(new Map([[1, "tab1"]]))
        ),
      ];

      const result = buildWindowsUrlParams(windows);

      // When tabs have same level, should pick one (the first encountered in reduce)
      expect(result).toContain("wi_0=143_123456");
      expect(result).toMatch(/ti_0=tab[12]/); // Should contain one of the tabs
      expect(result).toMatch(/ri_0=rec[12]/); // Should contain corresponding record
    });
  });

  describe("parseWindowRecoveryData", () => {
    it("should parse single window with tab and record", () => {
      const params = createSearchParams("wi_0=143_123456&ti_0=tab1&ri_0=rec1");

      const result = parseWindowRecoveryData(params);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(createMockRecoveryInfo("143_123456", "tab1", "rec1", true));
    });

    it("should parse window without recovery data", () => {
      const params = createSearchParams("wi_0=143_123456");

      const result = parseWindowRecoveryData(params);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(createMockRecoveryInfo("143_123456"));
    });

    it("should parse multiple windows", () => {
      const params = createSearchParams("wi_0=143_123456&ti_0=tab1&ri_0=rec1&wi_1=144_789012");

      const result = parseWindowRecoveryData(params);

      expect(result).toHaveLength(2);
      expect(result[0].windowIdentifier).toBe("143_123456");
      expect(result[0].hasRecoveryData).toBe(true);
      expect(result[1].windowIdentifier).toBe("144_789012");
      expect(result[1].hasRecoveryData).toBe(false);
    });

    it("should handle empty params", () => {
      const params = createSearchParams("");

      const result = parseWindowRecoveryData(params);

      expect(result).toHaveLength(0);
    });

    it("should handle params with only tabId", () => {
      const params = createSearchParams("wi_0=143_123456&ti_0=tab1");

      const result = parseWindowRecoveryData(params);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(createMockRecoveryInfo("143_123456", "tab1", undefined, false));
    });
  });

  describe("validateRecoveryParameters", () => {
    it("should return true when both tabId and recordId are present", () => {
      const info = createMockRecoveryInfo("143_123456", "tab1", "rec1", true);

      expect(validateRecoveryParameters(info)).toBe(true);
    });

    it("should return true when both are missing", () => {
      const info = {
        windowIdentifier: "143_123456",
        tabId: undefined,
        recordId: undefined,
        hasRecoveryData: false,
      };

      expect(validateRecoveryParameters(info)).toBe(true);
    });

    it("should return false when only tabId is present", () => {
      const info = {
        windowIdentifier: "143_123456",
        tabId: "tab1",
        recordId: undefined,
        hasRecoveryData: false,
      };

      expect(validateRecoveryParameters(info)).toBe(false);
    });

    it("should return false when only recordId is present", () => {
      const info = {
        windowIdentifier: "143_123456",
        tabId: undefined,
        recordId: "rec1",
        hasRecoveryData: false,
      };

      expect(validateRecoveryParameters(info)).toBe(false);
    });
  });

  describe("cleanInvalidRecoveryParams", () => {
    it("should remove inconsistent parameters", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1"); // Missing recordId

      const result = cleanInvalidRecoveryParams(params);

      expect(result.has("wi_0")).toBe(true);
      expect(result.has("ti_0")).toBe(false); // Should be removed
      expect(result.has("ri_0")).toBe(false);
    });

    it("should keep valid parameters", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1&ri_0=rec1");

      const result = cleanInvalidRecoveryParams(params);

      expectParamsToHave(result, {
        wi_0: true,
        ti_0: true,
        ri_0: true,
      });
    });

    it("should handle multiple windows with mixed validity", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1&wi_1=144_789012&ti_1=tab2&ri_1=rec2");

      const result = cleanInvalidRecoveryParams(params);

      // First window incomplete, should remove ti_0
      expect(result.has("wi_0")).toBe(true);
      expect(result.has("ti_0")).toBe(false);

      // Second window complete, should keep all
      expect(result.has("wi_1")).toBe(true);
      expect(result.has("ti_1")).toBe(true);
      expect(result.has("ri_1")).toBe(true);
    });
  });

  describe("removeRecoveryParameters", () => {
    it("should remove all recovery parameters", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1&ri_0=rec1&other=value");

      const result = removeRecoveryParameters(params);

      expectParamsToHave(result, {
        wi_0: false,
        ti_0: false,
        ri_0: false,
        other: "value",
      });
    });

    it("should preserve non-recovery parameters", () => {
      const params = new URLSearchParams("wi_0=143_123456&filter=active&sort=name");

      const result = removeRecoveryParameters(params);

      expectParamsToHave(result, {
        wi_0: false,
        filter: "active",
        sort: "name",
      });
    });

    it("should handle params with only recovery data", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1&ri_0=rec1");

      const result = removeRecoveryParameters(params);

      expect(result.toString()).toBe("");
    });

    it("should handle empty params", () => {
      const params = new URLSearchParams("");

      const result = removeRecoveryParameters(params);

      expect(result.toString()).toBe("");
    });
  });

  describe("removeWindowParameters", () => {
    it("should remove parameters for specific window index", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1&ri_0=rec1&wi_1=144_789012&ti_1=tab2&ri_1=rec2");

      const result = removeWindowParameters(params, 0);

      expectParamsToHave(result, {
        wi_0: false,
        ti_0: false,
        ri_0: false,
        wi_1: true,
        ti_1: true,
        ri_1: true,
      });
    });

    it("should handle removing from middle index", () => {
      const params = new URLSearchParams("wi_0=143&wi_1=144&wi_2=145");

      const result = removeWindowParameters(params, 1);

      expectParamsToHave(result, {
        wi_0: true,
        wi_1: false,
        wi_2: true,
      });
    });

    it("should handle non-existent index", () => {
      const params = new URLSearchParams("wi_0=143_123456");

      const result = removeWindowParameters(params, 5);

      expect(result.has("wi_0")).toBe(true);
      expect(result.toString()).toBe("wi_0=143_123456");
    });

    it("should preserve other parameters", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1&other=value");

      const result = removeWindowParameters(params, 0);

      expectParamsToHave(result, {
        wi_0: false,
        ti_0: false,
        other: "value",
      });
    });

    it("should handle zero index", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1&ri_0=rec1");

      const result = removeWindowParameters(params, 0);

      expectParamsToHave(result, {
        wi_0: false,
        ti_0: false,
        ri_0: false,
      });
    });

    it("should return new URLSearchParams instance", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1");

      const result = removeWindowParameters(params, 0);

      expect(result).not.toBe(params);
      expect(params.has("wi_0")).toBe(true); // Original unchanged
    });
  });

  describe("Edge cases and integration", () => {
    it("should handle buildWindowsUrlParams with window having empty form object", () => {
      const windows: WindowState[] = [
        createMockWindowState(
          "143",
          "143_123456",
          { tab1: createMockTabStateEmpty(0, "rec1") },
          true,
          createMockNavigation(new Map([[0, "tab1"]]))
        ),
      ];

      const result = buildWindowsUrlParams(windows);

      expect(result).toBe("wi_0=143_123456"); // No tab or record included
    });

    it("should handle parseWindowRecoveryData with non-sequential indices", () => {
      const params = new URLSearchParams("wi_0=143&wi_2=145&wi_5=148");

      const result = parseWindowRecoveryData(params);

      expect(result).toHaveLength(3);
      expect(result.map((r) => r.windowIdentifier)).toEqual(["143", "145", "148"]);
    });

    it("should handle validateRecoveryParameters with empty strings", () => {
      const info = {
        windowIdentifier: "143_123456",
        tabId: "",
        recordId: "",
        hasRecoveryData: false,
      };

      // Empty strings are falsy, so both missing
      expect(validateRecoveryParameters(info)).toBe(true);
    });

    it("should handle cleanInvalidRecoveryParams with mixed valid and invalid windows", () => {
      const params = new URLSearchParams("wi_0=143&ti_0=tab1&ri_0=rec1&wi_1=144&ti_1=tab2&wi_2=145&ri_2=rec3&wi_3=146");

      const result = cleanInvalidRecoveryParams(params);

      // Window 0: valid (has both)
      expect(result.has("ti_0")).toBe(true);
      expect(result.has("ri_0")).toBe(true);

      // Window 1: invalid (has only ti_1)
      expect(result.has("ti_1")).toBe(false);

      // Window 2: invalid (has only ri_2)
      expect(result.has("ri_2")).toBe(false);

      // Window 3: valid (has neither)
      expect(result.has("wi_3")).toBe(true);
    });

    it("should handle removeRecoveryParameters with multiple windows", () => {
      const params = new URLSearchParams(
        "wi_0=143&ti_0=tab1&ri_0=rec1&wi_1=144&ti_1=tab2&ri_1=rec2&other1=val1&other2=val2"
      );

      const result = removeRecoveryParameters(params);

      expect(result.has("wi_0")).toBe(false);
      expect(result.has("ti_0")).toBe(false);
      expect(result.has("ri_0")).toBe(false);
      expect(result.has("wi_1")).toBe(false);
      expect(result.has("ti_1")).toBe(false);
      expect(result.has("ri_1")).toBe(false);
      expect(result.get("other1")).toBe("val1");
      expect(result.get("other2")).toBe("val2");
    });

    it("should handle buildWindowsUrlParams and parseWindowRecoveryData roundtrip", () => {
      const windows: WindowState[] = [
        createMockWindowState(
          "143",
          "143_123456",
          { tab1: createMockTabState(0, "rec1", "rec1") },
          true,
          createMockNavigation(new Map([[0, "tab1"]]))
        ),
      ];

      const urlParams = buildWindowsUrlParams(windows);
      const searchParams = new URLSearchParams(urlParams);
      const recoveryData = parseWindowRecoveryData(searchParams);

      expect(recoveryData).toHaveLength(1);
      expect(recoveryData[0].windowIdentifier).toBe("143_123456");
      expect(recoveryData[0].tabId).toBe("tab1");
      expect(recoveryData[0].recordId).toBe("rec1");
      expect(recoveryData[0].hasRecoveryData).toBe(true);
    });

    it("should handle special characters in identifiers", () => {
      const windows: WindowState[] = [
        createMockWindowState(
          "143-ABC",
          "143-ABC_123456",
          { "tab-1": createMockTabState(0, "rec-1", "rec-1") },
          true,
          createMockNavigation(new Map([[0, "tab-1"]]))
        ),
      ];

      const result = buildWindowsUrlParams(windows);

      expectUrlToContain(result, {
        wi_0: "143-ABC_123456",
        ti_0: "tab-1",
        ri_0: "rec-1",
      });
    });

    it("should handle URLSearchParams with duplicate keys", () => {
      const params = new URLSearchParams();
      params.append("wi_0", "143");
      params.append("wi_0", "144"); // Duplicate

      const result = parseWindowRecoveryData(params);

      // URLSearchParams.forEach only processes the first value for duplicate keys
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it("should validate parameters consistently across all functions", () => {
      const params = new URLSearchParams("wi_0=143&ti_0=tab1"); // Invalid: missing recordId

      const recoveryData = parseWindowRecoveryData(params);
      expect(recoveryData[0].hasRecoveryData).toBe(false);

      const isValid = validateRecoveryParameters(recoveryData[0]);
      expect(isValid).toBe(false);

      const cleaned = cleanInvalidRecoveryParams(params);
      expect(cleaned.has("ti_0")).toBe(false);
    });

    it("should handle removeWindowParameters for last window in sequence", () => {
      const params = new URLSearchParams("wi_0=143&wi_1=144&wi_2=145");

      const result = removeWindowParameters(params, 2);

      expect(result.get("wi_0")).toBe("143");
      expect(result.get("wi_1")).toBe("144");
      expect(result.has("wi_2")).toBe(false);
    });

    it("should preserve parameter order when cleaning", () => {
      const params = new URLSearchParams("first=1&wi_0=143&ti_0=tab1&middle=2&ri_0=rec1&last=3");

      const result = removeRecoveryParameters(params);

      const keys = Array.from(result.keys());
      expect(keys).toEqual(["first", "middle", "last"]);
    });
  });
});

describe("appendWindowToUrl", () => {
  describe("single window creation", () => {
    it("should create URL with single new window when no existing parameters", () => {
      const currentParams = new URLSearchParams();

      const result = appendWindowToUrl(currentParams, {
        windowIdentifier: "144_2000",
        tabId: "LocationTab",
        recordId: "2000015",
      });

      expect(result).toBe("wi_0=144_2000&ti_0=LocationTab&ri_0=2000015");
    });

    it("should use index 0 for first window", () => {
      const currentParams = new URLSearchParams();

      appendWindowAndExpectAtIndex0(currentParams, {
        windowIdentifier: "143_1000",
        tabId: "BPartnerTab",
        recordId: "1000001",
      });
    });

    it("should include all three parameters (window, tab, record)", () => {
      const currentParams = new URLSearchParams();

      const params = appendWindowAndExpectAtIndex0(currentParams, {
        windowIdentifier: "144_2000",
        tabId: "LocationTab",
        recordId: "2000015",
      });

      expectParamsToHave(params, {
        wi_0: true,
        ti_0: true,
        ri_0: true,
      });
    });
  });

  describe("appending to existing windows", () => {
    it("should append new window to existing windows in URL", () => {
      const currentParams = new URLSearchParams("wi_0=143_1000&ti_0=BPartnerTab&ri_0=1000001");

      const result = appendWindowToUrl(currentParams, {
        windowIdentifier: "144_2000",
        tabId: "LocationTab",
        recordId: "2000015",
      });

      expectUrlToContain(result, {
        wi_0: "143_1000",
        ti_0: "BPartnerTab",
        ri_0: "1000001",
        wi_1: "144_2000",
        ti_1: "LocationTab",
        ri_1: "2000015",
      });
    });

    it("should correctly calculate next index with multiple existing windows", () => {
      const currentParams = new URLSearchParams(
        "wi_0=143_1000&ti_0=BPartnerTab&ri_0=1000001&wi_1=144_1500&ti_1=OrderTab&ri_1=2000001&wi_2=145_2000&ti_2=InvoiceTab&ri_2=3000001"
      );

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: "146_2500",
        tabId: "PaymentTab",
        recordId: "4000001",
      });

      expectWindowAtIndex(params, 3, {
        windowIdentifier: "146_2500",
        tabId: "PaymentTab",
        recordId: "4000001",
      });
    });

    it("should preserve all existing parameters", () => {
      const currentParams = new URLSearchParams(
        "wi_0=143_1000&ti_0=BPartnerTab&ri_0=1000001&wi_1=144_2000&ti_1=LocationTab&ri_1=2000015"
      );

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: "145_3000",
        tabId: "OrderTab",
        recordId: "3000001",
      });

      // Verify all existing parameters are preserved
      expectWindowAtIndex(params, 0, {
        windowIdentifier: "143_1000",
        tabId: "BPartnerTab",
        recordId: "1000001",
      });
      expectWindowAtIndex(params, 1, {
        windowIdentifier: "144_2000",
        tabId: "LocationTab",
        recordId: "2000015",
      });

      // Verify new window is added
      expectWindowAtIndex(params, 2, {
        windowIdentifier: "145_3000",
        tabId: "OrderTab",
        recordId: "3000001",
      });
    });
  });

  describe("index calculation", () => {
    it("should find next available index by counting window identifiers", () => {
      const currentParams = new URLSearchParams("wi_0=143_1000&wi_1=144_2000");

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: "145_3000",
        tabId: "TestTab",
        recordId: "1234",
      });

      expectWindowAtIndex(params, 2, { windowIdentifier: "145_3000" });
    });

    it("should handle gaps in indices correctly", () => {
      // Even if there are gaps, it counts from 0 until it finds a missing index
      const currentParams = new URLSearchParams("wi_0=143_1000&wi_2=145_3000");

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: "146_4000",
        tabId: "TestTab",
        recordId: "1234",
      });

      // Should use index 1 (first missing index)
      expectWindowAtIndex(params, 1, { windowIdentifier: "146_4000" });
    });

    it("should calculate index independently of tab and record parameters", () => {
      const currentParams = new URLSearchParams("wi_0=143_1000&wi_1=144_2000&ti_0=Tab1");

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: "145_3000",
        tabId: "TestTab",
        recordId: "1234",
      });

      expectWindowAtIndex(params, 2, { windowIdentifier: "145_3000" });
    });
  });

  describe("immutability", () => {
    it("should not mutate original URLSearchParams", () => {
      const currentParams = new URLSearchParams("wi_0=143_1000&ti_0=BPartnerTab");
      const originalString = currentParams.toString();

      appendWindowToUrl(currentParams, {
        windowIdentifier: "144_2000",
        tabId: "LocationTab",
        recordId: "2000015",
      });

      expect(currentParams.toString()).toBe(originalString);
    });

    it("should create a new URLSearchParams instance internally", () => {
      const currentParams = new URLSearchParams("wi_0=143_1000");

      const result1 = appendWindowToUrl(currentParams, {
        windowIdentifier: "144_2000",
        tabId: "Tab1",
        recordId: "1234",
      });

      const result2 = appendWindowToUrl(currentParams, {
        windowIdentifier: "145_3000",
        tabId: "Tab2",
        recordId: "5678",
      });

      // Both results should start with the same base but have different new windows
      expect(result1).toContain("wi_0=143_1000");
      expect(result2).toContain("wi_0=143_1000");
      expect(result1).toContain("wi_1=144_2000");
      expect(result2).toContain("wi_1=145_3000");
    });
  });

  describe("parameter format", () => {
    it("should use correct URL_PREFIXS constants", () => {
      const currentParams = new URLSearchParams();

      const result = appendWindowToUrl(currentParams, {
        windowIdentifier: "143_1000",
        tabId: "TestTab",
        recordId: "1234",
      });

      expect(result).toContain(`${URL_PREFIXS.WINDOW_IDENTIFIER}_0=`);
      expect(result).toContain(`${URL_PREFIXS.TAB_IDENTIFIER}_0=`);
      expect(result).toContain(`${URL_PREFIXS.RECORD_IDENTIFIER}_0=`);
    });

    it("should encode special characters in parameter values", () => {
      const currentParams = new URLSearchParams();

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: "143_1000",
        tabId: "Tab With Spaces",
        recordId: "id&special=chars",
      });

      expectWindowAtIndex(params, 0, {
        windowIdentifier: "143_1000",
        tabId: "Tab With Spaces",
        recordId: "id&special=chars",
      });
    });

    it("should return valid URL query string format", () => {
      const currentParams = new URLSearchParams("wi_0=143_1000");

      const result = appendWindowToUrl(currentParams, {
        windowIdentifier: "144_2000",
        tabId: "LocationTab",
        recordId: "2000015",
      });

      // Should be a valid query string (no leading '?')
      expect(result.startsWith("?")).toBe(false);

      // Should be parseable by URLSearchParams
      expect(() => new URLSearchParams(result)).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle empty string values", () => {
      const currentParams = new URLSearchParams();

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: "",
        tabId: "",
        recordId: "",
      });

      expectWindowAtIndex(params, 0, {
        windowIdentifier: "",
        tabId: "",
        recordId: "",
      });
    });

    it("should handle numeric values converted to strings", () => {
      const currentParams = new URLSearchParams();

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: "143_1000",
        tabId: "tab123",
        recordId: "999999",
      });

      expect(params.get("ri_0")).toBe("999999");
    });

    it("should handle very long window identifiers", () => {
      const currentParams = new URLSearchParams();
      const longIdentifier = "143_" + "1".repeat(100);

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: longIdentifier,
        tabId: "TestTab",
        recordId: "1234",
      });

      expect(params.get("wi_0")).toBe(longIdentifier);
    });

    it("should handle window identifier format with timestamp", () => {
      const currentParams = new URLSearchParams();
      const timestamp = Date.now();

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: `143_${timestamp}`,
        tabId: "BPartnerTab",
        recordId: "1000001",
      });

      expect(params.get("wi_0")).toBe(`143_${timestamp}`);
    });

    it("should handle appending when only partial previous window parameters exist", () => {
      // Some windows might not have tab/record parameters
      const currentParams = new URLSearchParams("wi_0=143_1000&wi_1=144_2000&ti_1=Tab1");

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: "145_3000",
        tabId: "TestTab",
        recordId: "1234",
      });

      expectWindowAtIndex(params, 2, {
        windowIdentifier: "145_3000",
        tabId: "TestTab",
        recordId: "1234",
      });
    });

    it("should handle unicode characters in tab and record IDs", () => {
      const currentParams = new URLSearchParams();

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: "143_1000",
        tabId: "Pestaña_Ñoño",
        recordId: "registro_123",
      });

      expectWindowAtIndex(params, 0, {
        windowIdentifier: "143_1000",
        tabId: "Pestaña_Ñoño",
        recordId: "registro_123",
      });
    });
  });

  describe("real-world scenarios", () => {
    it("should handle typical Business Partner to Location scenario", () => {
      const currentParams = new URLSearchParams("wi_0=143_1732640000&ti_0=BPartnerTab&ri_0=1000001");

      const params = appendWindowAndParse(currentParams, {
        windowIdentifier: "144_1732640100",
        tabId: "LocationTab",
        recordId: "2000015",
      });

      // Original window preserved
      expectWindowAtIndex(params, 0, {
        windowIdentifier: "143_1732640000",
        tabId: "BPartnerTab",
        recordId: "1000001",
      });

      // New window added
      expectWindowAtIndex(params, 1, {
        windowIdentifier: "144_1732640100",
        tabId: "LocationTab",
        recordId: "2000015",
      });
    });

    it("should handle opening multiple windows from linked items sequentially", () => {
      let currentParams = new URLSearchParams();

      // Open first window
      currentParams = appendWindowAndParse(currentParams, {
        windowIdentifier: "143_1000",
        tabId: "BPartnerTab",
        recordId: "1000001",
      });

      // Open second window
      currentParams = appendWindowAndParse(currentParams, {
        windowIdentifier: "144_2000",
        tabId: "LocationTab",
        recordId: "2000015",
      });

      // Open third window
      const finalParams = appendWindowAndParse(currentParams, {
        windowIdentifier: "145_3000",
        tabId: "OrderTab",
        recordId: "3000001",
      });

      expectWindowAtIndex(finalParams, 0, { windowIdentifier: "143_1000" });
      expectWindowAtIndex(finalParams, 1, { windowIdentifier: "144_2000" });
      expectWindowAtIndex(finalParams, 2, { windowIdentifier: "145_3000" });
    });

    it("should work correctly when WindowProvider will rebuild URL later", () => {
      // Simulates the scenario described in the function's JSDoc:
      // appendWindowToUrl only appends the new window,
      // WindowProvider's useEffect will later rebuild the complete URL

      const currentParams = new URLSearchParams("wi_0=143_1000&ti_0=BPartnerTab&ri_0=1000001");

      const result = appendWindowToUrl(currentParams, {
        windowIdentifier: "144_2000",
        tabId: "LocationTab",
        recordId: "2000015",
      });

      // Result should be immediately usable for router.replace()
      expect(result).toBeTruthy();
      expect(result).toContain("wi_0=");
      expect(result).toContain("wi_1=");

      // Can be used directly in router
      const urlForRouter = `window?${result}`;
      expect(urlForRouter).toBe(
        "window?wi_0=143_1000&ti_0=BPartnerTab&ri_0=1000001&wi_1=144_2000&ti_1=LocationTab&ri_1=2000015"
      );
    });
  });
});

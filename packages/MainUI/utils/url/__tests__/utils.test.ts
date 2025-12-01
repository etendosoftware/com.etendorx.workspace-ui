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
} from "../utils";
import type { WindowState } from "../../window/constants";
import { TAB_MODES, FORM_MODES } from "../constants";

describe("URL Utility Functions", () => {
  describe("buildWindowsUrlParams", () => {
    it("should build params for single window with no tabs", () => {
      const windows: WindowState[] = [
        {
          windowId: "143",
          windowIdentifier: "143_123456",
          title: "Window 1",
          isActive: true,
          initialized: true,
          tabs: {},
          navigation: {
            activeLevels: [],
            activeTabsByLevel: new Map(),
            initialized: false,
          },
        },
      ];

      const result = buildWindowsUrlParams(windows);

      expect(result).toBe("wi_0=143_123456");
    });

    it("should include deepest tab with record", () => {
      const windows: WindowState[] = [
        {
          windowId: "143",
          windowIdentifier: "143_123456",
          title: "Window 1",
          isActive: true,
          initialized: true,
          tabs: {
            tab1: {
              level: 0,
              selectedRecord: "rec1",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "rec1",
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
            tab2: {
              level: 1,
              selectedRecord: "rec2",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "rec2",
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
          },
          navigation: {
            activeLevels: [0, 1],
            activeTabsByLevel: new Map([
              [0, "tab1"],
              [1, "tab2"],
            ]),
            initialized: true,
          },
        },
      ];

      const result = buildWindowsUrlParams(windows);

      expect(result).toContain("wi_0=143_123456");
      expect(result).toContain("ti_0=tab2");
      expect(result).toContain("ri_0=rec2");
    });

    it("should handle multiple windows", () => {
      const windows: WindowState[] = [
        {
          windowId: "143",
          windowIdentifier: "143_123456",
          title: "Window 1",
          isActive: true,
          initialized: true,
          tabs: {},
          navigation: {
            activeLevels: [],
            activeTabsByLevel: new Map(),
            initialized: false,
          },
        },
        {
          windowId: "144",
          windowIdentifier: "144_789012",
          title: "Window 2",
          isActive: false,
          initialized: true,
          tabs: {
            tab1: {
              level: 0,
              selectedRecord: "rec1",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "rec1",
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
          },
          navigation: {
            activeLevels: [0],
            activeTabsByLevel: new Map([[0, "tab1"]]),
            initialized: true,
          },
        },
      ];

      const result = buildWindowsUrlParams(windows);

      expect(result).toContain("wi_0=143_123456");
      expect(result).toContain("wi_1=144_789012");
      expect(result).toContain("ti_1=tab1");
      expect(result).toContain("ri_1=rec1");
    });

    it("should only include tabs with both selectedRecord and form.recordId", () => {
      const windows: WindowState[] = [
        {
          windowId: "143",
          windowIdentifier: "143_123456",
          title: "Window 1",
          isActive: true,
          initialized: true,
          tabs: {
            tab1: {
              level: 0,
              selectedRecord: "rec1",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "", // No recordId
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
            tab2: {
              level: 1,
              selectedRecord: undefined, // No selectedRecord
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "rec2",
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
          },
          navigation: {
            activeLevels: [],
            activeTabsByLevel: new Map(),
            initialized: false,
          },
        },
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
        {
          windowId: "143",
          windowIdentifier: "143_123456",
          title: "Window 1",
          isActive: true,
          initialized: true,
          tabs: {
            tab1: {
              level: 0,
              selectedRecord: "rec1",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "rec1",
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
            tab2: {
              level: 1,
              selectedRecord: "rec2",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "rec2",
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
            tab3: {
              level: 2,
              selectedRecord: "rec3",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "rec3",
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
          },
          navigation: {
            activeLevels: [0, 1, 2],
            activeTabsByLevel: new Map([
              [0, "tab1"],
              [1, "tab2"],
              [2, "tab3"],
            ]),
            initialized: true,
          },
        },
      ];

      const result = buildWindowsUrlParams(windows);

      expect(result).toContain("wi_0=143_123456");
      expect(result).toContain("ti_0=tab3"); // Deepest tab
      expect(result).toContain("ri_0=rec3");
      expect(result).not.toContain("ti_0=tab1");
      expect(result).not.toContain("ti_0=tab2");
    });

    it("should handle tabs with same level correctly", () => {
      const windows: WindowState[] = [
        {
          windowId: "143",
          windowIdentifier: "143_123456",
          title: "Window 1",
          isActive: true,
          initialized: true,
          tabs: {
            tab1: {
              level: 1,
              selectedRecord: "rec1",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "rec1",
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
            tab2: {
              level: 1,
              selectedRecord: "rec2",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "rec2",
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
          },
          navigation: {
            activeLevels: [1],
            activeTabsByLevel: new Map([[1, "tab1"]]),
            initialized: true,
          },
        },
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
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1&ri_0=rec1");

      const result = parseWindowRecoveryData(params);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        windowIdentifier: "143_123456",
        tabId: "tab1",
        recordId: "rec1",
        hasRecoveryData: true,
      });
    });

    it("should parse window without recovery data", () => {
      const params = new URLSearchParams("wi_0=143_123456");

      const result = parseWindowRecoveryData(params);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        windowIdentifier: "143_123456",
        tabId: undefined,
        recordId: undefined,
        hasRecoveryData: false,
      });
    });

    it("should parse multiple windows", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1&ri_0=rec1&wi_1=144_789012");

      const result = parseWindowRecoveryData(params);

      expect(result).toHaveLength(2);
      expect(result[0].windowIdentifier).toBe("143_123456");
      expect(result[0].hasRecoveryData).toBe(true);
      expect(result[1].windowIdentifier).toBe("144_789012");
      expect(result[1].hasRecoveryData).toBe(false);
    });

    it("should handle empty params", () => {
      const params = new URLSearchParams("");

      const result = parseWindowRecoveryData(params);

      expect(result).toHaveLength(0);
    });

    it("should handle params with only tabId", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1");

      const result = parseWindowRecoveryData(params);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        windowIdentifier: "143_123456",
        tabId: "tab1",
        recordId: undefined,
        hasRecoveryData: false, // Both tabId and recordId required
      });
    });
  });

  describe("validateRecoveryParameters", () => {
    it("should return true when both tabId and recordId are present", () => {
      const info = {
        windowIdentifier: "143_123456",
        tabId: "tab1",
        recordId: "rec1",
        hasRecoveryData: true,
      };

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

      expect(result.has("wi_0")).toBe(true);
      expect(result.has("ti_0")).toBe(true);
      expect(result.has("ri_0")).toBe(true);
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

      expect(result.has("wi_0")).toBe(false);
      expect(result.has("ti_0")).toBe(false);
      expect(result.has("ri_0")).toBe(false);
      expect(result.get("other")).toBe("value"); // Non-recovery param preserved
    });

    it("should preserve non-recovery parameters", () => {
      const params = new URLSearchParams("wi_0=143_123456&filter=active&sort=name");

      const result = removeRecoveryParameters(params);

      expect(result.has("wi_0")).toBe(false);
      expect(result.get("filter")).toBe("active");
      expect(result.get("sort")).toBe("name");
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

      expect(result.has("wi_0")).toBe(false);
      expect(result.has("ti_0")).toBe(false);
      expect(result.has("ri_0")).toBe(false);
      expect(result.has("wi_1")).toBe(true);
      expect(result.has("ti_1")).toBe(true);
      expect(result.has("ri_1")).toBe(true);
    });

    it("should handle removing from middle index", () => {
      const params = new URLSearchParams("wi_0=143&wi_1=144&wi_2=145");

      const result = removeWindowParameters(params, 1);

      expect(result.has("wi_0")).toBe(true);
      expect(result.has("wi_1")).toBe(false);
      expect(result.has("wi_2")).toBe(true);
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

      expect(result.has("wi_0")).toBe(false);
      expect(result.has("ti_0")).toBe(false);
      expect(result.get("other")).toBe("value");
    });

    it("should handle zero index", () => {
      const params = new URLSearchParams("wi_0=143_123456&ti_0=tab1&ri_0=rec1");

      const result = removeWindowParameters(params, 0);

      expect(result.has("wi_0")).toBe(false);
      expect(result.has("ti_0")).toBe(false);
      expect(result.has("ri_0")).toBe(false);
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
        {
          windowId: "143",
          windowIdentifier: "143_123456",
          title: "Window 1",
          isActive: true,
          initialized: true,
          tabs: {
            tab1: {
              level: 0,
              selectedRecord: "rec1",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {}, // Empty form object
            },
          },
          navigation: {
            activeLevels: [0],
            activeTabsByLevel: new Map([[0, "tab1"]]),
            initialized: true,
          },
        },
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
        {
          windowId: "143",
          windowIdentifier: "143_123456",
          title: "Window 1",
          isActive: true,
          initialized: true,
          tabs: {
            tab1: {
              level: 0,
              selectedRecord: "rec1",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "rec1",
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
          },
          navigation: {
            activeLevels: [0],
            activeTabsByLevel: new Map([[0, "tab1"]]),
            initialized: true,
          },
        },
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
        {
          windowId: "143-ABC",
          windowIdentifier: "143-ABC_123456",
          title: "Window 1",
          isActive: true,
          initialized: true,
          tabs: {
            "tab-1": {
              level: 0,
              selectedRecord: "rec-1",
              table: {
                filters: [],
                visibility: {},
                sorting: [],
                order: [],
                isImplicitFilterApplied: false,
              },
              form: {
                recordId: "rec-1",
                mode: TAB_MODES.FORM,
                formMode: FORM_MODES.EDIT,
              },
            },
          },
          navigation: {
            activeLevels: [0],
            activeTabsByLevel: new Map([[0, "tab-1"]]),
            initialized: true,
          },
        },
      ];

      const result = buildWindowsUrlParams(windows);

      expect(result).toContain("wi_0=143-ABC_123456");
      expect(result).toContain("ti_0=tab-1");
      expect(result).toContain("ri_0=rec-1");
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

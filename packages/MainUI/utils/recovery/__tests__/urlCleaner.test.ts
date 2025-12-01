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
 * @fileoverview Unit tests for URL cleaner utilities
 *
 * Tests the URL cleanup implementation:
 * - cleanupUrl function for removing all recovery parameters
 * - cleanupFailedWindowUrl function for removing specific window parameters
 * - cleanInvalidParameters function for removing inconsistent parameters
 * - Integration with browser History API
 * - Error handling and edge cases
 */

import { cleanupUrl, cleanupFailedWindowUrl, cleanInvalidParameters } from "../urlCleaner";
import * as urlUtils from "@/utils/url/utils";
import type { WindowRecoveryInfo } from "@/utils/window/constants";

// Mock dependencies
jest.mock("@/utils/url/utils");

const mockUrlUtils = urlUtils as jest.Mocked<typeof urlUtils>;

describe("cleanupUrl", () => {
  let originalLocation: Location;
  let mockReplaceState: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Save original location
    originalLocation = window.location;

    // Mock window.location
    delete (window as any).location;
    window.location = {
      href: "http://localhost:3000/app?w=143_123&ti_0=tab1&ri_0=rec1",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&ti_0=tab1&ri_0=rec1",
    } as any;

    // Mock window.history.replaceState
    mockReplaceState = jest.fn();
    window.history.replaceState = mockReplaceState;

    // Mock removeRecoveryParameters to return clean params
    mockUrlUtils.removeRecoveryParameters.mockImplementation((params: URLSearchParams) => {
      const cleanParams = new URLSearchParams(params);
      cleanParams.delete("ti_0");
      cleanParams.delete("ri_0");
      return cleanParams;
    });
  });

  afterEach(() => {
    // Restore original location
    window.location = originalLocation;
  });

  it("should remove all recovery parameters from URL", () => {
    cleanupUrl();

    expect(mockUrlUtils.removeRecoveryParameters).toHaveBeenCalledWith(expect.any(URLSearchParams));
    expect(mockReplaceState).toHaveBeenCalledWith(null, "", "http://localhost:3000/app?w=143_123");
  });

  it("should handle URL with no query parameters", () => {
    window.location = {
      href: "http://localhost:3000/app",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "",
    } as any;

    mockUrlUtils.removeRecoveryParameters.mockReturnValue(new URLSearchParams());

    cleanupUrl();

    expect(mockReplaceState).toHaveBeenCalledWith(null, "", "http://localhost:3000/app");
  });

  it("should preserve non-recovery parameters", () => {
    window.location = {
      href: "http://localhost:3000/app?w=143_123&ti_0=tab1&other=value",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&ti_0=tab1&other=value",
    } as any;

    mockUrlUtils.removeRecoveryParameters.mockImplementation((params: URLSearchParams) => {
      const cleanParams = new URLSearchParams(params);
      cleanParams.delete("ti_0");
      return cleanParams;
    });

    cleanupUrl();

    expect(mockReplaceState).toHaveBeenCalledWith(null, "", "http://localhost:3000/app?w=143_123&other=value");
  });

  it("should handle URL with multiple recovery parameters", () => {
    window.location = {
      href: "http://localhost:3000/app?w=143_123&ti_0=tab1&ri_0=rec1&ti_1=tab2&ri_1=rec2",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&ti_0=tab1&ri_0=rec1&ti_1=tab2&ri_1=rec2",
    } as any;

    mockUrlUtils.removeRecoveryParameters.mockImplementation((params: URLSearchParams) => {
      const cleanParams = new URLSearchParams(params);
      cleanParams.delete("ti_0");
      cleanParams.delete("ri_0");
      cleanParams.delete("ti_1");
      cleanParams.delete("ri_1");
      return cleanParams;
    });

    cleanupUrl();

    expect(mockReplaceState).toHaveBeenCalledWith(null, "", "http://localhost:3000/app?w=143_123");
  });

  it("should handle URL with special characters in parameters", () => {
    window.location = {
      href: "http://localhost:3000/app?w=143_123&param=hello%20world",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&param=hello%20world",
    } as any;

    mockUrlUtils.removeRecoveryParameters.mockReturnValue(new URLSearchParams("w=143_123&param=hello%20world"));

    cleanupUrl();

    expect(mockReplaceState).toHaveBeenCalledWith(null, "", "http://localhost:3000/app?w=143_123&param=hello+world");
  });

  it("should handle deep nested paths", () => {
    window.location = {
      href: "http://localhost:3000/app/dashboard/view?w=143_123&ti_0=tab1",
      origin: "http://localhost:3000",
      pathname: "/app/dashboard/view",
      search: "?w=143_123&ti_0=tab1",
    } as any;

    mockUrlUtils.removeRecoveryParameters.mockReturnValue(new URLSearchParams("w=143_123"));

    cleanupUrl();

    expect(mockReplaceState).toHaveBeenCalledWith(null, "", "http://localhost:3000/app/dashboard/view?w=143_123");
  });

  it("should handle different ports", () => {
    window.location = {
      href: "http://localhost:8080/app?w=143_123&ti_0=tab1",
      origin: "http://localhost:8080",
      pathname: "/app",
      search: "?w=143_123&ti_0=tab1",
    } as any;

    mockUrlUtils.removeRecoveryParameters.mockReturnValue(new URLSearchParams("w=143_123"));

    cleanupUrl();

    expect(mockReplaceState).toHaveBeenCalledWith(null, "", "http://localhost:8080/app?w=143_123");
  });

  it("should handle HTTPS protocol", () => {
    window.location = {
      href: "https://example.com/app?w=143_123&ti_0=tab1",
      origin: "https://example.com",
      pathname: "/app",
      search: "?w=143_123&ti_0=tab1",
    } as any;

    mockUrlUtils.removeRecoveryParameters.mockReturnValue(new URLSearchParams("w=143_123"));

    cleanupUrl();

    expect(mockReplaceState).toHaveBeenCalledWith(null, "", "https://example.com/app?w=143_123");
  });

  it("should handle errors gracefully", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockUrlUtils.removeRecoveryParameters.mockImplementation(() => {
      throw new Error("Mock error");
    });

    cleanupUrl();

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error during URL cleanup:", expect.any(Error));
    expect(mockReplaceState).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should handle URL constructor errors", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    window.location = {
      href: "invalid-url",
      origin: "",
      pathname: "",
      search: "",
    } as any;

    cleanupUrl();

    expect(consoleErrorSpy).toHaveBeenCalled();
    const callArgs = consoleErrorSpy.mock.calls[0];
    expect(callArgs[0]).toBe("Error during URL cleanup:");

    consoleErrorSpy.mockRestore();
  });

  it("should call removeRecoveryParameters with correct URLSearchParams", () => {
    cleanupUrl();

    const callArg = mockUrlUtils.removeRecoveryParameters.mock.calls[0][0];
    expect(callArg).toBeInstanceOf(URLSearchParams);
    expect(callArg.get("w")).toBe("143_123");
    expect(callArg.get("ti_0")).toBe("tab1");
    expect(callArg.get("ri_0")).toBe("rec1");
  });
});

describe("cleanupFailedWindowUrl", () => {
  let originalLocation: Location;
  let mockReplaceState: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    originalLocation = window.location;

    delete (window as any).location;
    window.location = {
      href: "http://localhost:3000/app?w=143_123&w=144_456&ti_0=tab1&ri_0=rec1&ti_1=tab2&ri_1=rec2",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&w=144_456&ti_0=tab1&ri_0=rec1&ti_1=tab2&ri_1=rec2",
    } as any;

    mockReplaceState = jest.fn();
    window.history.replaceState = mockReplaceState;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  it("should remove parameters for specific window index", () => {
    mockUrlUtils.removeWindowParameters.mockImplementation((params: URLSearchParams) => {
      const cleanParams = new URLSearchParams(params);
      cleanParams.delete("ti_0");
      cleanParams.delete("ri_0");
      // Simulate removing first 'w' parameter
      const wValues = params.getAll("w");
      cleanParams.delete("w");
      wValues.slice(1).forEach((v) => cleanParams.append("w", v));
      return cleanParams;
    });

    cleanupFailedWindowUrl(0);

    expect(mockUrlUtils.removeWindowParameters).toHaveBeenCalledWith(expect.any(URLSearchParams), 0);
    const replaceCall = mockReplaceState.mock.calls[0];
    expect(replaceCall[0]).toBe(null);
    expect(replaceCall[1]).toBe("");
    const url = new URL(replaceCall[2]);
    expect(url.origin + url.pathname).toBe("http://localhost:3000/app");
    expect(url.searchParams.get("w")).toBe("144_456");
    expect(url.searchParams.get("ti_1")).toBe("tab2");
    expect(url.searchParams.get("ri_1")).toBe("rec2");
  });

  it("should handle removal of second window", () => {
    mockUrlUtils.removeWindowParameters.mockImplementation((params: URLSearchParams) => {
      const cleanParams = new URLSearchParams(params);
      cleanParams.delete("ti_1");
      cleanParams.delete("ri_1");
      // Simulate removing second 'w' parameter
      const wValues = params.getAll("w");
      cleanParams.delete("w");
      cleanParams.append("w", wValues[0]);
      return cleanParams;
    });

    cleanupFailedWindowUrl(1);

    expect(mockUrlUtils.removeWindowParameters).toHaveBeenCalledWith(expect.any(URLSearchParams), 1);
    const replaceCall = mockReplaceState.mock.calls[0];
    expect(replaceCall[0]).toBe(null);
    expect(replaceCall[1]).toBe("");
    const url = new URL(replaceCall[2]);
    expect(url.origin + url.pathname).toBe("http://localhost:3000/app");
    expect(url.searchParams.get("w")).toBe("143_123");
    expect(url.searchParams.get("ti_0")).toBe("tab1");
    expect(url.searchParams.get("ri_0")).toBe("rec1");
  });

  it("should handle window index 0", () => {
    mockUrlUtils.removeWindowParameters.mockReturnValue(new URLSearchParams("w=144_456&ti_1=tab2&ri_1=rec2"));

    cleanupFailedWindowUrl(0);

    expect(mockUrlUtils.removeWindowParameters).toHaveBeenCalledWith(expect.any(URLSearchParams), 0);
  });

  it("should handle window index greater than 1", () => {
    window.location = {
      href: "http://localhost:3000/app?w=143_123&w=144_456&w=145_789&ti_0=tab1&ti_1=tab2&ti_2=tab3",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&w=144_456&w=145_789&ti_0=tab1&ti_1=tab2&ti_2=tab3",
    } as any;

    mockUrlUtils.removeWindowParameters.mockReturnValue(new URLSearchParams("w=143_123&w=144_456&ti_0=tab1&ti_1=tab2"));

    cleanupFailedWindowUrl(2);

    expect(mockUrlUtils.removeWindowParameters).toHaveBeenCalledWith(expect.any(URLSearchParams), 2);
    const replaceCall = mockReplaceState.mock.calls[0];
    expect(replaceCall[0]).toBe(null);
    expect(replaceCall[1]).toBe("");
    const url = new URL(replaceCall[2]);
    expect(url.origin + url.pathname).toBe("http://localhost:3000/app");
    expect(url.searchParams.getAll("w")).toEqual(["143_123", "144_456"]);
    expect(url.searchParams.get("ti_0")).toBe("tab1");
    expect(url.searchParams.get("ti_1")).toBe("tab2");
  });

  it("should handle URL with no remaining parameters", () => {
    window.location = {
      href: "http://localhost:3000/app?w=143_123&ti_0=tab1&ri_0=rec1",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&ti_0=tab1&ri_0=rec1",
    } as any;

    mockUrlUtils.removeWindowParameters.mockReturnValue(new URLSearchParams());

    cleanupFailedWindowUrl(0);

    expect(mockReplaceState).toHaveBeenCalledWith(null, "", "http://localhost:3000/app");
  });

  it("should preserve other parameters", () => {
    window.location = {
      href: "http://localhost:3000/app?w=143_123&ti_0=tab1&other=value",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&ti_0=tab1&other=value",
    } as any;

    mockUrlUtils.removeWindowParameters.mockReturnValue(new URLSearchParams("other=value"));

    cleanupFailedWindowUrl(0);

    expect(mockReplaceState).toHaveBeenCalledWith(null, "", "http://localhost:3000/app?other=value");
  });

  it("should handle errors gracefully", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockUrlUtils.removeWindowParameters.mockImplementation(() => {
      throw new Error("Mock error");
    });

    cleanupFailedWindowUrl(0);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error during failed window URL cleanup:", expect.any(Error));
    expect(mockReplaceState).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should handle invalid window index", () => {
    mockUrlUtils.removeWindowParameters.mockReturnValue(new URLSearchParams(window.location.search.slice(1)));

    cleanupFailedWindowUrl(-1);

    expect(mockUrlUtils.removeWindowParameters).toHaveBeenCalledWith(expect.any(URLSearchParams), -1);
  });

  it("should handle very large window index", () => {
    mockUrlUtils.removeWindowParameters.mockReturnValue(new URLSearchParams(window.location.search.slice(1)));

    cleanupFailedWindowUrl(999);

    expect(mockUrlUtils.removeWindowParameters).toHaveBeenCalledWith(expect.any(URLSearchParams), 999);
  });

  it("should handle URL with encoded characters", () => {
    window.location = {
      href: "http://localhost:3000/app?w=143_123&ti_0=tab%201&ri_0=rec%201",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&ti_0=tab%201&ri_0=rec%201",
    } as any;

    mockUrlUtils.removeWindowParameters.mockReturnValue(new URLSearchParams("w=143_123"));

    cleanupFailedWindowUrl(0);

    expect(mockReplaceState).toHaveBeenCalledWith(null, "", "http://localhost:3000/app?w=143_123");
  });
});

describe("cleanInvalidParameters", () => {
  let originalLocation: Location;
  let mockReplaceState: jest.Mock;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    originalLocation = window.location;

    delete (window as any).location;
    window.location = {
      href: "http://localhost:3000/app?w=143_123&ti_0=tab1&ri_0=rec1",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&ti_0=tab1&ri_0=rec1",
    } as any;

    mockReplaceState = jest.fn();
    window.history.replaceState = mockReplaceState;

    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    window.location = originalLocation;
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("should remove invalid recovery parameters", () => {
    const mockRecoveryData: WindowRecoveryInfo[] = [
      {
        windowIdentifier: "143_123",
        tabId: "tab1",
        recordId: undefined, // Invalid: missing recordId
        hasRecoveryData: false,
      },
    ];

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue(mockRecoveryData);
    mockUrlUtils.validateRecoveryParameters.mockReturnValue(false);

    cleanInvalidParameters();

    expect(mockUrlUtils.parseWindowRecoveryData).toHaveBeenCalledWith(expect.any(URLSearchParams));
    expect(mockUrlUtils.validateRecoveryParameters).toHaveBeenCalledWith(mockRecoveryData[0]);
    expect(consoleWarnSpy).toHaveBeenCalledWith("Removed invalid recovery parameters for window index 0:", {
      windowIdentifier: "143_123",
      tabId: "tab1",
      recordId: undefined,
    });
    expect(consoleLogSpy).toHaveBeenCalledWith("Cleaned invalid recovery parameters from URL");
    expect(mockReplaceState).toHaveBeenCalled();
  });

  it("should not modify URL when all parameters are valid", () => {
    const mockRecoveryData: WindowRecoveryInfo[] = [
      {
        windowIdentifier: "143_123",
        tabId: "tab1",
        recordId: "rec1",
        hasRecoveryData: true,
      },
    ];

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue(mockRecoveryData);
    mockUrlUtils.validateRecoveryParameters.mockReturnValue(true);

    cleanInvalidParameters();

    expect(mockUrlUtils.validateRecoveryParameters).toHaveBeenCalledWith(mockRecoveryData[0]);
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(mockReplaceState).not.toHaveBeenCalled();
  });

  it("should handle multiple windows with mixed validity", () => {
    window.location = {
      href: "http://localhost:3000/app?w=143_123&w=144_456&ti_0=tab1&ti_1=tab2&ri_1=rec2",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&w=144_456&ti_0=tab1&ti_1=tab2&ri_1=rec2",
    } as any;

    const mockRecoveryData: WindowRecoveryInfo[] = [
      {
        windowIdentifier: "143_123",
        tabId: "tab1",
        recordId: undefined, // Invalid
        hasRecoveryData: false,
      },
      {
        windowIdentifier: "144_456",
        tabId: "tab2",
        recordId: "rec2", // Valid
        hasRecoveryData: true,
      },
    ];

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue(mockRecoveryData);
    mockUrlUtils.validateRecoveryParameters
      .mockReturnValueOnce(false) // First window invalid
      .mockReturnValueOnce(true); // Second window valid

    cleanInvalidParameters();

    expect(mockUrlUtils.validateRecoveryParameters).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Removed invalid recovery parameters for window index 0:",
      expect.any(Object)
    );
    expect(mockReplaceState).toHaveBeenCalled();
  });

  it("should remove all invalid parameters from multiple windows", () => {
    window.location = {
      href: "http://localhost:3000/app?w=143_123&w=144_456&ti_0=tab1&ti_1=tab2",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&w=144_456&ti_0=tab1&ti_1=tab2",
    } as any;

    const mockRecoveryData: WindowRecoveryInfo[] = [
      {
        windowIdentifier: "143_123",
        tabId: "tab1",
        recordId: undefined, // Invalid
        hasRecoveryData: false,
      },
      {
        windowIdentifier: "144_456",
        tabId: "tab2",
        recordId: undefined, // Invalid
        hasRecoveryData: false,
      },
    ];

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue(mockRecoveryData);
    mockUrlUtils.validateRecoveryParameters.mockReturnValue(false);

    cleanInvalidParameters();

    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    expect(mockReplaceState).toHaveBeenCalled();
  });

  it("should preserve valid parameters and remove invalid ones", () => {
    const mockRecoveryData: WindowRecoveryInfo[] = [
      {
        windowIdentifier: "143_123",
        tabId: "tab1",
        recordId: undefined,
        hasRecoveryData: false,
      },
    ];

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue(mockRecoveryData);
    mockUrlUtils.validateRecoveryParameters.mockReturnValue(false);

    cleanInvalidParameters();

    const replaceCall = mockReplaceState.mock.calls[0];
    const newUrl = replaceCall[2];

    // Should still contain 'w' parameter
    expect(newUrl).toContain("w=143_123");
    // Should not contain invalid ti_0 and ri_0
    expect(newUrl).not.toContain("ti_0");
    expect(newUrl).not.toContain("ri_0");
  });

  it("should handle empty recovery data", () => {
    mockUrlUtils.parseWindowRecoveryData.mockReturnValue([]);

    cleanInvalidParameters();

    expect(mockUrlUtils.validateRecoveryParameters).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(mockReplaceState).not.toHaveBeenCalled();
  });

  it("should handle URL with no parameters", () => {
    window.location = {
      href: "http://localhost:3000/app",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "",
    } as any;

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue([]);

    cleanInvalidParameters();

    expect(mockReplaceState).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    mockUrlUtils.parseWindowRecoveryData.mockImplementation(() => {
      throw new Error("Mock parsing error");
    });

    cleanInvalidParameters();

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error cleaning invalid parameters:", expect.any(Error));
    expect(mockReplaceState).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should log correct window index in warning", () => {
    window.location = {
      href: "http://localhost:3000/app?w=143_123&w=144_456&ti_0=tab1&ti_1=tab2",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&w=144_456&ti_0=tab1&ti_1=tab2",
    } as any;

    const mockRecoveryData: WindowRecoveryInfo[] = [
      {
        windowIdentifier: "143_123",
        tabId: "tab1",
        recordId: "rec1",
        hasRecoveryData: true,
      },
      {
        windowIdentifier: "144_456",
        tabId: "tab2",
        recordId: undefined,
        hasRecoveryData: false,
      },
    ];

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue(mockRecoveryData);
    mockUrlUtils.validateRecoveryParameters.mockReturnValueOnce(true).mockReturnValueOnce(false);

    cleanInvalidParameters();

    expect(consoleWarnSpy).toHaveBeenCalledWith("Removed invalid recovery parameters for window index 1:", {
      windowIdentifier: "144_456",
      tabId: "tab2",
      recordId: undefined,
    });
  });

  it("should handle validation function returning false for all", () => {
    const mockRecoveryData: WindowRecoveryInfo[] = [
      {
        windowIdentifier: "143_123",
        tabId: undefined,
        recordId: undefined,
        hasRecoveryData: false,
      },
    ];

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue(mockRecoveryData);
    mockUrlUtils.validateRecoveryParameters.mockReturnValue(false);

    cleanInvalidParameters();

    expect(mockReplaceState).toHaveBeenCalled();
  });

  it("should construct clean URL correctly when removing parameters", () => {
    window.location = {
      href: "http://localhost:3000/app?w=143_123&ti_0=tab1&ri_0=rec1&other=value",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&ti_0=tab1&ri_0=rec1&other=value",
    } as any;

    const mockRecoveryData: WindowRecoveryInfo[] = [
      {
        windowIdentifier: "143_123",
        tabId: "tab1",
        recordId: "rec1",
        hasRecoveryData: false,
      },
    ];

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue(mockRecoveryData);
    mockUrlUtils.validateRecoveryParameters.mockReturnValue(false);

    cleanInvalidParameters();

    const replaceCall = mockReplaceState.mock.calls[0];
    const newUrl = replaceCall[2];

    expect(newUrl).toContain("w=143_123");
    expect(newUrl).toContain("other=value");
    expect(newUrl).not.toContain("ti_0");
    expect(newUrl).not.toContain("ri_0");
  });

  it("should handle URL cleanup when no parameters remain", () => {
    window.location = {
      href: "http://localhost:3000/app?ti_0=tab1&ri_0=rec1",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?ti_0=tab1&ri_0=rec1",
    } as any;

    const mockRecoveryData: WindowRecoveryInfo[] = [
      {
        windowIdentifier: "",
        tabId: "tab1",
        recordId: "rec1",
        hasRecoveryData: false,
      },
    ];

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue(mockRecoveryData);
    mockUrlUtils.validateRecoveryParameters.mockReturnValue(false);

    cleanInvalidParameters();

    const replaceCall = mockReplaceState.mock.calls[0];
    const newUrl = replaceCall[2];

    expect(newUrl).toBe("http://localhost:3000/app");
  });
});

describe("Integration scenarios", () => {
  let originalLocation: Location;
  let mockReplaceState: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    originalLocation = window.location;

    delete (window as any).location;
    window.location = {
      href: "http://localhost:3000/app?w=143_123&w=144_456&ti_0=tab1&ri_0=rec1&ti_1=tab2",
      origin: "http://localhost:3000",
      pathname: "/app",
      search: "?w=143_123&w=144_456&ti_0=tab1&ri_0=rec1&ti_1=tab2",
    } as any;

    mockReplaceState = jest.fn();
    window.history.replaceState = mockReplaceState;

    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    window.location = originalLocation;
    jest.restoreAllMocks();
  });

  it("should handle sequence of cleanInvalidParameters then cleanupFailedWindowUrl", () => {
    // First clean invalid parameters
    const mockRecoveryData: WindowRecoveryInfo[] = [
      {
        windowIdentifier: "143_123",
        tabId: "tab1",
        recordId: "rec1",
        hasRecoveryData: true,
      },
      {
        windowIdentifier: "144_456",
        tabId: "tab2",
        recordId: undefined, // Invalid
        hasRecoveryData: false,
      },
    ];

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue(mockRecoveryData);
    mockUrlUtils.validateRecoveryParameters.mockReturnValueOnce(true).mockReturnValueOnce(false);

    cleanInvalidParameters();

    expect(mockReplaceState).toHaveBeenCalledTimes(1);

    // Then cleanup specific failed window
    mockUrlUtils.removeWindowParameters.mockReturnValue(new URLSearchParams("w=143_123"));

    cleanupFailedWindowUrl(0);

    expect(mockReplaceState).toHaveBeenCalledTimes(2);
  });

  it("should handle cleanupFailedWindowUrl followed by cleanupUrl", () => {
    // Clean specific window
    mockUrlUtils.removeWindowParameters.mockReturnValue(new URLSearchParams("w=144_456&ti_1=tab2"));

    cleanupFailedWindowUrl(0);

    expect(mockReplaceState).toHaveBeenCalledTimes(1);

    // Then clean all recovery parameters
    mockUrlUtils.removeRecoveryParameters.mockReturnValue(new URLSearchParams("w=144_456"));

    cleanupUrl();

    expect(mockReplaceState).toHaveBeenCalledTimes(2);
  });

  it("should handle all three cleanup functions in sequence", () => {
    // 1. Clean invalid parameters
    const mockRecoveryData: WindowRecoveryInfo[] = [
      {
        windowIdentifier: "143_123",
        tabId: "tab1",
        recordId: undefined,
        hasRecoveryData: false,
      },
      {
        windowIdentifier: "144_456",
        tabId: "tab2",
        recordId: "rec2",
        hasRecoveryData: true,
      },
    ];

    mockUrlUtils.parseWindowRecoveryData.mockReturnValue(mockRecoveryData);
    mockUrlUtils.validateRecoveryParameters.mockReturnValueOnce(false).mockReturnValueOnce(true);

    cleanInvalidParameters();

    // 2. Clean failed window
    mockUrlUtils.removeWindowParameters.mockReturnValue(new URLSearchParams("w=144_456"));

    cleanupFailedWindowUrl(0);

    // 3. Clean all recovery parameters
    mockUrlUtils.removeRecoveryParameters.mockReturnValue(new URLSearchParams());

    cleanupUrl();

    expect(mockReplaceState).toHaveBeenCalledTimes(3);
  });
});

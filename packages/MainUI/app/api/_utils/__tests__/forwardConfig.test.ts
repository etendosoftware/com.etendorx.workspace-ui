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

import {
  shouldForwardErpCookies,
  getCombinedErpCookieHeader,
  getErpAuthHeaders,
  shouldPassthroughJson,
} from "../forwardConfig";
import * as sessionStore from "../sessionStore";

// Mock sessionStore
jest.mock("../sessionStore");

const mockGetErpSessionCookie = sessionStore.getErpSessionCookie as jest.MockedFunction<
  typeof sessionStore.getErpSessionCookie
>;

// Mock environment variables
const originalEnv = process.env;

// Helper to create mock Request objects
const createMockRequest = (url: string, headers?: Record<string, string>) =>
  ({
    url,
    headers: {
      get: (key: string) => headers?.[key] || null,
    },
  }) as Request;

describe("forwardConfig", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("shouldForwardErpCookies", () => {
    it("should return true by default when ERP_FORWARD_COOKIES is not set", () => {
      process.env.ERP_FORWARD_COOKIES = undefined;
      expect(shouldForwardErpCookies()).toBe(true);
    });

    it("should return false when ERP_FORWARD_COOKIES is 'false'", () => {
      process.env.ERP_FORWARD_COOKIES = "false";
      expect(shouldForwardErpCookies()).toBe(false);
    });

    it("should return false when ERP_FORWARD_COOKIES is 'FALSE' (case insensitive)", () => {
      process.env.ERP_FORWARD_COOKIES = "FALSE";
      expect(shouldForwardErpCookies()).toBe(false);
    });

    it("should return false when ERP_FORWARD_COOKIES is '0'", () => {
      process.env.ERP_FORWARD_COOKIES = "0";
      expect(shouldForwardErpCookies()).toBe(false);
    });

    it("should return true for any other string value", () => {
      process.env.ERP_FORWARD_COOKIES = "true";
      expect(shouldForwardErpCookies()).toBe(true);

      process.env.ERP_FORWARD_COOKIES = "yes";
      expect(shouldForwardErpCookies()).toBe(true);

      process.env.ERP_FORWARD_COOKIES = "1";
      expect(shouldForwardErpCookies()).toBe(true);

      process.env.ERP_FORWARD_COOKIES = "anything";
      expect(shouldForwardErpCookies()).toBe(true);
    });

    it("should return true when ERP_FORWARD_COOKIES is empty string", () => {
      process.env.ERP_FORWARD_COOKIES = "";
      expect(shouldForwardErpCookies()).toBe(true);
    });
  });

  describe("getCombinedErpCookieHeader", () => {
    const testToken = "test-jwt-token";
    const erpSessionCookie = "JSESSIONID=ABC123";
    const browserCookie = "user_pref=dark_mode; lang=en";

    beforeEach(() => {
      // Default: cookies forwarding is enabled
      process.env.ERP_FORWARD_COOKIES = "true";
    });

    it("should return empty string when cookie forwarding is disabled", () => {
      process.env.ERP_FORWARD_COOKIES = "false";
      const request = createMockRequest("https://example.com", { cookie: browserCookie });
      mockGetErpSessionCookie.mockReturnValue(erpSessionCookie);

      const result = getCombinedErpCookieHeader(request, testToken);
      expect(result).toBe("");
    });

    it("should combine browser cookies and ERP session cookie", () => {
      const request = createMockRequest("https://example.com", { cookie: browserCookie });
      mockGetErpSessionCookie.mockReturnValue(erpSessionCookie);

      const result = getCombinedErpCookieHeader(request, testToken);
      expect(result).toBe(`${browserCookie}; ${erpSessionCookie}`);
    });

    it("should return only browser cookies when no ERP session exists", () => {
      const request = createMockRequest("https://example.com", { cookie: browserCookie });
      mockGetErpSessionCookie.mockReturnValue(null);

      const result = getCombinedErpCookieHeader(request, testToken);
      expect(result).toBe(browserCookie);
    });

    it("should return only ERP session cookie when no browser cookies", () => {
      const request = createMockRequest("https://example.com");
      mockGetErpSessionCookie.mockReturnValue(erpSessionCookie);

      const result = getCombinedErpCookieHeader(request, testToken);
      expect(result).toBe(erpSessionCookie);
    });

    it("should return empty string when no cookies at all", () => {
      const request = createMockRequest("https://example.com");
      mockGetErpSessionCookie.mockReturnValue(null);

      const result = getCombinedErpCookieHeader(request, testToken);
      expect(result).toBe("");
    });

    it("should handle null userToken", () => {
      const request = createMockRequest("https://example.com", { cookie: browserCookie });
      mockGetErpSessionCookie.mockReturnValue(erpSessionCookie); // Won't be called due to null token

      const result = getCombinedErpCookieHeader(request, null);
      expect(result).toBe(browserCookie);
      expect(mockGetErpSessionCookie).not.toHaveBeenCalled();
    });

    it("should handle empty browser cookie", () => {
      const request = createMockRequest("https://example.com", { cookie: "" });
      mockGetErpSessionCookie.mockReturnValue(erpSessionCookie);

      const result = getCombinedErpCookieHeader(request, testToken);
      expect(result).toBe(erpSessionCookie);
    });

    it("should handle multiple browser cookies", () => {
      const multipleCookies = "session=xyz; theme=dark; lang=en; remember=true";
      const request = createMockRequest("https://example.com", { cookie: multipleCookies });
      mockGetErpSessionCookie.mockReturnValue(erpSessionCookie);

      const result = getCombinedErpCookieHeader(request, testToken);
      expect(result).toBe(`${multipleCookies}; ${erpSessionCookie}`);
    });

    it("should handle complex ERP session cookies", () => {
      const complexErpCookie = "JSESSIONID=ABC123; Path=/; Domain=.example.com; Secure; HttpOnly";
      const request = createMockRequest("https://example.com", { cookie: browserCookie });
      mockGetErpSessionCookie.mockReturnValue(complexErpCookie);

      const result = getCombinedErpCookieHeader(request, testToken);
      expect(result).toBe(`${browserCookie}; ${complexErpCookie}`);
    });
  });

  describe("shouldPassthroughJson", () => {
    it("should return true when isc_dataFormat=json in query params", () => {
      const request = createMockRequest("https://example.com/api?isc_dataFormat=json");
      expect(shouldPassthroughJson(request)).toBe(true);
    });

    it("should return true when isc_dataFormat=JSON (case insensitive)", () => {
      const request = createMockRequest("https://example.com/api?isc_dataFormat=JSON");
      expect(shouldPassthroughJson(request)).toBe(true);
    });

    it("should return false when isc_dataFormat is not json", () => {
      const request = createMockRequest("https://example.com/api?isc_dataFormat=xml");
      expect(shouldPassthroughJson(request)).toBe(false);
    });

    it("should return false when isc_dataFormat is empty", () => {
      const request = createMockRequest("https://example.com/api?isc_dataFormat=");
      expect(shouldPassthroughJson(request)).toBe(false);
    });

    it("should return false when isc_dataFormat parameter is not present", () => {
      const request = createMockRequest("https://example.com/api");
      expect(shouldPassthroughJson(request)).toBe(false);
    });

    it("should return false when URL has other parameters but not isc_dataFormat", () => {
      const request = createMockRequest("https://example.com/api?other=value&another=param");
      expect(shouldPassthroughJson(request)).toBe(false);
    });

    it("should handle multiple parameters including isc_dataFormat=json", () => {
      const request = createMockRequest("https://example.com/api?param1=value1&isc_dataFormat=json&param2=value2");
      expect(shouldPassthroughJson(request)).toBe(true);
    });

    it("should handle malformed URLs gracefully", () => {
      // Create a request with invalid URL structure
      const malformedRequest = {
        url: "not-a-valid-url",
      } as Request;

      expect(shouldPassthroughJson(malformedRequest)).toBe(false);
    });

    it("should handle URLs with fragments and still work", () => {
      const request = createMockRequest("https://example.com/api?isc_dataFormat=json#fragment");
      expect(shouldPassthroughJson(request)).toBe(true);
    });

    it("should handle encoded query parameters", () => {
      const request = createMockRequest("https://example.com/api?isc_dataFormat=json&encoded=%20space%20");
      expect(shouldPassthroughJson(request)).toBe(true);
    });
  });

  describe("integration scenarios", () => {
    it("should work correctly when both cookie forwarding is disabled and JSON passthrough is requested", () => {
      process.env.ERP_FORWARD_COOKIES = "false";

      const request = createMockRequest("https://example.com/api?isc_dataFormat=json", {
        cookie: "some=cookie",
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=test");

      // Cookie forwarding should be disabled
      expect(shouldForwardErpCookies()).toBe(false);
      expect(getCombinedErpCookieHeader(request, "token")).toBe("");

      // But JSON passthrough should still work
      expect(shouldPassthroughJson(request)).toBe(true);
    });

    it("should handle edge case combinations", () => {
      const request = createMockRequest("https://example.com/api?isc_dataFormat=json", {
        cookie: "complex=cookie; with=multiple; parts=true",
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=complex123; Path=/; Secure");

      expect(shouldForwardErpCookies()).toBe(true);
      expect(shouldPassthroughJson(request)).toBe(true);

      expect(shouldForwardErpCookies()).toBe(true);
      expect(shouldPassthroughJson(request)).toBe(true);

      const cookieHeader = getCombinedErpCookieHeader(request, "test-token");
      expect(cookieHeader).toContain("complex=cookie");
      expect(cookieHeader).toContain("JSESSIONID=complex123");
    });
  });

  describe("getErpAuthHeaders", () => {
    const testToken = "test-jwt-token";
    const erpSessionCookie = "JSESSIONID=ABC123";
    const browserCookie = "user_pref=dark_mode; lang=en";

    beforeEach(() => {
      process.env.ERP_FORWARD_COOKIES = "true";
    });

    it("should return both cookieHeader and csrfToken with (request, token) signature", () => {
      const request = createMockRequest("https://example.com", { cookie: browserCookie });
      mockGetErpSessionCookie.mockReturnValue(erpSessionCookie);

      // Mock CSRF token
      const mockGetErpCsrfToken = sessionStore.getErpCsrfToken as jest.MockedFunction<
        typeof sessionStore.getErpCsrfToken
      >;
      mockGetErpCsrfToken.mockReturnValue("CSRF-TEST-123");

      const result = getErpAuthHeaders(request, testToken);
      expect(result).toEqual({
        cookieHeader: `${browserCookie}; ${erpSessionCookie}`,
        csrfToken: "CSRF-TEST-123",
      });
    });

    it("should return both cookieHeader and csrfToken with (token) signature", () => {
      mockGetErpSessionCookie.mockReturnValue(erpSessionCookie);

      const mockGetErpCsrfToken = sessionStore.getErpCsrfToken as jest.MockedFunction<
        typeof sessionStore.getErpCsrfToken
      >;
      mockGetErpCsrfToken.mockReturnValue("CSRF-TEST-456");

      const result = getErpAuthHeaders(testToken);
      expect(result).toEqual({
        cookieHeader: erpSessionCookie,
        csrfToken: "CSRF-TEST-456",
      });
    });

    it("should return null csrfToken when no token provided", () => {
      const request = createMockRequest("https://example.com", { cookie: browserCookie });

      const result = getErpAuthHeaders(request, null);
      expect(result).toEqual({
        cookieHeader: browserCookie,
        csrfToken: null,
      });
    });

    it("should handle request objects correctly", () => {
      const request = createMockRequest("https://example.com", { cookie: browserCookie });
      mockGetErpSessionCookie.mockReturnValue(erpSessionCookie);

      const mockGetErpCsrfToken = sessionStore.getErpCsrfToken as jest.MockedFunction<
        typeof sessionStore.getErpCsrfToken
      >;
      mockGetErpCsrfToken.mockReturnValue("CSRF-REQUEST-123");

      // Test with explicit request and token
      const result = getErpAuthHeaders(request, testToken);
      expect(result).toEqual({
        cookieHeader: `${browserCookie}; ${erpSessionCookie}`,
        csrfToken: "CSRF-REQUEST-123",
      });
    });
  });
});

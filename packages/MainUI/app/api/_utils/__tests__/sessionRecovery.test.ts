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

import { recoverSession, clearRecoveryAttempts, getRecoveryAttempts, isRecoveryActive } from "../sessionRecovery";
import * as sessionStore from "../sessionStore";

// Mock dependencies
jest.mock("../sessionStore");
jest.mock("../url", () => ({
  joinUrl: jest.fn((baseUrl: string | undefined, path: string) => {
    if (!baseUrl) return path;
    const cleanBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  }),
}));
jest.mock("@/utils/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    log: jest.fn(),
  },
}));

const mockSetErpSessionCookie = sessionStore.setErpSessionCookie as jest.MockedFunction<
  typeof sessionStore.setErpSessionCookie
>;
const mockGetErpSessionCookie = sessionStore.getErpSessionCookie as jest.MockedFunction<
  typeof sessionStore.getErpSessionCookie
>;
const mockClearErpSessionCookie = sessionStore.clearErpSessionCookie as jest.MockedFunction<
  typeof sessionStore.clearErpSessionCookie
>;

// Mock environment variables
const originalEnv = process.env;

describe("sessionRecovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Mock environment
    process.env = {
      ...originalEnv,
      ETENDO_CLASSIC_URL: "https://test-erp.example.com",
    };

    // Mock fetch
    global.fetch = jest.fn();

    // Clear recovery attempts
    clearRecoveryAttempts("test-token");
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe("recoverSession", () => {
    const testToken = "test-jwt-token";
    const mockJSessionId = "ABC123DEF456";

    beforeEach(() => {
      // Clear recovery attempts for this specific test token
      clearRecoveryAttempts(testToken);
    });

    it("should return error for missing token", async () => {
      const result = await recoverSession("");

      expect(result.success).toBe(false);
      expect(result.error).toBe("No user token provided");
    });

    it("should return error after max attempts", async () => {
      const maxAttemptsToken = "max-attempts-token";

      // Simulate max attempts reached
      for (let i = 0; i < 3; i++) {
        mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
        (global.fetch as jest.Mock).mockResolvedValue(new Response("", { status: 401 }));
        await recoverSession(maxAttemptsToken);
      }

      const result = await recoverSession(maxAttemptsToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Maximum recovery attempts exceeded");
    });

    it("should successfully recover session with token update", async () => {
      const newToken = "new-jwt-token-after-recovery";
      const mockResponse = new Response(JSON.stringify({ token: newToken }), {
        status: 200,
        headers: new Headers({
          "set-cookie": `JSESSIONID=${mockJSessionId}; Path=/; HttpOnly`,
        }),
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await recoverSession(testToken);

      expect(result.success).toBe(true);
      expect(result.newToken).toBe(newToken);

      // Verify old token was cleared and new token was stored
      expect(mockSetErpSessionCookie).toHaveBeenCalledWith(newToken, `JSESSIONID=${mockJSessionId}`);
      expect(mockClearErpSessionCookie).toHaveBeenCalledWith(testToken);

      // Verify recovery attempts were cleared
      expect(getRecoveryAttempts(testToken)).toBe(0);
    });

    it("should handle same token returned (no token update)", async () => {
      const mockResponse = new Response(JSON.stringify({ token: testToken }), {
        status: 200,
        headers: new Headers({
          "set-cookie": `JSESSIONID=${mockJSessionId}; Path=/; HttpOnly`,
        }),
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await recoverSession(testToken);

      expect(result.success).toBe(true);
      expect(result.newToken).toBeUndefined(); // No token update

      // Should not clear old token since it's the same
      expect(mockClearErpSessionCookie).not.toHaveBeenCalled();
    });

    it("should handle authentication failure", async () => {
      const authFailureToken = "auth-failure-token";
      const mockResponse = new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await recoverSession(authFailureToken);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Re-authentication failed: 401");
    });

    it("should handle missing token in response", async () => {
      const missingTokenTestToken = "missing-token-test";
      const mockResponse = new Response(JSON.stringify({}), {
        // No token field
        status: 200,
        headers: new Headers({
          "set-cookie": `JSESSIONID=${mockJSessionId}; Path=/; HttpOnly`,
        }),
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await recoverSession(missingTokenTestToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No token received in re-authentication response");
    });

    it("should handle network errors", async () => {
      const networkErrorToken = "network-error-token";
      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await recoverSession(networkErrorToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("should handle timeout", async () => {
      const timeoutToken = "timeout-token";
      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");

      // Mock fetch to simulate timeout
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((_, reject) => {
            const error = new Error("AbortError");
            error.name = "AbortError";
            reject(error);
          })
      );

      const result = await recoverSession(timeoutToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Session recovery timed out");
    }, 10000);

    it("should include current cookie in request headers", async () => {
      const cookieTestToken = "cookie-test-token";
      const currentCookie = "JSESSIONID=current123";
      const mockResponse = new Response(JSON.stringify({ token: cookieTestToken }), {
        status: 200,
        headers: new Headers({
          "set-cookie": `JSESSIONID=${mockJSessionId}; Path=/; HttpOnly`,
        }),
      });

      mockGetErpSessionCookie.mockReturnValue(currentCookie);
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await recoverSession(cookieTestToken);

      // Verify fetch was called with correct headers
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${cookieTestToken}`,
            Cookie: currentCookie,
          }),
        })
      );
    });

    it("should work without current cookie", async () => {
      const noCookieToken = "no-cookie-token";
      const mockResponse = new Response(JSON.stringify({ token: noCookieToken }), {
        status: 200,
        headers: new Headers({
          "set-cookie": `JSESSIONID=${mockJSessionId}; Path=/; HttpOnly`,
        }),
      });

      mockGetErpSessionCookie.mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await recoverSession(noCookieToken);

      expect(result.success).toBe(true);

      // Verify fetch was called without Cookie header
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Cookie: expect.any(String),
          }),
        })
      );
    });
  });

  describe("Parallel Request Handling", () => {
    const testToken = "test-jwt-token-parallel";

    it("should handle multiple parallel recovery requests efficiently", async () => {
      const newToken = "new-jwt-token-parallel";
      const mockResponse = new Response(JSON.stringify({ token: newToken }), {
        status: 200,
        headers: new Headers({
          "set-cookie": "JSESSIONID=new-session-cookie",
        }),
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      // Simulate 5 parallel requests
      const parallelPromises = Array(5)
        .fill(null)
        .map(() => recoverSession(testToken));

      // All should resolve successfully
      const results = await Promise.all(parallelPromises);

      // All results should be successful
      for (const result of results) {
        expect(result.success).toBe(true);
        expect(result.newToken).toBe(newToken);
      }

      // Only one actual fetch should have been made
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Recovery attempts should be cleared on success
      expect(getRecoveryAttempts(testToken)).toBe(0);
      expect(isRecoveryActive(testToken)).toBe(false);
    });

    it("should properly increment failure count only on real failures", async () => {
      const failureTestToken = "failure-test-token";
      const mockFailureResponse = new Response(JSON.stringify({ error: "Authentication failed" }), {
        status: 401,
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(mockFailureResponse);

      // First failed attempt
      const result1 = await recoverSession(failureTestToken);
      expect(result1.success).toBe(false);
      expect(getRecoveryAttempts(failureTestToken)).toBe(1);

      // Second failed attempt
      const result2 = await recoverSession(failureTestToken);
      expect(result2.success).toBe(false);
      expect(getRecoveryAttempts(failureTestToken)).toBe(2);

      // Third failed attempt
      const result3 = await recoverSession(failureTestToken);
      expect(result3.success).toBe(false);
      expect(getRecoveryAttempts(failureTestToken)).toBe(3);

      // Fourth attempt should be blocked
      const result4 = await recoverSession(failureTestToken);
      expect(result4.success).toBe(false);
      expect(result4.error).toBe("Maximum recovery attempts exceeded");
      expect(getRecoveryAttempts(failureTestToken)).toBe(3); // Should not increment further

      // Verify fetch was called only 3 times (not for the blocked attempt)
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it("should handle timeout errors", async () => {
      const timeoutErrorToken = "timeout-error-token";
      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");

      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          const error = new Error("Request timeout");
          error.name = "AbortError";
          reject(error);
        });
      });

      const result = await recoverSession(timeoutErrorToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Session recovery timed out");
    });
  });

  describe("isRecoveryActive", () => {
    const testToken = "test-jwt-token-active";

    it("should correctly report recovery status during operation", async () => {
      const newToken = "new-token";
      const mockResponse = new Response(JSON.stringify({ token: newToken }), {
        status: 200,
        headers: new Headers({
          "set-cookie": "JSESSIONID=new-session",
        }),
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100));
      });

      // Start recovery (but don't await)
      const recoveryPromise = recoverSession(testToken);

      // Should be active
      expect(isRecoveryActive(testToken)).toBe(true);

      // Wait for completion
      await recoveryPromise;

      // Should no longer be active
      expect(isRecoveryActive(testToken)).toBe(false);
    });

    it("should return false for non-active recoveries", () => {
      expect(isRecoveryActive("non-existent-token")).toBe(false);
    });
  });

  describe("clearRecoveryAttempts", () => {
    it("should reset attempt counter and clear active recovery", async () => {
      const clearTestToken = "clear-test-token";

      // Make a failed attempt
      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(new Response("", { status: 401 }));
      await recoverSession(clearTestToken);

      expect(getRecoveryAttempts(clearTestToken)).toBe(1);

      clearRecoveryAttempts(clearTestToken);
      expect(getRecoveryAttempts(clearTestToken)).toBe(0);
      expect(isRecoveryActive(clearTestToken)).toBe(false);
    });
  });

  describe("getRecoveryAttempts", () => {
    it("should return 0 for new token", () => {
      expect(getRecoveryAttempts("new-token")).toBe(0);
    });

    it("should return correct attempt count", async () => {
      const attemptsTestToken = "attempts-test-token";

      // Make a failed attempt
      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(new Response("", { status: 401 }));
      await recoverSession(attemptsTestToken);

      expect(getRecoveryAttempts(attemptsTestToken)).toBe(1);
    });
  });
});

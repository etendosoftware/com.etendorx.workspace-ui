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

import { recoverSession, clearRecoveryAttempts, getRecoveryAttempts } from "../sessionRecovery";
import * as sessionStore from "../sessionStore";

// Mock dependencies
jest.mock("../sessionStore");
jest.mock("../url");

const mockSetErpSessionCookie = sessionStore.setErpSessionCookie as jest.MockedFunction<typeof sessionStore.setErpSessionCookie>;
const mockGetErpSessionCookie = sessionStore.getErpSessionCookie as jest.MockedFunction<typeof sessionStore.getErpSessionCookie>;

// Mock environment variables
const originalEnv = process.env;

describe("sessionRecovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    
    // Mock environment
    process.env = {
      ...originalEnv,
      ETENDO_CLASSIC_URL: "https://test-erp.example.com"
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

    it("should return error for missing token", async () => {
      const result = await recoverSession("");
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("No user token provided");
    });

    it("should return error after max attempts", async () => {
      // Simulate max attempts reached
      for (let i = 0; i < 3; i++) {
        mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
        (global.fetch as jest.Mock).mockResolvedValue(new Response("", { status: 401 }));
        await recoverSession(testToken);
      }

      const result = await recoverSession(testToken);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Maximum recovery attempts exceeded");
    });

    it("should successfully recover session with new JSESSIONID", async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: new Headers({
          "set-cookie": `JSESSIONID=${mockJSessionId}; Path=/; HttpOnly`
        })
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await recoverSession(testToken);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      
      // Verify session store was updated
      expect(mockSetErpSessionCookie).toHaveBeenCalledWith(testToken, `JSESSIONID=${mockJSessionId}`);
      
      // Verify recovery attempts were cleared
      expect(getRecoveryAttempts(testToken)).toBe(0);
    });

    it("should handle authentication failure", async () => {
      const mockResponse = new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await recoverSession(testToken);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Re-authentication failed: 401");
    });

    it("should handle missing JSESSIONID in response", async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: new Headers() // No set-cookie header
      });

      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await recoverSession(testToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No JSESSIONID received in re-authentication response");
    });

    it("should handle network errors", async () => {
      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

      const result = await recoverSession(testToken);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("should handle timeout", async () => {
      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      
      // Mock fetch to simulate timeout
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("AbortError")), 100);
        })
      );

      const result = await recoverSession(testToken);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    }, 10000);

    it("should include current cookie in request headers", async () => {
      const currentCookie = "JSESSIONID=current123";
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: new Headers({
          "set-cookie": `JSESSIONID=${mockJSessionId}; Path=/; HttpOnly`
        })
      });

      mockGetErpSessionCookie.mockReturnValue(currentCookie);
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await recoverSession(testToken);

      // Verify fetch was called with correct headers
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${testToken}`,
            Cookie: currentCookie
          })
        })
      );
    });

    it("should work without current cookie", async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: new Headers({
          "set-cookie": `JSESSIONID=${mockJSessionId}; Path=/; HttpOnly`
        })
      });

      mockGetErpSessionCookie.mockReturnValue(null);
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await recoverSession(testToken);

      expect(result.success).toBe(true);
      
      // Verify fetch was called without Cookie header
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Cookie: expect.any(String)
          })
        })
      );
    });
  });

  describe("clearRecoveryAttempts", () => {
    it("should reset attempt counter", async () => {
      const testToken = "test-token";
      
      // Make a failed attempt
      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(new Response("", { status: 401 }));
      await recoverSession(testToken);
      
      expect(getRecoveryAttempts(testToken)).toBe(1);
      
      clearRecoveryAttempts(testToken);
      expect(getRecoveryAttempts(testToken)).toBe(0);
    });
  });

  describe("getRecoveryAttempts", () => {
    it("should return 0 for new token", () => {
      expect(getRecoveryAttempts("new-token")).toBe(0);
    });

    it("should return correct attempt count", async () => {
      const testToken = "test-token";
      
      // Make a failed attempt
      mockGetErpSessionCookie.mockReturnValue("JSESSIONID=old");
      (global.fetch as jest.Mock).mockResolvedValue(new Response("", { status: 401 }));
      await recoverSession(testToken);
      
      expect(getRecoveryAttempts(testToken)).toBe(1);
    });
  });
});
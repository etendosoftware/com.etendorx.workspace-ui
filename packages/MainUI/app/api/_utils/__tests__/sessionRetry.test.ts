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

import { executeWithSessionRetry } from "../sessionRetry";
import * as sessionValidator from "../sessionValidator";
import * as sessionRecovery from "../sessionRecovery";
import * as forwardConfig from "../forwardConfig";
import type { NextRequest } from "next/server";

// Mock dependencies
jest.mock("../sessionValidator");
jest.mock("../sessionRecovery");
jest.mock("../forwardConfig");

// Mock NextRequest by creating a simple object with the properties we need
const createMockRequest = (url: string, init?: { method?: string; headers?: Record<string, string> }) => {
  const mockHeaders = {
    get: (key: string) => init?.headers?.[key] || init?.headers?.[key.toLowerCase()],
    set: jest.fn(),
    has: jest.fn(),
    delete: jest.fn(),
    forEach: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
  };

  return {
    url,
    method: init?.method || "GET",
    headers: mockHeaders,
    cookies: {
      get: jest.fn(),
      getAll: jest.fn(),
      has: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    },
    nextUrl: { pathname: "/api/test", searchParams: new URLSearchParams() },
    json: jest.fn(),
    text: jest.fn(),
    formData: jest.fn(),
    arrayBuffer: jest.fn(),
    clone: jest.fn(),
  } as unknown as NextRequest;
};

const mockIsSessionExpired = sessionValidator.isSessionExpired as jest.MockedFunction<
  typeof sessionValidator.isSessionExpired
>;
const mockShouldAttemptRecovery = sessionValidator.shouldAttemptRecovery as jest.MockedFunction<
  typeof sessionValidator.shouldAttemptRecovery
>;
const mockRecoverSession = sessionRecovery.recoverSession as jest.MockedFunction<typeof sessionRecovery.recoverSession>;
const mockGetCombinedErpCookieHeader = forwardConfig.getCombinedErpCookieHeader as jest.MockedFunction<
  typeof forwardConfig.getCombinedErpCookieHeader
>;

describe("sessionRetry", () => {
  const testToken = "test-jwt-token";
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock NextRequest
    mockRequest = createMockRequest("https://example.com/api/test", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testToken}`,
        "Content-Type": "application/json",
      },
    });

    // Default mock behaviors
    mockGetCombinedErpCookieHeader.mockReturnValue("JSESSIONID=test123");
  });

  describe("executeWithSessionRetry", () => {
    it("should return success on first attempt when session is valid", async () => {
      const mockData = { result: "success" };
      const mockResponse = new Response(JSON.stringify(mockData), { status: 200 });

      const requestFn = jest.fn().mockResolvedValue({
        response: mockResponse,
        data: mockData,
      });

      mockIsSessionExpired.mockReturnValue(false);

      const result = await executeWithSessionRetry(mockRequest, testToken, requestFn);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.recovered).toBeUndefined();
      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(mockRecoverSession).not.toHaveBeenCalled();
    });

    it("should return error when session is expired but recovery not recommended", async () => {
      const mockData = { error: "Forbidden" };
      const mockResponse = new Response(JSON.stringify(mockData), { status: 403 });

      const requestFn = jest.fn().mockResolvedValue({
        response: mockResponse,
        data: mockData,
      });

      mockIsSessionExpired.mockReturnValue(true);
      mockShouldAttemptRecovery.mockReturnValue(false);

      const result = await executeWithSessionRetry(mockRequest, testToken, requestFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Request failed with status 403");
      expect(result.data).toEqual(mockData);
      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(mockRecoverSession).not.toHaveBeenCalled();
    });

    it("should successfully recover session and retry request", async () => {
      const expiredData = { error: "Session expired" };
      const expiredResponse = new Response(JSON.stringify(expiredData), { status: 401 });

      const successData = { result: "success after recovery" };
      const successResponse = new Response(JSON.stringify(successData), { status: 200 });

      const requestFn = jest
        .fn()
        .mockResolvedValueOnce({
          response: expiredResponse,
          data: expiredData,
        })
        .mockResolvedValueOnce({
          response: successResponse,
          data: successData,
        });

      mockIsSessionExpired
        .mockReturnValueOnce(true) // First call - session expired
        .mockReturnValueOnce(false); // Second call - session valid

      mockShouldAttemptRecovery.mockReturnValue(true);
      mockRecoverSession.mockResolvedValue({ success: true });

      const result = await executeWithSessionRetry(mockRequest, testToken, requestFn);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(successData);
      expect(result.recovered).toBe(true);
      expect(requestFn).toHaveBeenCalledTimes(2);
      expect(mockRecoverSession).toHaveBeenCalledWith(testToken);
    });

    it("should return error when session recovery fails", async () => {
      const expiredData = { error: "Session expired" };
      const expiredResponse = new Response(JSON.stringify(expiredData), { status: 401 });

      const requestFn = jest.fn().mockResolvedValue({
        response: expiredResponse,
        data: expiredData,
      });

      mockIsSessionExpired.mockReturnValue(true);
      mockShouldAttemptRecovery.mockReturnValue(true);
      mockRecoverSession.mockResolvedValue({
        success: false,
        error: "Recovery failed",
      });

      const result = await executeWithSessionRetry(mockRequest, testToken, requestFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Session recovery failed: Recovery failed");
      expect(result.data).toEqual(expiredData);
      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(mockRecoverSession).toHaveBeenCalledWith(testToken);
    });

    it("should return error when retry fails after successful recovery", async () => {
      const expiredData = { error: "Session expired" };
      const expiredResponse = new Response(JSON.stringify(expiredData), { status: 401 });

      const requestFn = jest
        .fn()
        .mockResolvedValueOnce({
          response: expiredResponse,
          data: expiredData,
        })
        .mockResolvedValueOnce({
          response: expiredResponse,
          data: expiredData,
        });

      mockIsSessionExpired.mockReturnValue(true);
      mockShouldAttemptRecovery.mockReturnValue(true);
      mockRecoverSession.mockResolvedValue({ success: true });

      const result = await executeWithSessionRetry(mockRequest, testToken, requestFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Request failed even after session recovery");
      expect(result.data).toEqual(expiredData);
      expect(requestFn).toHaveBeenCalledTimes(2);
      expect(mockRecoverSession).toHaveBeenCalledWith(testToken);
    });

    it("should handle request function errors", async () => {
      const requestFn = jest.fn().mockRejectedValue(new Error("Network error"));

      const result = await executeWithSessionRetry(mockRequest, testToken, requestFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(mockRecoverSession).not.toHaveBeenCalled();
    });

    it("should handle session recovery errors", async () => {
      const expiredData = { error: "Session expired" };
      const expiredResponse = new Response(JSON.stringify(expiredData), { status: 401 });

      const requestFn = jest.fn().mockResolvedValue({
        response: expiredResponse,
        data: expiredData,
      });

      mockIsSessionExpired.mockReturnValue(true);
      mockShouldAttemptRecovery.mockReturnValue(true);
      mockRecoverSession.mockRejectedValue(new Error("Recovery error"));

      const result = await executeWithSessionRetry(mockRequest, testToken, requestFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Recovery error");
      expect(requestFn).toHaveBeenCalledTimes(1);
    });

    it("should call getCombinedErpCookieHeader for each request attempt", async () => {
      const expiredData = { error: "Session expired" };
      const expiredResponse = new Response(JSON.stringify(expiredData), { status: 401 });

      const successData = { result: "success" };
      const successResponse = new Response(JSON.stringify(successData), { status: 200 });

      const requestFn = jest
        .fn()
        .mockResolvedValueOnce({
          response: expiredResponse,
          data: expiredData,
        })
        .mockResolvedValueOnce({
          response: successResponse,
          data: successData,
        });

      mockIsSessionExpired.mockReturnValueOnce(true).mockReturnValueOnce(false);

      mockShouldAttemptRecovery.mockReturnValue(true);
      mockRecoverSession.mockResolvedValue({ success: true });

      await executeWithSessionRetry(mockRequest, testToken, requestFn);

      // Should be called twice - once for initial attempt, once for retry
      expect(mockGetCombinedErpCookieHeader).toHaveBeenCalledTimes(2);
      expect(mockGetCombinedErpCookieHeader).toHaveBeenCalledWith(mockRequest, testToken);
    });
  });
});

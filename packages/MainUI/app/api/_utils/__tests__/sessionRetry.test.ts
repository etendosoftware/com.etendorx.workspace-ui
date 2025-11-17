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

import { executeWithSessionAndCsrfRetry } from "../sessionRetryWithCsrf";
import * as sessionValidator from "../sessionValidator";
import * as sessionRecovery from "../sessionRecovery";
import * as forwardConfig from "../forwardConfig";
import type { NextRequest } from "next/server";
import { createMockRequest } from "../../../../utils/tests/mockHelpers";

// Mock dependencies
jest.mock("../sessionValidator");
jest.mock("../sessionRecovery");
jest.mock("../forwardConfig");
jest.mock("@/utils/logger");

const mockIsSessionExpired = sessionValidator.isSessionExpired as jest.MockedFunction<
  typeof sessionValidator.isSessionExpired
>;
const mockShouldAttemptRecovery = sessionValidator.shouldAttemptRecovery as jest.MockedFunction<
  typeof sessionValidator.shouldAttemptRecovery
>;
const mockRecoverSession = sessionRecovery.recoverSession as jest.MockedFunction<typeof sessionRecovery.recoverSession>;
const mockGetErpAuthHeaders = forwardConfig.getErpAuthHeaders as jest.MockedFunction<
  typeof forwardConfig.getErpAuthHeaders
>;

// Mock logger methods
const mockLogger = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Apply the mock to the module
jest.mocked(require("@/utils/logger")).logger = mockLogger;

describe("sessionRetryWithCsrf", () => {
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
    mockGetErpAuthHeaders.mockReturnValue({
      cookieHeader: "JSESSIONID=test123",
      csrfToken: "CSRF-TEST-123",
    });

    // Reset logger mocks
    mockLogger.log.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.info.mockClear();
    mockLogger.debug.mockClear();
  });

  describe("executeWithSessionAndCsrfRetry", () => {
    it("should return success on first attempt when session is valid", async () => {
      const mockData = { result: "success" };
      const mockResponse = new Response(JSON.stringify(mockData), { status: 200 });

      const requestFn = jest.fn().mockResolvedValue({
        response: mockResponse,
        data: mockData,
      });

      mockIsSessionExpired.mockReturnValue(false);

      const result = await executeWithSessionAndCsrfRetry(mockRequest, testToken, requestFn);

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

      const result = await executeWithSessionAndCsrfRetry(mockRequest, testToken, requestFn);

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

      const result = await executeWithSessionAndCsrfRetry(mockRequest, testToken, requestFn);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(successData);
      expect(result.recovered).toBe(true);
      expect(requestFn).toHaveBeenCalledTimes(2);
      expect(mockRecoverSession).toHaveBeenCalledWith(testToken);

      // Verify logger calls
      expect(mockLogger.log).toHaveBeenCalledWith("Session expired, attempting traditional session recovery");
      expect(mockLogger.log).toHaveBeenCalledWith("Traditional session recovery and retry successful");
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

      const result = await executeWithSessionAndCsrfRetry(mockRequest, testToken, requestFn);

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

      const result = await executeWithSessionAndCsrfRetry(mockRequest, testToken, requestFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Request failed even after session recovery");
      expect(result.data).toEqual(expiredData);
      expect(requestFn).toHaveBeenCalledTimes(2);
      expect(mockRecoverSession).toHaveBeenCalledWith(testToken);
    });

    it("should handle request function errors", async () => {
      const requestError = new Error("Network error");
      const requestFn = jest.fn().mockRejectedValue(requestError);

      const result = await executeWithSessionAndCsrfRetry(mockRequest, testToken, requestFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
      expect(requestFn).toHaveBeenCalledTimes(1);
      expect(mockRecoverSession).not.toHaveBeenCalled();

      // Verify error logging
      expect(mockLogger.error).toHaveBeenCalledWith("Error in enhanced session retry logic:", requestError);
    });

    it("should handle session recovery errors", async () => {
      const expiredData = { error: "Session expired" };
      const expiredResponse = new Response(JSON.stringify(expiredData), { status: 401 });

      const requestFn = jest.fn().mockResolvedValue({
        response: expiredResponse,
        data: expiredData,
      });

      const recoveryError = new Error("Recovery error");
      mockIsSessionExpired.mockReturnValue(true);
      mockShouldAttemptRecovery.mockReturnValue(true);
      mockRecoverSession.mockRejectedValue(recoveryError);

      const result = await executeWithSessionAndCsrfRetry(mockRequest, testToken, requestFn);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Recovery error");
      expect(requestFn).toHaveBeenCalledTimes(1);

      // Verify both attempt recovery log and error log
      expect(mockLogger.log).toHaveBeenCalledWith("Session expired, attempting traditional session recovery");
      expect(mockLogger.error).toHaveBeenCalledWith("Error in enhanced session retry logic:", recoveryError);
    });

    it("should call getErpAuthHeaders for each request attempt", async () => {
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

      await executeWithSessionAndCsrfRetry(mockRequest, testToken, requestFn);

      // Should be called twice - once for initial attempt, once for retry
      expect(mockGetErpAuthHeaders).toHaveBeenCalledTimes(2);
      expect(mockGetErpAuthHeaders).toHaveBeenCalledWith(mockRequest, testToken);
    });
  });
});

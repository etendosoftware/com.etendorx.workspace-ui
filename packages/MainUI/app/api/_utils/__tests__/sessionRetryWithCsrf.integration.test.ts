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

/*
 * Integration tests for CSRF-enhanced session retry
 */

import { executeWithSessionAndCsrfRetry } from "../sessionRetryWithCsrf";
import { DEFAULT_CSRF_TOKEN_ERROR } from "../../../../utils/session/constants";

// Mock dependencies
jest.mock("../sessionValidator");
jest.mock("../sessionRecovery");
jest.mock("../csrfRecovery");
jest.mock("../forwardConfig");

// Mock logger
jest.mock("@/utils/logger", () => ({
    logger: {
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

const mockShouldAttemptCsrfRecovery = require("../sessionValidator").shouldAttemptCsrfRecovery as jest.Mock;
const mockIsSessionExpired = require("../sessionValidator").isSessionExpired as jest.Mock;
const mockShouldAttemptRecovery = require("../sessionValidator").shouldAttemptRecovery as jest.Mock;
const mockRecoverFromCsrfError = require("../csrfRecovery").recoverFromCsrfError as jest.Mock;
const mockRecoverSession = require("../sessionRecovery").recoverSession as jest.Mock;
const mockGetErpAuthHeaders = require("../forwardConfig").getErpAuthHeaders as jest.Mock;

describe("sessionRetryWithCsrf integration", () => {
    const mockRequest = {
        headers: new Map([["authorization", "Bearer test-token"]])
    } as any;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetErpAuthHeaders.mockReturnValue({ cookieHeader: "JSESSIONID=test", csrfToken: "csrf-123" });
        mockIsSessionExpired.mockReturnValue(false);
        mockShouldAttemptRecovery.mockReturnValue(false);
    });

    it("should successfully recover from CSRF error and retry", async () => {
        let callCount = 0;
        const mockRequestFn = jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
                // First call returns CSRF error
                return Promise.resolve({
                    response: { status: 200 },
                    data: { response: { error: { message: DEFAULT_CSRF_TOKEN_ERROR } } }
                });
            } else {
                // Second call (after recovery) succeeds
                return Promise.resolve({
                    response: { status: 200 },
                    data: { success: true }
                });
            }
        });

        // Mock CSRF error detection
        mockShouldAttemptCsrfRecovery
            .mockReturnValueOnce(true)  // First response triggers CSRF recovery
            .mockReturnValueOnce(false); // Retry response is successful

        // Mock successful CSRF recovery
        mockRecoverFromCsrfError.mockResolvedValue({
            success: true,
            sessionUpdated: true
        });

        const result = await executeWithSessionAndCsrfRetry(
            mockRequest,
            "test-token",
            mockRequestFn
        );

        expect(result).toEqual({
            success: true,
            data: { success: true },
            recovered: true,
            csrfRecovered: true
        });

        expect(mockRequestFn).toHaveBeenCalledTimes(2);
        expect(mockRecoverFromCsrfError).toHaveBeenCalledTimes(1);
    });

    it("should fail when CSRF recovery fails", async () => {
        const mockRequestFn = jest.fn().mockResolvedValue({
            response: { status: 200 },
            data: { response: { error: { message: DEFAULT_CSRF_TOKEN_ERROR } } }
        });

        mockShouldAttemptCsrfRecovery.mockReturnValue(true);
        mockRecoverFromCsrfError.mockResolvedValue({
            success: false,
            sessionUpdated: false,
            error: "Failed to extract session"
        });

        const result = await executeWithSessionAndCsrfRetry(
            mockRequest,
            "test-token",
            mockRequestFn
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain("CSRF recovery failed");
        expect(mockRequestFn).toHaveBeenCalledTimes(1);
    });

    it("should proceed with traditional session recovery when no CSRF error", async () => {
        let callCount = 0;
        const mockRequestFn = jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
                // First call returns session expired error
                return Promise.resolve({
                    response: { status: 401 },
                    data: { error: "Session expired" }
                });
            } else {
                // Second call (after recovery) succeeds
                return Promise.resolve({
                    response: { status: 200 },
                    data: { success: true }
                });
            }
        });

        // Mock session expiration detection
        mockShouldAttemptCsrfRecovery.mockReturnValue(false); // No CSRF error
        mockIsSessionExpired.mockReturnValueOnce(true).mockReturnValueOnce(false); // Session expired, then recovered
        mockShouldAttemptRecovery.mockReturnValue(true); // Should attempt traditional recovery

        // Mock successful traditional session recovery
        mockRecoverSession.mockResolvedValue({
            success: true,
            newToken: "new-test-token"
        });

        const result = await executeWithSessionAndCsrfRetry(
            mockRequest,
            "test-token",
            mockRequestFn
        );

        expect(result).toEqual({
            success: true,
            data: { success: true },
            recovered: true,
            newToken: "new-test-token"
        });

        expect(mockRequestFn).toHaveBeenCalledTimes(2);
        expect(mockRecoverSession).toHaveBeenCalledTimes(1);
    });

    it("should return success immediately for successful requests", async () => {
        const mockRequestFn = jest.fn().mockResolvedValue({
            response: { status: 200 },
            data: { success: true }
        });

        mockShouldAttemptCsrfRecovery.mockReturnValue(false);
        mockIsSessionExpired.mockReturnValue(false);

        const result = await executeWithSessionAndCsrfRetry(
            mockRequest,
            "test-token",
            mockRequestFn
        );

        expect(result).toEqual({
            success: true,
            data: { success: true }
        });

        expect(mockRequestFn).toHaveBeenCalledTimes(1);
        expect(mockRecoverFromCsrfError).not.toHaveBeenCalled();
        expect(mockRecoverSession).not.toHaveBeenCalled();
    });

    it("should handle CSRF recovery that still fails after retry", async () => {
        const mockRequestFn = jest.fn().mockResolvedValue({
            response: { status: 200 },
            data: { response: { error: { message: DEFAULT_CSRF_TOKEN_ERROR } } }
        });

        // Both initial and retry attempts return CSRF error
        mockShouldAttemptCsrfRecovery.mockReturnValue(true);

        // Mock successful CSRF recovery
        mockRecoverFromCsrfError.mockResolvedValue({
            success: true,
            sessionUpdated: true
        });

        const result = await executeWithSessionAndCsrfRetry(
            mockRequest,
            "test-token",
            mockRequestFn
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Request failed even after CSRF recovery");
        expect(mockRequestFn).toHaveBeenCalledTimes(2); // Initial + retry
    });

    it("should handle traditional session recovery that fails", async () => {
        const mockRequestFn = jest.fn().mockResolvedValue({
            response: { status: 401 },
            data: { error: "Session expired" }
        });

        mockShouldAttemptCsrfRecovery.mockReturnValue(false);
        mockIsSessionExpired.mockReturnValue(true);
        mockShouldAttemptRecovery.mockReturnValue(true);

        // Mock failed traditional session recovery
        mockRecoverSession.mockResolvedValue({
            success: false,
            error: "Failed to re-authenticate"
        });

        const result = await executeWithSessionAndCsrfRetry(
            mockRequest,
            "test-token",
            mockRequestFn
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain("Session recovery failed");
        expect(mockRequestFn).toHaveBeenCalledTimes(1);
    });

    it("should handle errors from request function gracefully", async () => {
        const mockRequestFn = jest.fn().mockRejectedValue(new Error("Network error"));

        const result = await executeWithSessionAndCsrfRetry(
            mockRequest,
            "test-token",
            mockRequestFn
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Network error");
    });

    it("should prioritize CSRF recovery over traditional session recovery", async () => {
        const mockRequestFn = jest.fn().mockResolvedValue({
            response: { status: 200 }, // 200 status but with CSRF error
            data: { response: { error: { message: DEFAULT_CSRF_TOKEN_ERROR } } }
        });

        // Both CSRF and session recovery could be triggered
        mockShouldAttemptCsrfRecovery.mockReturnValue(true);
        mockIsSessionExpired.mockReturnValue(true);
        mockShouldAttemptRecovery.mockReturnValue(true);

        mockRecoverFromCsrfError.mockResolvedValue({
            success: true,
            sessionUpdated: true
        });

        await executeWithSessionAndCsrfRetry(
            mockRequest,
            "test-token",
            mockRequestFn
        );

        // CSRF recovery should be called, but not traditional session recovery
        expect(mockRecoverFromCsrfError).toHaveBeenCalledTimes(1);
        expect(mockRecoverSession).not.toHaveBeenCalled();
    });
});
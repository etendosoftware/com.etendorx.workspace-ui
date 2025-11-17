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
 * Additional tests for CSRF-enhanced session validation
 */

import {
    classifySessionError,
    shouldAttemptCsrfRecovery
} from "../sessionValidator";
import { DEFAULT_CSRF_TOKEN_ERROR } from "../../../../utils/session/constants";

// Mock the csrfRecovery module
jest.mock("../csrfRecovery", () => ({
    isInvalidCsrfTokenError: jest.fn()
}));

const mockIsInvalidCsrfTokenError = require("../csrfRecovery").isInvalidCsrfTokenError as jest.Mock;

describe("sessionValidator CSRF enhancements", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("classifySessionError", () => {
        it("should classify InvalidCSRFToken error correctly", () => {
            const response = { status: 200 } as Response;
            const data = {
                response: {
                    error: {
                        message: DEFAULT_CSRF_TOKEN_ERROR
                    }
                }
            };

            // Mock the CSRF error detection
            mockIsInvalidCsrfTokenError.mockReturnValue(true);

            const result = classifySessionError(response, data);

            expect(result).toEqual({
                isSessionExpired: false, // 200 status shouldn't trigger session expired
                isInvalidCsrf: true,
                isRecoverable: true
            });
            expect(mockIsInvalidCsrfTokenError).toHaveBeenCalledWith(data);
        });

        it("should classify session expired error correctly", () => {
            const response = { status: 401 } as Response;
            const data = {};

            mockIsInvalidCsrfTokenError.mockReturnValue(false);

            const result = classifySessionError(response, data);

            expect(result).toEqual({
                isSessionExpired: true,
                isInvalidCsrf: false,
                isRecoverable: true
            });
        });

        it("should classify non-recoverable errors correctly", () => {
            const response = { status: 500 } as Response;
            const data = {
                response: {
                    error: {
                        message: "Database error"
                    }
                }
            };

            mockIsInvalidCsrfTokenError.mockReturnValue(false);

            const result = classifySessionError(response, data);

            expect(result).toEqual({
                isSessionExpired: false,
                isInvalidCsrf: false,
                isRecoverable: false
            });
        });

        it("should classify both session expired and CSRF error as recoverable", () => {
            const response = { status: 401 } as Response;
            const data = {
                response: {
                    error: {
                        message: DEFAULT_CSRF_TOKEN_ERROR
                    }
                }
            };

            mockIsInvalidCsrfTokenError.mockReturnValue(true);

            const result = classifySessionError(response, data);

            expect(result).toEqual({
                isSessionExpired: true,
                isInvalidCsrf: true,
                isRecoverable: true
            });
        });

        it("should handle 403 Forbidden as session expired", () => {
            const response = { status: 403 } as Response;
            const data = {};

            mockIsInvalidCsrfTokenError.mockReturnValue(false);

            const result = classifySessionError(response, data);

            expect(result).toEqual({
                isSessionExpired: true,
                isInvalidCsrf: false,
                isRecoverable: true
            });
        });

        it("should handle successful responses without errors", () => {
            const response = { status: 200 } as Response;
            const data = { success: true };

            mockIsInvalidCsrfTokenError.mockReturnValue(false);

            const result = classifySessionError(response, data);

            expect(result).toEqual({
                isSessionExpired: false,
                isInvalidCsrf: false,
                isRecoverable: false
            });
        });
    });

    describe("shouldAttemptCsrfRecovery", () => {
        it("should return true for 200 status with InvalidCSRFToken", () => {
            const response = { status: 200 } as Response;
            const data = {
                response: {
                    error: {
                        message: DEFAULT_CSRF_TOKEN_ERROR
                    }
                }
            };

            mockIsInvalidCsrfTokenError.mockReturnValue(true);

            expect(shouldAttemptCsrfRecovery(response, data)).toBe(true);
            expect(mockIsInvalidCsrfTokenError).toHaveBeenCalledWith(data);
        });

        it("should return false for non-200 status even with InvalidCSRFToken", () => {
            const response = { status: 401 } as Response;
            const data = {
                response: {
                    error: {
                        message: DEFAULT_CSRF_TOKEN_ERROR
                    }
                }
            };

            mockIsInvalidCsrfTokenError.mockReturnValue(true);

            expect(shouldAttemptCsrfRecovery(response, data)).toBe(false);
        });

        it("should return false for 200 status without InvalidCSRFToken", () => {
            const response = { status: 200 } as Response;
            const data = {
                response: {
                    error: {
                        message: "Other error"
                    }
                }
            };

            mockIsInvalidCsrfTokenError.mockReturnValue(false);

            expect(shouldAttemptCsrfRecovery(response, data)).toBe(false);
            expect(mockIsInvalidCsrfTokenError).toHaveBeenCalledWith(data);
        });

        it("should return false for 500 status", () => {
            const response = { status: 500 } as Response;
            const data = {};

            mockIsInvalidCsrfTokenError.mockReturnValue(false);

            expect(shouldAttemptCsrfRecovery(response, data)).toBe(false);
        });

        it("should return false for 404 status", () => {
            const response = { status: 404 } as Response;
            const data = {};

            mockIsInvalidCsrfTokenError.mockReturnValue(false);

            expect(shouldAttemptCsrfRecovery(response, data)).toBe(false);
        });

        it("should return false for 201 status even with CSRF error", () => {
            const response = { status: 201 } as Response;
            const data = {};

            mockIsInvalidCsrfTokenError.mockReturnValue(true);

            expect(shouldAttemptCsrfRecovery(response, data)).toBe(false);
        });

        it("should handle edge cases gracefully", () => {
            const response = { status: 200 } as Response;

            // Test with null data
            mockIsInvalidCsrfTokenError.mockReturnValue(false);
            expect(shouldAttemptCsrfRecovery(response, null)).toBe(false);

            // Test with undefined data
            expect(shouldAttemptCsrfRecovery(response, undefined)).toBe(false);

            // Test with empty object
            expect(shouldAttemptCsrfRecovery(response, {})).toBe(false);
        });

        it("should work correctly with different status codes", () => {
            const testCases = [
                { status: 100, expected: false },
                { status: 199, expected: false },
                { status: 200, expected: true },
                { status: 201, expected: false },
                { status: 300, expected: false },
                { status: 400, expected: false },
                { status: 401, expected: false },
                { status: 403, expected: false },
                { status: 404, expected: false },
                { status: 500, expected: false }
            ];

            mockIsInvalidCsrfTokenError.mockReturnValue(true);

            testCases.forEach(({ status, expected }) => {
                const response = { status } as Response;
                const data = {};

                expect(shouldAttemptCsrfRecovery(response, data)).toBe(expected);
            });
        });
    });

    describe("integration with isInvalidCsrfTokenError", () => {
        it("should correctly integrate with CSRF error detection", () => {
            const response = { status: 200 } as Response;
            const validCsrfData = {
                response: {
                    error: {
                        message: DEFAULT_CSRF_TOKEN_ERROR
                    }
                }
            };
            const invalidCsrfData = {
                response: {
                    error: {
                        message: "Different error"
                    }
                }
            };

            // Test with valid CSRF error
            mockIsInvalidCsrfTokenError.mockReturnValueOnce(true);
            expect(shouldAttemptCsrfRecovery(response, validCsrfData)).toBe(true);

            // Test with invalid CSRF error
            mockIsInvalidCsrfTokenError.mockReturnValueOnce(false);
            expect(shouldAttemptCsrfRecovery(response, invalidCsrfData)).toBe(false);

            expect(mockIsInvalidCsrfTokenError).toHaveBeenCalledTimes(2);
            expect(mockIsInvalidCsrfTokenError).toHaveBeenNthCalledWith(1, validCsrfData);
            expect(mockIsInvalidCsrfTokenError).toHaveBeenNthCalledWith(2, invalidCsrfData);
        });

        it("should handle errors from CSRF detection gracefully", () => {
            const response = { status: 200 } as Response;
            const data = {};

            mockIsInvalidCsrfTokenError.mockImplementation(() => {
                throw new Error("CSRF detection failed");
            });

            // Should not throw error and return false
            expect(() => shouldAttemptCsrfRecovery(response, data)).not.toThrow();
            expect(shouldAttemptCsrfRecovery(response, data)).toBe(false);
        });
    });
});
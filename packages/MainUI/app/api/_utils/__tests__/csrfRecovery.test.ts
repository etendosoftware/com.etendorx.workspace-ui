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
 * Unit tests for CSRF recovery functionality
 */

import {
  isInvalidCsrfTokenError,
  extractNewSessionData,
  recoverFromCsrfError,
  clearCsrfRecoveryAttempts,
  getCsrfRecoveryAttempts,
} from "../csrfRecovery";
import { DEFAULT_CSRF_TOKEN_ERROR } from "../../../../utils/session/constants";

// Mock the sessionRecovery module
jest.mock("../sessionRecovery", () => ({
  extractJSessionId: jest.fn(),
  storeCookieForToken: jest.fn(),
}));

// Mock logger
jest.mock("@/utils/logger", () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockExtractJSessionId = require("../sessionRecovery").extractJSessionId as jest.Mock;
const mockStoreCookieForToken = require("../sessionRecovery").storeCookieForToken as jest.Mock;

describe("csrfRecovery", () => {
  const createMockResponse = (status: number = 200) =>
    ({
      status,
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    }) as unknown as Response;

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing recovery attempts
    clearCsrfRecoveryAttempts("test-token");
  });

  describe("isInvalidCsrfTokenError", () => {
    it("should return true for valid InvalidCSRFToken error structure", () => {
      const data = {
        response: {
          error: {
            message: DEFAULT_CSRF_TOKEN_ERROR,
          },
        },
      };

      expect(isInvalidCsrfTokenError(data)).toBe(true);
    });

    it("should return false for non-InvalidCSRFToken errors", () => {
      const data = {
        response: {
          error: {
            message: "Some other error",
          },
        },
      };

      expect(isInvalidCsrfTokenError(data)).toBe(false);
    });

    it("should return false for malformed data", () => {
      expect(isInvalidCsrfTokenError(null)).toBe(false);
      expect(isInvalidCsrfTokenError(undefined)).toBe(false);
      expect(isInvalidCsrfTokenError("string")).toBe(false);
      expect(isInvalidCsrfTokenError({})).toBe(false);
    });

    it("should return false for data without response property", () => {
      const data = {
        error: {
          message: DEFAULT_CSRF_TOKEN_ERROR,
        },
      };

      expect(isInvalidCsrfTokenError(data)).toBe(false);
    });

    it("should return false for response without error property", () => {
      const data = {
        response: {
          message: DEFAULT_CSRF_TOKEN_ERROR,
        },
      };

      expect(isInvalidCsrfTokenError(data)).toBe(false);
    });
  });

  describe("extractNewSessionData", () => {
    it("should extract JSESSIONID from response", () => {
      const mockResponse = {
        headers: {
          get: jest.fn(),
        },
      } as unknown as Response;

      mockExtractJSessionId.mockReturnValue("session-456");

      const result = extractNewSessionData(mockResponse);

      expect(result).toEqual({
        jsessionId: "session-456",
        csrfToken: null,
      });
      expect(mockExtractJSessionId).toHaveBeenCalledWith(mockResponse);
    });

    it("should handle missing session data gracefully", () => {
      const mockResponse = {
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as Response;

      mockExtractJSessionId.mockReturnValue(null);

      const result = extractNewSessionData(mockResponse);

      expect(result).toEqual({
        jsessionId: null,
        csrfToken: null,
      });
    });

    it("should handle extraction errors gracefully", () => {
      const mockResponse = {
        headers: {
          get: jest.fn(),
        },
      } as unknown as Response;

      mockExtractJSessionId.mockImplementation(() => {
        throw new Error("Extraction failed");
      });

      const result = extractNewSessionData(mockResponse);

      expect(result).toEqual({
        jsessionId: null,
        csrfToken: null,
      });
    });
  });

  describe("recoverFromCsrfError", () => {
    const mockResponse = {
      status: 200,
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
    } as unknown as Response;

    const validCsrfErrorData = {
      response: {
        error: {
          message: DEFAULT_CSRF_TOKEN_ERROR,
        },
      },
    };

    it("should successfully recover from CSRF error", async () => {
      mockExtractJSessionId.mockReturnValue("new-session-123");
      mockStoreCookieForToken.mockImplementation(() => {});

      const result = await recoverFromCsrfError(mockResponse, validCsrfErrorData, "test-token");

      expect(result).toEqual({
        success: true,
        sessionUpdated: true,
      });
      expect(mockStoreCookieForToken).toHaveBeenCalledWith(mockResponse, { token: "test-token" });
    });

    it("should fail when no JSESSIONID is found", async () => {
      mockExtractJSessionId.mockReturnValue(null);

      const result = await recoverFromCsrfError(mockResponse, validCsrfErrorData, "test-token");

      expect(result.success).toBe(false);
      expect(result.sessionUpdated).toBe(false);
      expect(result.error).toContain("extract");
    });

    it("should fail when recovery is disabled", async () => {
      const result = await recoverFromCsrfError(mockResponse, validCsrfErrorData, "test-token", { enabled: false });

      expect(result.success).toBe(false);
      expect(result.sessionUpdated).toBe(false);
      expect(result.error).toBe("CSRF recovery is disabled");
    });

    it("should fail when no user token is provided", async () => {
      const result = await recoverFromCsrfError(mockResponse, validCsrfErrorData, "");

      expect(result.success).toBe(false);
      expect(result.sessionUpdated).toBe(false);
      expect(result.error).toBe("No user token provided for CSRF recovery");
    });

    it("should fail when data does not contain InvalidCSRFToken error", async () => {
      const invalidData = {
        response: {
          error: {
            message: "Some other error",
          },
        },
      };

      const result = await recoverFromCsrfError(mockResponse, invalidData, "test-token");

      expect(result.success).toBe(false);
      expect(result.sessionUpdated).toBe(false);
      expect(result.error).toBe("Response does not contain InvalidCSRFToken error");
    });

    it("should fail when response status is not 200", async () => {
      const non200Response = {
        status: 401,
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
      } as unknown as Response;

      const result = await recoverFromCsrfError(non200Response, validCsrfErrorData, "test-token");

      expect(result.success).toBe(false);
      expect(result.sessionUpdated).toBe(false);
      expect(result.error).toBe("Unexpected response status for CSRF error: 401");
    });

    it("should respect maximum retry attempts", async () => {
      // Mock extract to fail (simulate session not being updated)
      mockExtractJSessionId.mockReturnValue(null);

      // First attempt should fail
      const result1 = await recoverFromCsrfError(mockResponse, validCsrfErrorData, "test-token", {
        maxRetryAttempts: 1,
      });

      // Second attempt should be blocked due to max retries
      const result2 = await recoverFromCsrfError(mockResponse, validCsrfErrorData, "test-token", {
        maxRetryAttempts: 1,
      });

      expect(result1.success).toBe(false);
      expect(result1.error).toBe("Failed to extract or update session from CSRF error response");
      expect(result2.success).toBe(false);
      expect(result2.error).toContain("Maximum CSRF recovery attempts exceeded");
    });

    it("should clear attempts on successful recovery", async () => {
      mockExtractJSessionId.mockReturnValue("session-123");

      // First attempt (should succeed)
      await recoverFromCsrfError(mockResponse, validCsrfErrorData, "test-token", { maxRetryAttempts: 2 });

      // Attempts should be cleared after success
      expect(getCsrfRecoveryAttempts("test-token")).toBe(0);

      // Next attempt should work again
      const result = await recoverFromCsrfError(mockResponse, validCsrfErrorData, "test-token", {
        maxRetryAttempts: 2,
      });

      expect(result.success).toBe(true);
    });

    it("should handle storeCookieForToken errors gracefully", async () => {
      mockExtractJSessionId.mockReturnValue("session-123");
      mockStoreCookieForToken.mockImplementation(() => {
        throw new Error("Storage failed");
      });

      const result = await recoverFromCsrfError(mockResponse, validCsrfErrorData, "test-token");

      expect(result.success).toBe(false);
      expect(result.sessionUpdated).toBe(false);
      expect(result.error).toContain("extract");
    });
  });

  describe("getCsrfRecoveryAttempts", () => {
    it("should return 0 for tokens with no attempts", () => {
      expect(getCsrfRecoveryAttempts("new-token")).toBe(0);
    });

    it("should return correct number of attempts", async () => {
      const mockResponse = createMockResponse();
      mockExtractJSessionId.mockReturnValue(null); // Force failure

      // Make a failed attempt
      await recoverFromCsrfError(
        mockResponse,
        {
          response: {
            error: {
              message: DEFAULT_CSRF_TOKEN_ERROR,
            },
          },
        },
        "test-token"
      );

      expect(getCsrfRecoveryAttempts("test-token")).toBe(1);
    });
  });

  describe("clearCsrfRecoveryAttempts", () => {
    it("should clear attempts for a token", async () => {
      const mockResponse = createMockResponse();
      mockExtractJSessionId.mockReturnValue(null); // Force failure

      // Make a failed attempt
      await recoverFromCsrfError(
        mockResponse,
        {
          response: {
            error: {
              message: DEFAULT_CSRF_TOKEN_ERROR,
            },
          },
        },
        "test-token"
      );

      expect(getCsrfRecoveryAttempts("test-token")).toBe(1);

      // Clear attempts
      clearCsrfRecoveryAttempts("test-token");

      expect(getCsrfRecoveryAttempts("test-token")).toBe(0);
    });
  });
});

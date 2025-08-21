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

import { isSessionExpired, shouldAttemptRecovery } from "../sessionValidator";
import { createMockResponse, createTestData, expectSessionValidation } from "../../../../utils/tests/mockHelpers";

describe("sessionValidator", () => {
  describe("isSessionExpired", () => {
    it("should return true for 401 status", () => {
      expectSessionValidation(isSessionExpired, createMockResponse(401), createTestData.empty(), true);
    });

    it("should return true for 403 status", () => {
      expectSessionValidation(isSessionExpired, createMockResponse(403), createTestData.empty(), true);
    });

    it("should return false for 200 status", () => {
      expectSessionValidation(isSessionExpired, createMockResponse(200), createTestData.empty(), false);
    });

    it("should return true for session expired error messages", () => {
      expectSessionValidation(
        isSessionExpired,
        createMockResponse(500),
        createTestData.withError("Session expired"),
        true
      );
    });

    it("should return true for session timeout error messages", () => {
      expectSessionValidation(
        isSessionExpired,
        createMockResponse(500),
        createTestData.withMessage("Session timeout occurred"),
        true
      );
    });

    it("should return true for invalid session error messages", () => {
      expectSessionValidation(
        isSessionExpired,
        createMockResponse(200),
        createTestData.withError("Invalid session detected"),
        true
      );
    });

    it("should return true for unauthorized error messages", () => {
      expectSessionValidation(
        isSessionExpired,
        createMockResponse(200),
        createTestData.withMessage("Unauthorized access"),
        true
      );
    });

    it("should return true for authentication error messages", () => {
      expectSessionValidation(
        isSessionExpired,
        createMockResponse(200),
        createTestData.withError("Authentication failed"),
        true
      );
    });

    it("should return true for login required error messages", () => {
      expectSessionValidation(
        isSessionExpired,
        createMockResponse(200),
        createTestData.withMessage("Login required"),
        true
      );
    });

    it("should return false for non-session related errors", () => {
      expectSessionValidation(
        isSessionExpired,
        createMockResponse(500),
        createTestData.withError("Database connection failed"),
        false
      );
    });

    it("should return false for successful responses", () => {
      expectSessionValidation(isSessionExpired, createMockResponse(200), createTestData.withResult("success"), false);
    });

    it("should handle null/undefined data gracefully", () => {
      const response = createMockResponse(200);

      expectSessionValidation(isSessionExpired, response, null, false);
      expectSessionValidation(isSessionExpired, response, undefined, false);
    });

    it("should handle non-object data gracefully", () => {
      const response = createMockResponse(200);

      expectSessionValidation(isSessionExpired, response, "string data", false);
      expectSessionValidation(isSessionExpired, response, 123, false);
    });
  });

  describe("shouldAttemptRecovery", () => {
    it("should return true for 401 status (session expired)", () => {
      expectSessionValidation(shouldAttemptRecovery, createMockResponse(401), createTestData.empty(), true);
    });

    it("should return true for 403 status (forbidden, also session-related)", () => {
      expectSessionValidation(shouldAttemptRecovery, createMockResponse(403), createTestData.empty(), true);
    });

    it("should return true for session expired messages with non-403 status", () => {
      expectSessionValidation(
        shouldAttemptRecovery,
        createMockResponse(500),
        createTestData.withError("Session expired"),
        true
      );
    });

    it("should return false for non-session errors", () => {
      expectSessionValidation(
        shouldAttemptRecovery,
        createMockResponse(500),
        createTestData.withError("Database error"),
        false
      );
    });

    it("should return false for successful responses", () => {
      expectSessionValidation(
        shouldAttemptRecovery,
        createMockResponse(200),
        createTestData.withResult("success"),
        false
      );
    });
  });
});

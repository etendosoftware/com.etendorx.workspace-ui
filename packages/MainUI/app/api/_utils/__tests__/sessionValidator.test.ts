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

describe("sessionValidator", () => {
  describe("isSessionExpired", () => {
    it("should return true for 401 status", () => {
      const response = new Response("", { status: 401 });
      const data = {};

      expect(isSessionExpired(response, data)).toBe(true);
    });

    it("should return true for 403 status", () => {
      const response = new Response("", { status: 403 });
      const data = {};

      expect(isSessionExpired(response, data)).toBe(true);
    });

    it("should return false for 200 status", () => {
      const response = new Response("", { status: 200 });
      const data = {};

      expect(isSessionExpired(response, data)).toBe(false);
    });

    it("should return true for session expired error messages", () => {
      const response = new Response("", { status: 500 });
      const data = { error: "Session expired" };

      expect(isSessionExpired(response, data)).toBe(true);
    });

    it("should return true for session timeout error messages", () => {
      const response = new Response("", { status: 500 });
      const data = { message: "Session timeout occurred" };

      expect(isSessionExpired(response, data)).toBe(true);
    });

    it("should return true for invalid session error messages", () => {
      const response = new Response("", { status: 200 });
      const data = { error: "Invalid session detected" };

      expect(isSessionExpired(response, data)).toBe(true);
    });

    it("should return true for unauthorized error messages", () => {
      const response = new Response("", { status: 200 });
      const data = { message: "Unauthorized access" };

      expect(isSessionExpired(response, data)).toBe(true);
    });

    it("should return true for authentication error messages", () => {
      const response = new Response("", { status: 200 });
      const data = { error: "Authentication failed" };

      expect(isSessionExpired(response, data)).toBe(true);
    });

    it("should return true for login required error messages", () => {
      const response = new Response("", { status: 200 });
      const data = { message: "Login required" };

      expect(isSessionExpired(response, data)).toBe(true);
    });

    it("should return false for non-session related errors", () => {
      const response = new Response("", { status: 500 });
      const data = { error: "Database connection failed" };

      expect(isSessionExpired(response, data)).toBe(false);
    });

    it("should return false for successful responses", () => {
      const response = new Response("", { status: 200 });
      const data = { result: "success" };

      expect(isSessionExpired(response, data)).toBe(false);
    });

    it("should handle null/undefined data gracefully", () => {
      const response = new Response("", { status: 200 });

      expect(isSessionExpired(response, null)).toBe(false);
      expect(isSessionExpired(response, undefined)).toBe(false);
    });

    it("should handle non-object data gracefully", () => {
      const response = new Response("", { status: 200 });

      expect(isSessionExpired(response, "string data")).toBe(false);
      expect(isSessionExpired(response, 123)).toBe(false);
    });
  });

  describe("shouldAttemptRecovery", () => {
    it("should return true for 401 status (session expired)", () => {
      const response = new Response("", { status: 401 });
      const data = {};

      expect(shouldAttemptRecovery(response, data)).toBe(true);
    });

    it("should return true for 403 status (forbidden, also session-related)", () => {
      const response = new Response("", { status: 403 });
      const data = {};

      expect(shouldAttemptRecovery(response, data)).toBe(true);
    });

    it("should return true for session expired messages with non-403 status", () => {
      const response = new Response("", { status: 500 });
      const data = { error: "Session expired" };

      expect(shouldAttemptRecovery(response, data)).toBe(true);
    });

    it("should return false for non-session errors", () => {
      const response = new Response("", { status: 500 });
      const data = { error: "Database error" };

      expect(shouldAttemptRecovery(response, data)).toBe(false);
    });

    it("should return false for successful responses", () => {
      const response = new Response("", { status: 200 });
      const data = { result: "success" };

      expect(shouldAttemptRecovery(response, data)).toBe(false);
    });
  });
});

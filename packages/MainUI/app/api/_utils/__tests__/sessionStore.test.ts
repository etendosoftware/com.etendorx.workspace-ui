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

import { setErpSessionCookie, getErpSessionCookie, clearErpSessionCookie } from "../sessionStore";

describe("sessionStore", () => {
  const testToken = "test-jwt-token-12345";
  const testCookie = "JSESSIONID=ABC123DEF456; Path=/; HttpOnly";
  const anotherToken = "another-token-67890";
  const anotherCookie = "JSESSIONID=XYZ789UVW012; Path=/; Secure";

  beforeEach(() => {
    // Clear all stored sessions before each test
    clearErpSessionCookie(testToken);
    clearErpSessionCookie(anotherToken);
  });

  describe("setErpSessionCookie", () => {
    it("should store a session cookie for a valid token", () => {
      setErpSessionCookie(testToken, testCookie);

      const retrieved = getErpSessionCookie(testToken);
      expect(retrieved).toBe(testCookie);
    });

    it("should not store when token is empty", () => {
      setErpSessionCookie("", testCookie);

      const retrieved = getErpSessionCookie("");
      expect(retrieved).toBeNull();
    });

    it("should not store when cookie is empty", () => {
      setErpSessionCookie(testToken, "");

      const retrieved = getErpSessionCookie(testToken);
      expect(retrieved).toBeNull();
    });

    it("should overwrite existing cookie for same token", () => {
      const firstCookie = "JSESSIONID=FIRST123";
      const secondCookie = "JSESSIONID=SECOND456";

      setErpSessionCookie(testToken, firstCookie);
      expect(getErpSessionCookie(testToken)).toBe(firstCookie);

      setErpSessionCookie(testToken, secondCookie);
      expect(getErpSessionCookie(testToken)).toBe(secondCookie);
    });

    it("should handle multiple different tokens", () => {
      setErpSessionCookie(testToken, testCookie);
      setErpSessionCookie(anotherToken, anotherCookie);

      expect(getErpSessionCookie(testToken)).toBe(testCookie);
      expect(getErpSessionCookie(anotherToken)).toBe(anotherCookie);
    });
  });

  describe("getErpSessionCookie", () => {
    it("should return stored cookie for valid token", () => {
      setErpSessionCookie(testToken, testCookie);

      const retrieved = getErpSessionCookie(testToken);
      expect(retrieved).toBe(testCookie);
    });

    it("should return null for non-existent token", () => {
      const retrieved = getErpSessionCookie("non-existent-token");
      expect(retrieved).toBeNull();
    });

    it("should return null for null token", () => {
      const retrieved = getErpSessionCookie(null);
      expect(retrieved).toBeNull();
    });

    it("should return null for undefined token", () => {
      const retrieved = getErpSessionCookie(undefined);
      expect(retrieved).toBeNull();
    });

    it("should return null for empty string token", () => {
      const retrieved = getErpSessionCookie("");
      expect(retrieved).toBeNull();
    });

    it("should handle complex cookie strings", () => {
      const complexCookie = "JSESSIONID=ABC123; Path=/; Domain=.example.com; Secure; HttpOnly; SameSite=Strict";
      setErpSessionCookie(testToken, complexCookie);

      const retrieved = getErpSessionCookie(testToken);
      expect(retrieved).toBe(complexCookie);
    });
  });

  describe("clearErpSessionCookie", () => {
    it("should remove stored cookie for valid token", () => {
      setErpSessionCookie(testToken, testCookie);
      expect(getErpSessionCookie(testToken)).toBe(testCookie);

      clearErpSessionCookie(testToken);
      expect(getErpSessionCookie(testToken)).toBeNull();
    });

    it("should not affect other stored cookies", () => {
      setErpSessionCookie(testToken, testCookie);
      setErpSessionCookie(anotherToken, anotherCookie);

      clearErpSessionCookie(testToken);

      expect(getErpSessionCookie(testToken)).toBeNull();
      expect(getErpSessionCookie(anotherToken)).toBe(anotherCookie);
    });

    it("should handle clearing non-existent token gracefully", () => {
      expect(() => clearErpSessionCookie("non-existent-token")).not.toThrow();
    });

    it("should handle clearing empty string token gracefully", () => {
      expect(() => clearErpSessionCookie("")).not.toThrow();
    });
  });

  describe("persistence across operations", () => {
    it("should persist data across multiple operations", () => {
      // Store multiple sessions
      setErpSessionCookie(testToken, testCookie);
      setErpSessionCookie(anotherToken, anotherCookie);

      // Verify both are stored
      expect(getErpSessionCookie(testToken)).toBe(testCookie);
      expect(getErpSessionCookie(anotherToken)).toBe(anotherCookie);

      // Clear one
      clearErpSessionCookie(testToken);

      // Verify the other remains
      expect(getErpSessionCookie(testToken)).toBeNull();
      expect(getErpSessionCookie(anotherToken)).toBe(anotherCookie);

      // Update the remaining one
      const updatedCookie = "JSESSIONID=UPDATED789";
      setErpSessionCookie(anotherToken, updatedCookie);
      expect(getErpSessionCookie(anotherToken)).toBe(updatedCookie);
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle special characters in tokens", () => {
      const specialToken = "token-with-special-chars!@#$%^&*()";
      setErpSessionCookie(specialToken, testCookie);

      expect(getErpSessionCookie(specialToken)).toBe(testCookie);

      clearErpSessionCookie(specialToken);
      expect(getErpSessionCookie(specialToken)).toBeNull();
    });

    it("should handle very long token strings", () => {
      const longToken = "a".repeat(1000);
      setErpSessionCookie(longToken, testCookie);

      expect(getErpSessionCookie(longToken)).toBe(testCookie);
    });

    it("should handle very long cookie strings", () => {
      const longCookie = `JSESSIONID=${"x".repeat(500)}; Path=/`;
      setErpSessionCookie(testToken, longCookie);

      expect(getErpSessionCookie(testToken)).toBe(longCookie);
    });

    it("should handle Unicode characters in tokens and cookies", () => {
      const unicodeToken = "token-测试-🚀";
      const unicodeCookie = "JSESSIONID=测试值123🎯; Path=/";

      setErpSessionCookie(unicodeToken, unicodeCookie);
      expect(getErpSessionCookie(unicodeToken)).toBe(unicodeCookie);
    });
  });
});

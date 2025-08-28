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

import { AuthInterceptor } from "../authInterceptor";

describe("AuthInterceptor", () => {
  beforeEach(() => {
    // Clear all registered callbacks before each test
    AuthInterceptor.clearAllLogoutCallbacks();
  });

  describe("callback registration", () => {
    it("should register logout callbacks", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      AuthInterceptor.registerLogoutCallback(callback1);
      AuthInterceptor.registerLogoutCallback(callback2);

      expect(AuthInterceptor.getLogoutCallbackCount()).toBe(2);
    });

    it("should unregister logout callbacks", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      AuthInterceptor.registerLogoutCallback(callback1);
      AuthInterceptor.registerLogoutCallback(callback2);
      expect(AuthInterceptor.getLogoutCallbackCount()).toBe(2);

      AuthInterceptor.unregisterLogoutCallback(callback1);
      expect(AuthInterceptor.getLogoutCallbackCount()).toBe(1);
    });

    it("should clear all logout callbacks", () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      AuthInterceptor.registerLogoutCallback(callback1);
      AuthInterceptor.registerLogoutCallback(callback2);
      expect(AuthInterceptor.getLogoutCallbackCount()).toBe(2);

      AuthInterceptor.clearAllLogoutCallbacks();
      expect(AuthInterceptor.getLogoutCallbackCount()).toBe(0);
    });
  });

  describe("handleApiError", () => {
    it("should trigger logout for 401 status code", () => {
      const logoutCallback = jest.fn();
      AuthInterceptor.registerLogoutCallback(logoutCallback);

      const error = { status: 401 };

      expect(() => AuthInterceptor.handleApiError(error)).toThrow("Session expired. Please login again.");
      expect(logoutCallback).toHaveBeenCalledTimes(1);
    });

    it("should trigger logout for 403 status code", () => {
      const logoutCallback = jest.fn();
      AuthInterceptor.registerLogoutCallback(logoutCallback);

      const error = { status: 403 };

      expect(() => AuthInterceptor.handleApiError(error)).toThrow("Session expired. Please login again.");
      expect(logoutCallback).toHaveBeenCalledTimes(1);
    });

    it("should trigger logout for 'token expired' message", () => {
      const logoutCallback = jest.fn();
      AuthInterceptor.registerLogoutCallback(logoutCallback);

      const error = { message: "Token expired" };

      expect(() => AuthInterceptor.handleApiError(error)).toThrow("Authentication failed. Please login again.");
      expect(logoutCallback).toHaveBeenCalledTimes(1);
    });

    it("should trigger logout for 'invalid token' message", () => {
      const logoutCallback = jest.fn();
      AuthInterceptor.registerLogoutCallback(logoutCallback);

      const error = { message: "Invalid token provided" };

      expect(() => AuthInterceptor.handleApiError(error)).toThrow("Authentication failed. Please login again.");
      expect(logoutCallback).toHaveBeenCalledTimes(1);
    });

    it("should trigger logout for 'unauthorized' message", () => {
      const logoutCallback = jest.fn();
      AuthInterceptor.registerLogoutCallback(logoutCallback);

      const error = { message: "Unauthorized access" };

      expect(() => AuthInterceptor.handleApiError(error)).toThrow("Authentication failed. Please login again.");
      expect(logoutCallback).toHaveBeenCalledTimes(1);
    });

    it("should re-throw non-auth errors without triggering logout", () => {
      const logoutCallback = jest.fn();
      AuthInterceptor.registerLogoutCallback(logoutCallback);

      const error = { status: 500, message: "Internal server error" };

      expect(() => AuthInterceptor.handleApiError(error)).toThrow();
      expect(logoutCallback).not.toHaveBeenCalled();
    });

    it("should handle callback errors gracefully", () => {
      const failingCallback = jest.fn(() => {
        throw new Error("Callback error");
      });
      const workingCallback = jest.fn();

      AuthInterceptor.registerLogoutCallback(failingCallback);
      AuthInterceptor.registerLogoutCallback(workingCallback);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const error = { status: 401 };
      expect(() => AuthInterceptor.handleApiError(error)).toThrow("Session expired. Please login again.");

      expect(failingCallback).toHaveBeenCalled();
      expect(workingCallback).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith("Error during logout callback:", expect.any(Error));

      consoleSpy.mockRestore();
    });

    it("should handle case-insensitive message matching", () => {
      const logoutCallback = jest.fn();
      AuthInterceptor.registerLogoutCallback(logoutCallback);

      const error = { message: "TOKEN EXPIRED" };

      expect(() => AuthInterceptor.handleApiError(error)).toThrow("Authentication failed. Please login again.");
      expect(logoutCallback).toHaveBeenCalledTimes(1);
    });
  });
});

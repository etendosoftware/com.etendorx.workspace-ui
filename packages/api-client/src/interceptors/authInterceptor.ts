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

export class AuthInterceptor {
  private static logoutCallbacks: (() => void)[] = [];

  public static registerLogoutCallback(callback: () => void): void {
    AuthInterceptor.logoutCallbacks.push(callback);
  }

  public static unregisterLogoutCallback(callback: () => void): void {
    AuthInterceptor.logoutCallbacks = AuthInterceptor.logoutCallbacks.filter((cb) => cb !== callback);
  }

  /**
   * Clear all registered logout callbacks.
   * This method is primarily intended for testing purposes.
   */
  public static clearAllLogoutCallbacks(): void {
    AuthInterceptor.logoutCallbacks = [];
  }

  /**
   * Get the number of registered logout callbacks.
   * This method is primarily intended for testing purposes.
   */
  public static getLogoutCallbackCount(): number {
    return AuthInterceptor.logoutCallbacks.length;
  }

  private static triggerLogout(): void {
    const logoutCallbacks = AuthInterceptor.logoutCallbacks;
    for (const callback of logoutCallbacks) {
      try {
        callback();
      } catch (error) {
        console.error("Error during logout callback:", error);
      }
    }
  }

  public static handleApiError(error: unknown): never {
    // Error codes that require logout
    const UNAUTHORIZED_CODES = [401, 403];
    const AUTH_ERROR_MESSAGES = ["token expired", "invalid token", "unauthorized"];

    // TODO: Improve detection of auth errors based on API error structure
    // Handle Response objects with status codes
    if (error && typeof error === "object" && "status" in error) {
      const errorWithStatus = error as { status: number };
      if (UNAUTHORIZED_CODES.includes(errorWithStatus.status)) {
        AuthInterceptor.triggerLogout();
        throw new Error("Session expired. Please login again.");
      }
    }

    // TODO: Improve detection of auth errors based on API error structure
    // Handle error objects with message strings
    if (error && typeof error === "object" && "message" in error) {
      const errorWithMessage = error as { message: string };
      if (
        errorWithMessage.message &&
        AUTH_ERROR_MESSAGES.some((msg) => errorWithMessage.message.toLowerCase().includes(msg))
      ) {
        AuthInterceptor.triggerLogout();
        throw new Error("Authentication failed. Please login again.");
      }
    }

    // Re-throw the original error if it's not an authentication error
    throw error;
  }
}

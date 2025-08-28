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
    this.logoutCallbacks.push(callback);
  }

  public static unregisterLogoutCallback(callback: () => void): void {
    this.logoutCallbacks = this.logoutCallbacks.filter((cb) => cb !== callback);
  }

  private static triggerLogout(): void {
    this.logoutCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Error during logout callback:", error);
      }
    });
  }

  public static handleApiError(error: unknown): never {
    // Códigos de error que requieren logout
    const UNAUTHORIZED_CODES = [401, 403];
    const AUTH_ERROR_MESSAGES = ["token expired", "invalid token", "unauthorized"];

    // Handle Response objects with status codes
    if (error && typeof error === "object" && "status" in error) {
      const errorWithStatus = error as { status: number };
      if (UNAUTHORIZED_CODES.includes(errorWithStatus.status)) {
        this.triggerLogout();
        throw new Error("Session expired. Please login again.");
      }
    }

    // Handle error objects with message strings
    if (error && typeof error === "object" && "message" in error) {
      const errorWithMessage = error as { message: string };
      if (
        errorWithMessage.message &&
        AUTH_ERROR_MESSAGES.some((msg) => errorWithMessage.message.toLowerCase().includes(msg))
      ) {
        this.triggerLogout();
        throw new Error("Authentication failed. Please login again.");
      }
    }

    // Re-lanzar el error original si no es de autenticación
    throw error;
  }
}
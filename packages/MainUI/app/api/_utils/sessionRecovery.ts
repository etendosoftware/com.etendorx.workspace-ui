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

import { logger } from "@/utils/logger";
import { setErpSessionCookie, getErpSessionCookie, clearErpSessionCookie } from "./sessionStore";
import { joinUrl } from "./url";

/**
 * Session recovery service for re-authenticating with ERP when sessions expire
 */

/**
 * Recovery result indicating success or failure
 */
export interface SessionRecoveryResult {
  success: boolean;
  error?: string;
  newToken?: string; // New token returned by ERP if different from the original
}

/**
 * Extracts JSESSIONID from response headers (reused from login route)
 * @param response The HTTP response
 * @returns The JSESSIONID value or null if not found
 */
function extractJSessionId(response: Response): string | null {
  // Check single set-cookie header
  const singleCookie = response.headers.get("set-cookie");
  if (singleCookie) {
    const match = singleCookie.match(/JSESSIONID=([^;]+)/);
    if (match) return match[1];
  }

  // Check all headers for set-cookie (in case of multiple)
  const allHeaders = response.headers;
  let jsessionResult = null;
  allHeaders.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      const match = value.match(/JSESSIONID=([^;]+)/);
      if (match) jsessionResult = match[1];
    }
  });
  if (jsessionResult) return jsessionResult;

  return null;
}

/**
 * Stores session cookie for token (reused logic from login route)
 * @param erpResponse The HTTP response from ERP
 * @param data The parsed response data containing the token
 * @param oldToken The previous token to clear if different
 */
function storeCookieForToken(
  erpResponse: Response,
  data: { token?: string; [key: string]: unknown },
  oldToken?: string
): void {
  try {
    const jsessionId = extractJSessionId(erpResponse);
    const newToken = data?.token;

    if (jsessionId && newToken) {
      const cookieHeader = `JSESSIONID=${jsessionId}`;
      setErpSessionCookie(newToken, { cookieHeader, csrfToken: null });

      // If the token changed, clear the old one from the store
      if (oldToken && oldToken !== newToken) {
        clearErpSessionCookie(oldToken);
        logger.log("Token updated during session recovery");
      }
    }
  } catch (error) {
    logger.warn("Error storing cookie for token:", error);
  }
}

/**
 * Tracks recovery attempts and active recovery operations to prevent infinite loops
 * while supporting parallel requests
 */
const recoveryAttempts = new Map<string, number>(); // Failed recovery attempts
const activeRecoveries = new Map<string, Promise<SessionRecoveryResult>>(); // Ongoing recovery operations
const MAX_RECOVERY_ATTEMPTS = 3;
const RECOVERY_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Performs the actual session recovery operation
 * @param userToken The JWT token to use for re-authentication
 * @returns Promise resolving to recovery result
 */
async function performRecovery(userToken: string): Promise<SessionRecoveryResult> {
  try {
    // Get the current session cookie (may be expired)
    const currentCookie = getErpSessionCookie(userToken);

    // Prepare login request with JWT token for re-authentication
    const erpLoginUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, "/meta/login");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${userToken}`,
    };

    // Include current cookie if available (ERP might need it for context)
    if (currentCookie) {
      headers.Cookie = currentCookie;
    }

    // Create controller for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RECOVERY_TIMEOUT_MS);

    try {
      // Make re-authentication request
      const response = await fetch(erpLoginUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({}), // Empty body for JWT-based re-auth
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: `Re-authentication failed: ${response.status} ${errorData.error || response.statusText}`,
        };
      }

      // Parse response data to get the new token
      const data = await response.json().catch((jsonError) => {
        logger.error("JSON parse error during session recovery:", jsonError);
        throw new Error("Invalid response from ERP during session recovery");
      });

      // Store the new session cookie and handle token updates
      storeCookieForToken(response, data, userToken);

      // Check if we got a new token
      const newToken = data?.token;
      if (!newToken) {
        return { success: false, error: "No token received in re-authentication response" };
      }

      const isTokenUpdated = newToken !== userToken;
      logger.log("Session recovery successful");

      return {
        success: true,
        newToken: isTokenUpdated ? newToken : undefined,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return { success: false, error: "Session recovery timed out" };
      }

      throw fetchError;
    }
  } catch (error) {
    logger.error("Session recovery error:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error during session recovery";
    return { success: false, error: errorMessage };
  }
}

/**
 * Attempts to recover an expired session by re-authenticating with the ERP
 * Supports parallel requests by reusing ongoing recovery operations
 * @param userToken The JWT token to use for re-authentication
 * @returns Promise resolving to recovery result
 */
export async function recoverSession(userToken: string): Promise<SessionRecoveryResult> {
  if (!userToken) {
    return { success: false, error: "No user token provided" };
  }

  // Check if we've exceeded FAILED recovery attempts for this token
  const failedAttempts = recoveryAttempts.get(userToken) || 0;
  if (failedAttempts >= MAX_RECOVERY_ATTEMPTS) {
    return { success: false, error: "Maximum recovery attempts exceeded" };
  }

  // Check if there's already an active recovery for this token
  const existingRecovery = activeRecoveries.get(userToken);
  if (existingRecovery) {
    // Wait for the existing recovery to complete and return its result
    logger.log("Joining existing recovery operation");
    return await existingRecovery;
  }

  // Create a new recovery operation
  const recoveryPromise = performRecovery(userToken);

  // Store the active recovery promise
  activeRecoveries.set(userToken, recoveryPromise);

  try {
    const result = await recoveryPromise;

    // Handle the result
    if (result.success) {
      // Clear failed attempts on success
      recoveryAttempts.delete(userToken);

      // If we got a new token, also clear any failed attempts for the new token
      if (result.newToken && result.newToken !== userToken) {
        recoveryAttempts.delete(result.newToken);
      }
    } else {
      // Increment failed attempts only on actual failure
      const currentFailed = recoveryAttempts.get(userToken) || 0;
      recoveryAttempts.set(userToken, currentFailed + 1);
    }

    return result;
  } finally {
    // Always clean up the active recovery
    activeRecoveries.delete(userToken);
  }
}

/**
 * Clears recovery attempt tracking for a token
 * @param userToken The JWT token
 */
export function clearRecoveryAttempts(userToken: string): void {
  recoveryAttempts.delete(userToken);
  // Also clear any active recovery to allow fresh attempts
  activeRecoveries.delete(userToken);
}

/**
 * Gets the number of recovery attempts for a token
 * @param userToken The JWT token
 * @returns Number of attempts made
 */
export function getRecoveryAttempts(userToken: string): number {
  return recoveryAttempts.get(userToken) || 0;
}

/**
 * Checks if there's an active recovery operation for a token
 * @param userToken The JWT token
 * @returns True if there's an active recovery operation
 */
export function isRecoveryActive(userToken: string): boolean {
  return activeRecoveries.has(userToken);
}

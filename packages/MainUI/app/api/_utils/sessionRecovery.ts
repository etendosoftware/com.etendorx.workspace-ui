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

import { setErpSessionCookie, getErpSessionCookie } from "./sessionStore";
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
}

/**
 * Tracks recovery attempts to prevent infinite loops
 */
const recoveryAttempts = new Map<string, number>();
const MAX_RECOVERY_ATTEMPTS = 3;
const RECOVERY_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Attempts to recover an expired session by re-authenticating with the ERP
 * @param userToken The JWT token to use for re-authentication
 * @returns Promise resolving to recovery result
 */
export async function recoverSession(userToken: string): Promise<SessionRecoveryResult> {
  if (!userToken) {
    return { success: false, error: "No user token provided" };
  }

  // Check if we've exceeded recovery attempts for this token
  const attempts = recoveryAttempts.get(userToken) || 0;
  if (attempts >= MAX_RECOVERY_ATTEMPTS) {
    return { success: false, error: "Maximum recovery attempts exceeded" };
  }

  // Increment attempt counter
  recoveryAttempts.set(userToken, attempts + 1);

  try {
    // Get the current session cookie (may be expired)
    const currentCookie = getErpSessionCookie(userToken);
    
    // Prepare login request with JWT token for re-authentication
    const erpLoginUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, "/meta/login");
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${userToken}`,
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
          error: `Re-authentication failed: ${response.status} ${errorData.error || response.statusText}` 
        };
      }

      // Extract new JSESSIONID from response
      const newJSessionId = extractJSessionId(response);
      
      if (!newJSessionId) {
        return { success: false, error: "No JSESSIONID received in re-authentication response" };
      }

      // Update session store with new cookie
      const newCookieHeader = `JSESSIONID=${newJSessionId}`;
      setErpSessionCookie(userToken, newCookieHeader);

      // Clear recovery attempts on success
      recoveryAttempts.delete(userToken);

      console.log(`Session recovery successful for token: ${userToken.substring(0, 10)}...`);
      return { success: true };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return { success: false, error: "Session recovery timed out" };
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error("Session recovery error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error during session recovery";
    return { success: false, error: errorMessage };
  }
}

/**
 * Extracts JSESSIONID from response headers
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
  allHeaders.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      const match = value.match(/JSESSIONID=([^;]+)/);
      if (match) return match[1];
    }
  });

  return null;
}

/**
 * Clears recovery attempt tracking for a token
 * @param userToken The JWT token
 */
export function clearRecoveryAttempts(userToken: string): void {
  recoveryAttempts.delete(userToken);
}

/**
 * Gets the number of recovery attempts for a token
 * @param userToken The JWT token
 * @returns Number of attempts made
 */
export function getRecoveryAttempts(userToken: string): number {
  return recoveryAttempts.get(userToken) || 0;
}
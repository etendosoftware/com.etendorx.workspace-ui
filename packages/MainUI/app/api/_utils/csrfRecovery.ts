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
 * CSRF Session Recovery utilities for handling InvalidCSRFToken errors
 */

import { logger } from "@/utils/logger";
import { extractJSessionId, storeCookieForToken } from "./sessionRecovery";
import {
  DEFAULT_CSRF_TOKEN_ERROR,
  CSRF_RECOVERY_ENABLED_DEFAULT,
  CSRF_MAX_RETRY_ATTEMPTS
} from "@/utils/session/constants";

/**
 * Result of CSRF recovery operation
 */
export interface CsrfRecoveryResult {
  success: boolean;
  sessionUpdated: boolean;
  error?: string;
}

/**
 * Options for CSRF recovery
 */
export interface CsrfRecoveryOptions {
  maxRetryAttempts?: number;
  enabled?: boolean;
}

/**
 * Tracks CSRF recovery attempts to prevent infinite loops
 */
const csrfRecoveryAttempts = new Map<string, number>();

/**
 * Checks if recovery is enabled via environment variable
 */
function isCsrfRecoveryEnabled(): boolean {
  try {
    const envValue = process.env.CSRF_RECOVERY_ENABLED;
    if (typeof envValue === "string") {
      return envValue.toLowerCase() === "true";
    }
    return CSRF_RECOVERY_ENABLED_DEFAULT;
  } catch {
    return CSRF_RECOVERY_ENABLED_DEFAULT;
  }
}

/**
 * Detects if response data contains InvalidCSRFToken error
 * @param data The parsed response data
 * @returns true if InvalidCSRFToken error is detected
 */
export function isInvalidCsrfTokenError(data: unknown): boolean {
  try {
    if (!data || typeof data !== "object") {
      return false;
    }

    const responseData = data as Record<string, unknown>;
    const response = responseData.response;

    if (!response || typeof response !== "object") {
      return false;
    }

    const responseObj = response as Record<string, unknown>;
    const error = responseObj.error;

    if (!error || typeof error !== "object") {
      return false;
    }

    const errorObj = error as Record<string, unknown>;
    const message = errorObj.message;

    return typeof message === "string" && message === DEFAULT_CSRF_TOKEN_ERROR;
  } catch (error) {
    logger.warn("Error checking for InvalidCSRFToken:", error);
    return false;
  }
}

/**
 * Extracts new session data from response headers
 * @param response The HTTP response containing new session data
 * @returns Object with jsessionId (if available)
 */
export function extractNewSessionData(response: Response): {
  jsessionId: string | null;
  csrfToken: string | null;
} {
  try {
    // Reuse existing extractJSessionId function from sessionRecovery
    const jsessionId = extractJSessionId(response);

    return { jsessionId, csrfToken: null };
  } catch (error) {
    logger.warn("Error extracting session data from response:", error);
    return { jsessionId: null, csrfToken: null };
  }
}

/**
 * Updates session store with new JSESSIONID extracted from CSRF error response
 * @param response The HTTP response containing the new JSESSIONID
 * @param userToken The JWT token to update session for
 * @returns true if session was successfully updated
 */
function updateSessionFromCsrfResponse(response: Response, userToken: string): boolean {
  try {
    const { jsessionId } = extractNewSessionData(response);

    if (!jsessionId) {
      logger.warn("No JSESSIONID found in CSRF error response headers");
      return false;
    }

    // Create mock data object that storeCookieForToken expects
    const mockData = { token: userToken }; // Keep same token, just update session

    // Reuse existing storeCookieForToken function
    storeCookieForToken(response, mockData);

    logger.log(`CSRF recovery: Updated session for token with new JSESSIONID: ${jsessionId}`);
    return true;
  } catch (error) {
    logger.error("Error updating session from CSRF response:", error);
    return false;
  }
}

/**
 * Recovers from InvalidCSRFToken error by extracting new session and updating store
 * @param response The HTTP response containing InvalidCSRFToken error
 * @param data The parsed response data
 * @param userToken The JWT token
 * @param options Recovery options
 * @returns Promise resolving to recovery result
 */
export async function recoverFromCsrfError(
  response: Response,
  data: unknown,
  userToken: string,
  options: CsrfRecoveryOptions = {}
): Promise<CsrfRecoveryResult> {
  try {
    // Check if recovery is enabled
    const enabled = options.enabled !== undefined ? options.enabled : isCsrfRecoveryEnabled();
    if (!enabled) {
      return {
        success: false,
        sessionUpdated: false,
        error: "CSRF recovery is disabled"
      };
    }

    // Validate inputs
    if (!userToken?.trim()) {
      return {
        success: false,
        sessionUpdated: false,
        error: "No user token provided for CSRF recovery"
      };
    }

    // Check if this is actually an InvalidCSRFToken error
    if (!isInvalidCsrfTokenError(data)) {
      return {
        success: false,
        sessionUpdated: false,
        error: "Response does not contain InvalidCSRFToken error"
      };
    }

    // Check retry attempts to prevent infinite loops
    const maxRetries = options.maxRetryAttempts || CSRF_MAX_RETRY_ATTEMPTS;
    const currentAttempts = csrfRecoveryAttempts.get(userToken) || 0;

    if (currentAttempts >= maxRetries) {
      return {
        success: false,
        sessionUpdated: false,
        error: "Maximum CSRF recovery attempts exceeded"
      };
    }

    // Increment attempt counter
    csrfRecoveryAttempts.set(userToken, currentAttempts + 1);

    // Verify response status is 200 (as per requirement)
    if (response.status !== 200) {
      return {
        success: false,
        sessionUpdated: false,
        error: `Unexpected response status for CSRF error: ${response.status}`
      };
    }

    // Update session store with new JSESSIONID
    const sessionUpdated = updateSessionFromCsrfResponse(response, userToken);

    if (sessionUpdated) {
      // Clear attempt counter on successful recovery
      csrfRecoveryAttempts.delete(userToken);

      logger.log("CSRF recovery successful");
      return {
        success: true,
        sessionUpdated: true
      };
    } else {
      return {
        success: false,
        sessionUpdated: false,
        error: "Failed to extract or update session from CSRF error response"
      };
    }
  } catch (error) {
    logger.error("Error during CSRF recovery:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error during CSRF recovery";
    return {
      success: false,
      sessionUpdated: false,
      error: errorMessage
    };
  }
}

/**
 * Clears CSRF recovery attempt tracking for a token
 * @param userToken The JWT token
 */
export function clearCsrfRecoveryAttempts(userToken: string): void {
  csrfRecoveryAttempts.delete(userToken);
}

/**
 * Gets the number of CSRF recovery attempts for a token
 * @param userToken The JWT token
 * @returns Number of attempts made
 */
export function getCsrfRecoveryAttempts(userToken: string): number {
  return csrfRecoveryAttempts.get(userToken) || 0;
}
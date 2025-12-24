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
 * Enhanced session retry with CSRF recovery capabilities
 */

import type { NextRequest } from "next/server";
import { logger } from "@/utils/logger";
import { isSessionExpired, shouldAttemptRecovery, shouldAttemptCsrfRecovery } from "./sessionValidator";
import { recoverSession } from "./sessionRecovery";
import { recoverFromCsrfError } from "./csrfRecovery";
import { getErpAuthHeaders } from "./forwardConfig";

/**
 * Enhanced retry result that includes CSRF recovery information
 */
export interface EnhancedRetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  recovered?: boolean;
  csrfRecovered?: boolean;
  newToken?: string;
}

/**
 * Executes a request with automatic session and CSRF recovery
 * @param request The original NextRequest for context
 * @param userToken The JWT token
 * @param requestFn Function that executes the actual request
 * @returns Promise resolving to enhanced retry result
 */
export async function executeWithSessionAndCsrfRetry<T>(
  request: NextRequest,
  userToken: string,
  requestFn: (cookieHeader: string) => Promise<{ response: Response; data: T }>
): Promise<EnhancedRetryResult<T>> {
  try {
    // First attempt with current session
    let cookieHeader = getErpAuthHeaders(request, userToken).cookieHeader;
    let result = await requestFn(cookieHeader);

    // Check for CSRF error first (highest priority for our hotfix)
    if (shouldAttemptCsrfRecovery(result.response, result.data)) {
      logger.log("InvalidCSRFToken detected, attempting CSRF recovery");

      // Attempt CSRF recovery
      const csrfRecoveryResult = await recoverFromCsrfError(result.response, result.data, userToken);

      if (!csrfRecoveryResult.success) {
        return {
          success: false,
          error: `CSRF recovery failed: ${csrfRecoveryResult.error}`,
          data: result.data,
        };
      }

      // Retry request with updated session
      cookieHeader = getErpAuthHeaders(request, userToken).cookieHeader;
      result = await requestFn(cookieHeader);

      // Check if retry was successful
      if (shouldAttemptCsrfRecovery(result.response, result.data)) {
        return {
          success: false,
          error: "Request failed even after CSRF recovery",
          data: result.data,
        };
      }

      logger.log("CSRF recovery and retry successful");
      return {
        success: true,
        data: result.data,
        recovered: true,
        csrfRecovered: true,
      };
    }

    // Check for traditional session expiration
    if (!isSessionExpired(result.response, result.data)) {
      return { success: true, data: result.data };
    }

    // Check if we should attempt traditional recovery
    if (!shouldAttemptRecovery(result.response, result.data)) {
      return {
        success: false,
        error: `Request failed with status ${result.response.status}`,
        data: result.data,
      };
    }

    logger.log("Session expired, attempting traditional session recovery");

    // Attempt traditional session recovery
    const recoveryResult = await recoverSession(userToken);

    if (!recoveryResult.success) {
      return {
        success: false,
        error: `Session recovery failed: ${recoveryResult.error}`,
        data: result.data,
      };
    }

    // Use the updated token if one was returned, otherwise use original token
    const tokenToUse = recoveryResult.newToken || userToken;

    // Retry request with new session (and potentially new token)
    cookieHeader = getErpAuthHeaders(request, tokenToUse).cookieHeader;
    result = await requestFn(cookieHeader);

    // Check if retry was successful
    if (isSessionExpired(result.response, result.data)) {
      return {
        success: false,
        error: "Request failed even after session recovery",
        data: result.data,
      };
    }

    logger.log("Traditional session recovery and retry successful");
    return {
      success: true,
      data: result.data,
      recovered: true,
      newToken: recoveryResult.newToken,
    };
  } catch (error) {
    logger.error("Error in enhanced session retry logic:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error in session retry";
    return { success: false, error: errorMessage };
  }
}

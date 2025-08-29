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

import { isSessionExpired, shouldAttemptRecovery } from "./sessionValidator";
import { recoverSession } from "./sessionRecovery";
import { getErpAuthHeaders } from "./forwardConfig";
import type { NextRequest } from "next/server";
import { logger } from "@/utils/logger";

/**
 * Request retry utilities with automatic session recovery
 */

export interface RetryableRequest {
  url: string;
  options: RequestInit;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  recovered?: boolean;
  newToken?: string; // New token if it was updated during recovery
}

/**
 * Executes a request with automatic session recovery on authentication failure
 * @param request The original NextRequest for context
 * @param userToken The JWT token
 * @param requestFn Function that executes the actual request
 * @returns Promise resolving to retry result
 */
export async function executeWithSessionRetry<T>(
  request: NextRequest,
  userToken: string,
  requestFn: (cookieHeader: string) => Promise<{ response: Response; data: T }>
): Promise<RetryResult<T>> {
  try {
    // First attempt with current session
    let cookieHeader = getErpAuthHeaders(request, userToken).cookieHeader;
    let result = await requestFn(cookieHeader);

    // Check if session is expired
    if (!isSessionExpired(result.response, result.data)) {
      return { success: true, data: result.data };
    }

    // Check if we should attempt recovery
    if (!shouldAttemptRecovery(result.response, result.data)) {
      return {
        success: false,
        error: `Request failed with status ${result.response.status}`,
        data: result.data,
      };
    }

    logger.log("Session expired, attempting recovery");

    // Attempt session recovery
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

    logger.log("Session recovery and retry successful");
    return {
      success: true,
      data: result.data,
      recovered: true,
      newToken: recoveryResult.newToken,
    };
  } catch (error) {
    logger.error("Error in session retry logic:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error in session retry";
    return { success: false, error: errorMessage };
  }
}

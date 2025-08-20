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

/**
 * Session validation utilities for detecting expired ERP sessions
 */

/**
 * Checks if a response indicates an expired session
 * @param response The HTTP response from ERP
 * @param data The parsed response data
 * @returns true if the session appears to be expired
 */
export function isSessionExpired(response: Response, data: unknown): boolean {
  // Check for 401 Unauthorized - primary indicator of session expiration
  if (response.status === 401) {
    return true;
  }

  // Check for 403 Forbidden - can also indicate session issues
  if (response.status === 403) {
    return true;
  }

  // Check for specific ERP error messages in response data
  if (data && typeof data === 'object') {
    const errorObj = data as Record<string, unknown>;
    const errorMessage = errorObj.error || errorObj.message || '';
    
    if (typeof errorMessage === 'string') {
      const lowerMessage = errorMessage.toLowerCase();
      
      // Common session expiration indicators
      if (lowerMessage.includes('session') && (
          lowerMessage.includes('expired') ||
          lowerMessage.includes('timeout') ||
          lowerMessage.includes('invalid')
        )) {
        return true;
      }
      
      // Additional authentication-related indicators
      if (lowerMessage.includes('unauthorized') || 
          lowerMessage.includes('authentication') ||
          lowerMessage.includes('login required')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if a session expiration should trigger automatic recovery
 * @param response The HTTP response from ERP
 * @param data The parsed response data
 * @returns true if automatic recovery should be attempted
 */
export function shouldAttemptRecovery(response: Response, data: unknown): boolean {
  // Only attempt recovery for session expiration, not other authentication issues
  return isSessionExpired(response, data) && response.status !== 403;
}
/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

/*
 * Session Keepalive Hook
 * Manages timer-based session validation via Next.js API
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { logger } from "../utils/logger";

export interface UseSessionKeepaliveOptions {
  token: string | null;
  enabled: boolean;
  interval: number; // milliseconds
  onSessionExpired?: () => void;
}

export interface UseSessionKeepaliveReturn {
  isActive: boolean;
  lastCheckStatus: "success" | "failed" | "pending" | null;
}

export interface SessionValidationResponse {
  result: string;
  [key: string]: unknown;
}

export const useSessionKeepalive = ({
  token,
  enabled,
  interval,
  onSessionExpired,
}: UseSessionKeepaliveOptions): UseSessionKeepaliveReturn => {
  const [isActive, setIsActive] = useState(false);
  const [lastCheckStatus, setLastCheckStatus] = useState<UseSessionKeepaliveReturn["lastCheckStatus"]>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isValidatingRef = useRef(false);

  const validateSession = useCallback(async () => {
    if (isValidatingRef.current) {
      return; // Prevent concurrent validations
    }

    isValidatingRef.current = true;
    setLastCheckStatus("pending");

    try {
      // Check network state
      if (!navigator.onLine) {
        logger.warn("Network is offline, skipping session validation");
        setLastCheckStatus("failed");
        if (onSessionExpired) {
          onSessionExpired();
        }
        return;
      }

      const response = await fetch("/api/auth/keep-alive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setLastCheckStatus("failed");
        if (onSessionExpired) {
          logger.warn("Session validation failed, triggering logout");
          onSessionExpired();
        }
        return;
      }

      const data: SessionValidationResponse = await response.json();
      const isValid = data.result === "success";

      setLastCheckStatus(isValid ? "success" : "failed");

      if (!isValid && onSessionExpired) {
        logger.warn("Session validation failed, triggering logout");
        onSessionExpired();
      }
    } catch (error) {
      logger.warn("Session validation error:", error);
      setLastCheckStatus("failed");

      if (onSessionExpired) {
        onSessionExpired();
      }
    } finally {
      isValidatingRef.current = false;
    }
  }, [onSessionExpired, token]);

  // Start/stop keepalive based on enabled state
  useEffect(() => {
    if (!enabled) {
      setIsActive(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setIsActive(true);

    // Start the interval - IMPORTANT: No Page Visibility API check here
    // Requests must continue even when tab is not active
    intervalRef.current = setInterval(validateSession, interval);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsActive(false);
    };
  }, [enabled, interval, validateSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isActive,
    lastCheckStatus,
  };
};

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

"use client";

import { useCallback, useEffect, useRef } from "react";
import { refreshToken as doRefreshToken } from "@workspaceui/api-client/src/api/authentication";
import { SESSION_CHECK_INTERVAL_MS, SESSION_REFRESH_LEAD_MS } from "@/constants/config";
import { subscribeToUserActivity } from "@/utils/session/activity";
import { decideSessionAction } from "@/utils/session/decideSessionAction";
import { getTokenExpiration } from "@/utils/session/token";
import { logger } from "@/utils/logger";

const TOKEN_STORAGE_KEY = "token";

export interface UseSessionKeepAliveParams {
  /** The current session token. */
  token: string | null;
  /** Applies a newly issued token without re-verifying the session. */
  onRefreshed: (newToken: string) => void;
  /** Called once the token has expired without being renewed. */
  onExpired: () => void;
}

/**
 * Keeps the session alive for as long as the user is actually working, and lets it expire when they
 * are not.
 *
 * A low-frequency tick compares the token's `exp` against the last real user interaction and only
 * then issues a single renewal request. The tick itself never touches the network, so background
 * traffic can never extend a session — see `utils/session/activity.ts`.
 *
 * The hook is completely inert when the token carries no `exp` claim (the ERP omits it when
 * `SMFSWS_Config.Expirationtime` is 0), so today's "never expires" behavior is preserved untouched.
 */
export function useSessionKeepAlive({ token, onRefreshed, onExpired }: UseSessionKeepAliveParams): void {
  const lastActivityAtRef = useRef(0);
  const windowStartedAtRef = useRef(0);
  const pendingRefreshRef = useRef<Promise<void> | null>(null);

  const onRefreshedRef = useRef(onRefreshed);
  const onExpiredRef = useRef(onExpired);
  onRefreshedRef.current = onRefreshed;
  onExpiredRef.current = onExpired;

  const expiresAt = getTokenExpiration(token);
  const isEnabled = expiresAt !== null;

  const adoptToken = useCallback((newToken: string) => {
    windowStartedAtRef.current = Date.now();
    onRefreshedRef.current(newToken);
  }, []);

  const runRefresh = useCallback(() => {
    if (pendingRefreshRef.current) {
      return pendingRefreshRef.current;
    }

    const refresh = doRefreshToken()
      .then((response) => {
        adoptToken(response.token);
      })
      .catch((error) => {
        // Deliberately not retried within this cycle: if the token really does expire, the next
        // tick reports it as expired and the session is closed there.
        logger.warn("Session refresh failed:", error);
      })
      .finally(() => {
        pendingRefreshRef.current = null;
      });

    pendingRefreshRef.current = refresh;

    return refresh;
  }, [adoptToken]);

  // ── Real user activity ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEnabled) return;

    // Loading the app is itself activity, and this also seeds the window after a page reload.
    const now = Date.now();
    lastActivityAtRef.current = now;
    windowStartedAtRef.current = now;

    return subscribeToUserActivity(() => {
      lastActivityAtRef.current = Date.now();
    });
  }, [isEnabled]);

  // ── Decision tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEnabled || expiresAt === null) return;

    const tick = () => {
      const action = decideSessionAction({
        expiresAt,
        lastActivityAt: lastActivityAtRef.current,
        windowStartedAt: windowStartedAtRef.current,
        now: Date.now(),
        leadMs: SESSION_REFRESH_LEAD_MS,
      });

      if (action === "expire") {
        onExpiredRef.current();
        return;
      }

      if (action === "refresh") {
        void runRefresh();
      }
    };

    // Evaluate straight away, not only on the first interval: a token restored from localStorage
    // may already be expired, and waiting a whole tick would let the app boot and fire a burst of
    // doomed requests whose 401s would surface as a generic system error.
    tick();

    const intervalId = setInterval(tick, SESSION_CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isEnabled, expiresAt, runRefresh]);

  // ── Cross-tab coherence ───────────────────────────────────────────────────
  // Without this, a tab left in the background would expire and log the user out even though they
  // are actively working in another tab that already renewed the token.
  useEffect(() => {
    if (!isEnabled) return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== TOKEN_STORAGE_KEY) return;
      if (!event.newValue || event.newValue === token) return;

      adoptToken(event.newValue);
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, [isEnabled, token, adoptToken]);
}

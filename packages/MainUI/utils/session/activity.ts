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
 * Real-user-activity detection for the session keep-alive.
 *
 * Activity is measured from DOM input events and deliberately never from network traffic. That is
 * what keeps background work — the Copilot SSE stream, dashboard widget auto-refresh, process
 * polling, the health check, and any future alerts polling — from keeping a session alive when
 * nobody is actually there. It mirrors what Etendo Classic does with `ignoreForSessionTimeout`:
 * its 50-second alert ping explicitly opts out of extending the HTTP session.
 */

/**
 * Input events that count as real user activity.
 *
 * `mousemove`, `pointermove` and `scroll` are excluded on purpose: they are noisy and, in the case
 * of `scroll`, also fired programmatically by the virtualized grids.
 */
export const USER_ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

const LISTENER_OPTIONS: AddEventListenerOptions = { passive: true, capture: true };

/**
 * Subscribes to real user activity.
 *
 * Listeners are registered in the capture phase so activity is still seen when a component calls
 * `stopPropagation`, and passive so they can never interfere with scrolling or default behavior.
 *
 * @param onActivity Called on every user interaction
 * @returns A function that removes every listener
 */
export function subscribeToUserActivity(onActivity: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  for (const eventName of USER_ACTIVITY_EVENTS) {
    window.addEventListener(eventName, onActivity, LISTENER_OPTIONS);
  }

  return () => {
    for (const eventName of USER_ACTIVITY_EVENTS) {
      window.removeEventListener(eventName, onActivity, LISTENER_OPTIONS);
    }
  };
}

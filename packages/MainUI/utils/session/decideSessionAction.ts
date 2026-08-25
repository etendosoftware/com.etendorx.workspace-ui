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

/** What the session keep-alive should do on a given tick. */
export type SessionAction = "none" | "refresh" | "expire";

export interface SessionActionInput {
  /** Token expiration in milliseconds since the epoch, or null when the token never expires. */
  expiresAt: number | null;
  /** When the user last interacted, in milliseconds since the epoch. */
  lastActivityAt: number;
  /** When the current token's window started (mount time, or the last successful renewal). */
  windowStartedAt: number;
  /** Current time in milliseconds since the epoch. */
  now: number;
  /** How long before expiration a renewal should be attempted. */
  leadMs: number;
}

/**
 * Decides what to do with the session on a single tick.
 *
 * The rule reproduces Classic's sliding inactivity window: the token is renewed only when the user
 * actually did something during its lifetime, so an idle session expires on its own even while
 * background polling keeps the network busy.
 *
 * @param input The current session timings
 * @returns "expire" when the token is past due, "refresh" when it is close to expiring and the user
 *   has been active, "none" otherwise
 */
export function decideSessionAction(input: SessionActionInput): SessionAction {
  const { expiresAt, lastActivityAt, windowStartedAt, now, leadMs } = input;

  // No exp claim: expiration is disabled instance-wide, so the mechanism stays inert.
  if (expiresAt === null) {
    return "none";
  }

  if (now >= expiresAt) {
    return "expire";
  }

  if (now < expiresAt - leadMs) {
    return "none";
  }

  if (lastActivityAt > windowStartedAt) {
    return "refresh";
  }

  return "none";
}

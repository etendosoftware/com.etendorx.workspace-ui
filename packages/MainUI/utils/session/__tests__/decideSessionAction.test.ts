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

import { decideSessionAction, type SessionActionInput } from "../decideSessionAction";

const NOW = 1_000_000;
const LEAD_MS = 60_000;

/** Builds an input where the token expires well beyond the lead window and there is no activity. */
function buildInput(overrides: Partial<SessionActionInput> = {}): SessionActionInput {
  return {
    expiresAt: NOW + 10 * LEAD_MS,
    lastActivityAt: 0,
    windowStartedAt: NOW - LEAD_MS,
    now: NOW,
    leadMs: LEAD_MS,
    ...overrides,
  };
}

describe("decideSessionAction", () => {
  describe("when expiration is disabled", () => {
    it("does nothing even if the user is active", () => {
      const input = buildInput({ expiresAt: null, lastActivityAt: NOW });

      expect(decideSessionAction(input)).toBe("none");
    });
  });

  describe("when the token has expired", () => {
    it("expires the session", () => {
      expect(decideSessionAction(buildInput({ expiresAt: NOW - 1 }))).toBe("expire");
    });

    it("expires exactly at the expiration instant", () => {
      expect(decideSessionAction(buildInput({ expiresAt: NOW }))).toBe("expire");
    });

    it("expires even when the user was just active", () => {
      const input = buildInput({ expiresAt: NOW - 1, lastActivityAt: NOW });

      expect(decideSessionAction(input)).toBe("expire");
    });
  });

  describe("when the token is inside the renewal window", () => {
    const expiresAt = NOW + LEAD_MS;

    it("refreshes when the user was active during the current token's life", () => {
      const input = buildInput({ expiresAt, lastActivityAt: NOW - 1, windowStartedAt: NOW - LEAD_MS });

      expect(decideSessionAction(input)).toBe("refresh");
    });

    it("refreshes at the exact start of the lead window", () => {
      const input = buildInput({ expiresAt: NOW + LEAD_MS, lastActivityAt: NOW, windowStartedAt: NOW - 1 });

      expect(decideSessionAction(input)).toBe("refresh");
    });

    // The Jira scenario: background polling must not keep the session alive.
    it("does nothing when there has been no real activity since the token was issued", () => {
      const input = buildInput({ expiresAt, lastActivityAt: NOW - LEAD_MS, windowStartedAt: NOW - LEAD_MS });

      expect(decideSessionAction(input)).toBe("none");
    });

    it("treats activity older than the current window as no activity", () => {
      const input = buildInput({ expiresAt, lastActivityAt: 1, windowStartedAt: NOW - 1 });

      expect(decideSessionAction(input)).toBe("none");
    });
  });

  describe("when the token is still far from expiring", () => {
    it("does nothing even if the user is active", () => {
      const input = buildInput({ expiresAt: NOW + LEAD_MS + 1, lastActivityAt: NOW, windowStartedAt: NOW - 1 });

      expect(decideSessionAction(input)).toBe("none");
    });
  });
});

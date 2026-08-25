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

import { act, renderHook } from "@testing-library/react";
import { refreshToken } from "@workspaceui/api-client/src/api/authentication";
import { SESSION_CHECK_INTERVAL_MS, SESSION_REFRESH_LEAD_MS } from "@/constants/config";
import { useSessionKeepAlive } from "../useSessionKeepAlive";
import { buildToken, buildTokenExpiringAt } from "@/utils/testUtils/sessionTokens";

jest.mock("@workspaceui/api-client/src/api/authentication", () => ({
  refreshToken: jest.fn(),
}));
jest.mock("@/utils/logger", () => ({ logger: { warn: jest.fn(), log: jest.fn(), error: jest.fn() } }));

const mockRefreshToken = refreshToken as jest.Mock;

const START_TIME = 1_700_000_000_000;
const TOKEN_LIFETIME_MS = 30 * 60 * 1000;
const NEW_TOKEN = "renewed-token";

/** Mounts the hook with a token expiring `lifetimeMs` from now, and exposes the callbacks. */
function setup(options: { token?: string | null; lifetimeMs?: number } = {}) {
  const onRefreshed = jest.fn();
  const onExpired = jest.fn();
  const token =
    options.token !== undefined
      ? options.token
      : buildTokenExpiringAt(START_TIME + (options.lifetimeMs ?? TOKEN_LIFETIME_MS));

  const view = renderHook(({ currentToken }) => useSessionKeepAlive({ token: currentToken, onRefreshed, onExpired }), {
    initialProps: { currentToken: token },
  });

  return { ...view, onRefreshed, onExpired, token };
}

/** Advances the fake timers, which with modern timers also advances the mocked Date. */
function advanceBy(ms: number) {
  act(() => {
    jest.advanceTimersByTime(ms);
  });
}

/**
 * Simulates a real user interaction.
 *
 * The clock is nudged first because activity only counts when it happens strictly after the current
 * token's window started — which, on mount, is "now".
 */
function simulateUserActivity() {
  advanceBy(1);
  act(() => {
    window.dispatchEvent(new Event("keydown"));
  });
}

/** Simulates background traffic that must never count as activity. */
function simulateBackgroundTraffic() {
  act(() => {
    window.dispatchEvent(new Event("message"));
    window.dispatchEvent(new Event("scroll"));
  });
}

/** Advances the clock until the token is inside its renewal window. */
function advanceIntoRenewalWindow(lifetimeMs = TOKEN_LIFETIME_MS) {
  advanceBy(lifetimeMs - SESSION_REFRESH_LEAD_MS + SESSION_CHECK_INTERVAL_MS);
}

describe("useSessionKeepAlive", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(START_TIME);
    mockRefreshToken.mockReset();
    mockRefreshToken.mockResolvedValue({ token: NEW_TOKEN });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("continuous activity keeps the session alive", () => {
    it("renews the token when the user has been active", async () => {
      const { onRefreshed, onExpired } = setup();

      simulateUserActivity();
      advanceIntoRenewalWindow();
      await act(async () => undefined);

      expect(mockRefreshToken).toHaveBeenCalledTimes(1);
      expect(onRefreshed).toHaveBeenCalledWith(NEW_TOKEN);
      expect(onExpired).not.toHaveBeenCalled();
    });

    it("renews again on the next window when the user stays active", async () => {
      const { onRefreshed, rerender } = setup();

      simulateUserActivity();
      advanceIntoRenewalWindow();
      await act(async () => undefined);

      expect(mockRefreshToken).toHaveBeenCalledTimes(1);

      // The provider applies the renewed token, which is what restarts the window in real usage.
      const secondToken = buildTokenExpiringAt(Date.now() + TOKEN_LIFETIME_MS);
      mockRefreshToken.mockResolvedValue({ token: secondToken });
      act(() => rerender({ currentToken: secondToken }));

      simulateUserActivity();
      advanceIntoRenewalWindow();
      await act(async () => undefined);

      expect(mockRefreshToken).toHaveBeenCalledTimes(2);
      expect(onRefreshed).toHaveBeenCalledTimes(2);
    });
  });

  describe("a token that is already expired at mount", () => {
    // Reopening a tab restores an expired token from localStorage. Waiting a whole tick would let
    // the app boot and fire a burst of doomed requests.
    it("expires immediately, without waiting for the first tick", () => {
      const { onExpired } = setup({ token: buildTokenExpiringAt(START_TIME - 1) });

      expect(onExpired).toHaveBeenCalledTimes(1);
      expect(mockRefreshToken).not.toHaveBeenCalled();
    });

    it("does not expire a still-valid token on mount", () => {
      const { onExpired } = setup();

      expect(onExpired).not.toHaveBeenCalled();
      expect(mockRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe("inactivity expires the session", () => {
    it("never renews and expires once the token is past due", async () => {
      const { onRefreshed, onExpired } = setup();

      advanceBy(TOKEN_LIFETIME_MS + SESSION_CHECK_INTERVAL_MS);
      await act(async () => undefined);

      expect(mockRefreshToken).not.toHaveBeenCalled();
      expect(onRefreshed).not.toHaveBeenCalled();
      expect(onExpired).toHaveBeenCalled();
    });
  });

  describe("background polling does not keep the session alive", () => {
    it("ignores background traffic and lets the token expire", async () => {
      const { onExpired } = setup();

      // Background work keeps firing throughout the token's whole lifetime.
      for (let elapsed = 0; elapsed < TOKEN_LIFETIME_MS; elapsed += SESSION_CHECK_INTERVAL_MS) {
        simulateBackgroundTraffic();
        advanceBy(SESSION_CHECK_INTERVAL_MS);
      }
      advanceBy(SESSION_CHECK_INTERVAL_MS);
      await act(async () => undefined);

      expect(mockRefreshToken).not.toHaveBeenCalled();
      expect(onExpired).toHaveBeenCalled();
    });
  });

  describe("when expiration is disabled", () => {
    it("registers nothing and never renews for a token without exp", async () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");
      const setIntervalSpy = jest.spyOn(global, "setInterval");

      const { onRefreshed, onExpired } = setup({ token: buildToken({ user: "U1" }) });

      simulateUserActivity();
      advanceBy(TOKEN_LIFETIME_MS * 2);
      await act(async () => undefined);

      expect(addEventListenerSpy).not.toHaveBeenCalled();
      expect(setIntervalSpy).not.toHaveBeenCalled();
      expect(mockRefreshToken).not.toHaveBeenCalled();
      expect(onRefreshed).not.toHaveBeenCalled();
      expect(onExpired).not.toHaveBeenCalled();

      addEventListenerSpy.mockRestore();
      setIntervalSpy.mockRestore();
    });

    it("registers nothing when there is no token", () => {
      const setIntervalSpy = jest.spyOn(global, "setInterval");

      setup({ token: null });

      expect(setIntervalSpy).not.toHaveBeenCalled();
      setIntervalSpy.mockRestore();
    });
  });

  describe("concurrency", () => {
    it("keeps a single renewal in flight across overlapping ticks", async () => {
      let resolveRefresh: (value: { token: string }) => void = () => undefined;
      mockRefreshToken.mockImplementation(
        () =>
          new Promise<{ token: string }>((resolve) => {
            resolveRefresh = resolve;
          })
      );

      setup();
      simulateUserActivity();
      advanceIntoRenewalWindow();
      advanceBy(SESSION_CHECK_INTERVAL_MS);
      advanceBy(SESSION_CHECK_INTERVAL_MS);

      expect(mockRefreshToken).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveRefresh({ token: NEW_TOKEN });
      });
    });
  });

  describe("when the renewal fails", () => {
    it("does not log out immediately and expires only once the token is past due", async () => {
      mockRefreshToken.mockRejectedValue(new Error("network down"));
      const { onRefreshed, onExpired } = setup();

      simulateUserActivity();
      advanceIntoRenewalWindow();
      await act(async () => undefined);

      expect(mockRefreshToken).toHaveBeenCalled();
      expect(onRefreshed).not.toHaveBeenCalled();
      expect(onExpired).not.toHaveBeenCalled();

      advanceBy(SESSION_REFRESH_LEAD_MS);
      await act(async () => undefined);

      expect(onExpired).toHaveBeenCalled();
    });
  });

  describe("cross-tab coherence", () => {
    it("adopts a token renewed by another tab", () => {
      const { onRefreshed } = setup();

      act(() => {
        window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: NEW_TOKEN }));
      });

      expect(onRefreshed).toHaveBeenCalledWith(NEW_TOKEN);
      expect(mockRefreshToken).not.toHaveBeenCalled();
    });

    it("ignores storage events for other keys", () => {
      const { onRefreshed } = setup();

      act(() => {
        window.dispatchEvent(new StorageEvent("storage", { key: "currentRoleId", newValue: "R1" }));
      });

      expect(onRefreshed).not.toHaveBeenCalled();
    });

    it("ignores a storage event carrying the token already in use", () => {
      const { onRefreshed, token } = setup();

      act(() => {
        window.dispatchEvent(new StorageEvent("storage", { key: "token", newValue: token }));
      });

      expect(onRefreshed).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("removes listeners and clears the interval on unmount", () => {
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      const { unmount, onExpired } = setup();
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();

      advanceBy(TOKEN_LIFETIME_MS * 2);
      expect(onExpired).not.toHaveBeenCalled();

      removeEventListenerSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });
});

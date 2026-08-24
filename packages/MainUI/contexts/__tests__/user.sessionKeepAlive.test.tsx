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

import { useEffect } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import UserProvider from "../user";
import { useUserStore } from "@/stores/userStore";
import { getSession } from "@workspaceui/api-client/src/api/getSession";
import { getPreferences } from "@workspaceui/api-client/src/api/getPreferences";
import { logout as doLogout } from "@workspaceui/api-client/src/api/authentication";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot/client";
import { useSessionKeepAlive } from "@/hooks/useSessionKeepAlive";
import { buildToken, buildTokenExpiringAt } from "@/utils/testUtils/sessionTokens";
import { isTokenExpired } from "@/utils/session/token";
import { HTTP_CODES } from "@workspaceui/api-client/src/api/constants";

interface KeepAliveParams {
  token: string | null;
  onRefreshed: (token: string) => void;
  onExpired: () => void;
}

/**
 * Stand-in that reproduces the only behavior the provider relies on: report expiry on mount.
 *
 * Named as a hook because it is one: it runs inside the provider's render and calls `useEffect`.
 */
function useKeepAliveStub({ token, onExpired }: KeepAliveParams) {
  useEffect(() => {
    if (isTokenExpired(token)) onExpired();
  }, [token, onExpired]);
}

// jest.setup.js mocks @/contexts/user globally; we need the real provider here.
jest.unmock("@/contexts/user");

jest.mock("@workspaceui/api-client/src/api/authentication", () => ({
  login: jest.fn(),
  logout: jest.fn(),
  refreshToken: jest.fn(),
}));
jest.mock("@workspaceui/api-client/src/api/getSession", () => ({ getSession: jest.fn() }));
jest.mock("@workspaceui/api-client/src/api/getPreferences", () => ({ getPreferences: jest.fn() }));
jest.mock("@workspaceui/api-client/src/api/changeProfile", () => ({ changeProfile: jest.fn() }));
jest.mock("@workspaceui/api-client/src/api/changePassword", () => ({ changePassword: jest.fn() }));
jest.mock("@workspaceui/api-client/src/api/defaultConfig", () => ({ setDefaultConfiguration: jest.fn() }));
jest.mock("@workspaceui/api-client/src/api/constants", () => ({
  HTTP_CODES: { UNAUTHORIZED: 401, INTERNAL_SERVER_ERROR: 500 },
}));
jest.mock("@workspaceui/api-client/src/api/metadata", () => ({
  Metadata: { setToken: jest.fn(), registerInterceptor: jest.fn(() => jest.fn()) },
}));
jest.mock("@workspaceui/api-client/src/api/datasource", () => ({
  datasource: { setToken: jest.fn(), registerInterceptor: jest.fn(() => jest.fn()) },
}));
jest.mock("@workspaceui/api-client/src/api/copilot/client", () => ({
  CopilotClient: { setToken: jest.fn(), registerInterceptor: jest.fn(() => jest.fn()) },
}));
jest.mock("@/contexts/language", () => ({
  useLanguage: () => ({ language: "en_US", setLanguage: jest.fn() }),
}));
jest.mock("@/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
jest.mock("@/utils/propertyStore", () => ({
  savePreferences: jest.fn(),
  clearPreferences: jest.fn(),
}));
jest.mock("@/screens/Login", () => ({
  __esModule: true,
  default: () => {
    const ReactLib = require("react");
    return ReactLib.createElement("div", { "data-testid": "login-screen" });
  },
}));

// The hook's own behavior is covered by its test file; here it is replaced by a spy so the
// provider's callbacks can be driven directly. It still honours the one part of the hook's
// contract the provider depends on: an already-expired token is reported on mount.
jest.mock("@/hooks/useSessionKeepAlive", () => ({ useSessionKeepAlive: jest.fn() }));

const INITIAL_TOKEN = "initial-jwt";
const RENEWED_TOKEN = "renewed-jwt";

const makeSessionResponse = () => ({
  user: { id: "u1", name: "John", client$_identifier: "john@acme.com", image: "", defaultLanguage: "en_US" },
  attributes: {},
  currentClient: { id: "c1", name: "Acme" },
  currentOrganization: { id: "o1", name: "Org" },
  currentRole: { id: "r1", name: "Admin" },
  currentWarehouse: { id: "w1", name: "WH" },
  roles: [],
  languages: {},
});

/** Returns the callbacks the provider handed to the keep-alive hook on its latest render. */
function getKeepAliveCallbacks() {
  const calls = (useSessionKeepAlive as jest.Mock).mock.calls;
  return calls[calls.length - 1][0] as { onRefreshed: (token: string) => void; onExpired: () => void };
}

function Dashboard() {
  return <div data-testid="dashboard" />;
}

/** Renders the provider already authenticated and waits until the app content is mounted. */
async function renderAuthenticatedProvider() {
  useUserStore.setState({ token: INITIAL_TOKEN });

  const view = render(
    <UserProvider>
      <Dashboard />
    </UserProvider>
  );

  await screen.findByTestId("dashboard");

  return view;
}

describe("UserProvider session keep-alive", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useUserStore.setState({ token: null, currentRole: undefined, prevRole: undefined, roles: [] });
    (getPreferences as jest.Mock).mockResolvedValue({});
    (getSession as jest.Mock).mockResolvedValue(makeSessionResponse());
    (useSessionKeepAlive as jest.Mock).mockImplementation(useKeepAliveStub);
  });

  describe("a silent renewal is transparent", () => {
    it("adopts the new token without re-verifying the session", async () => {
      await renderAuthenticatedProvider();
      expect(getSession).toHaveBeenCalledTimes(1);

      act(() => getKeepAliveCallbacks().onRefreshed(RENEWED_TOKEN));

      await waitFor(() => expect(useUserStore.getState().token).toBe(RENEWED_TOKEN));
      // The whole point of the ticket: no second session verification.
      expect(getSession).toHaveBeenCalledTimes(1);
    });

    it("keeps the app mounted instead of showing the session loader", async () => {
      await renderAuthenticatedProvider();
      const dashboard = screen.getByTestId("dashboard");

      act(() => getKeepAliveCallbacks().onRefreshed(RENEWED_TOKEN));

      await waitFor(() => expect(useUserStore.getState().token).toBe(RENEWED_TOKEN));
      // Same DOM node: the tree was never unmounted, so in-progress work survives.
      expect(screen.getByTestId("dashboard")).toBe(dashboard);
    });

    it("pushes the new token to every API client", async () => {
      await renderAuthenticatedProvider();
      (Metadata.setToken as jest.Mock).mockClear();
      (datasource.setToken as jest.Mock).mockClear();
      (CopilotClient.setToken as jest.Mock).mockClear();

      act(() => getKeepAliveCallbacks().onRefreshed(RENEWED_TOKEN));

      expect(Metadata.setToken).toHaveBeenCalledWith(RENEWED_TOKEN);
      expect(datasource.setToken).toHaveBeenCalledWith(RENEWED_TOKEN);
      expect(CopilotClient.setToken).toHaveBeenCalledWith(RENEWED_TOKEN);
      expect(localStorage.setItem).toHaveBeenCalledWith("token", RENEWED_TOKEN);
    });
  });

  describe("expiration", () => {
    it("logs out and explains that the session expired through inactivity", async () => {
      await renderAuthenticatedProvider();

      act(() => getKeepAliveCallbacks().onExpired());

      await waitFor(() => expect(useUserStore.getState().token).toBeNull());
      expect(doLogout).toHaveBeenCalled();
      expect(useUserStore.getState().loginErrorText).toBe("login.errors.sessionExpired.title");
      expect(useUserStore.getState().loginErrorDescription).toBe("login.errors.sessionExpired.description");
      expect(await screen.findByTestId("login-screen")).toBeTruthy();
    });
  });

  // The reported scenario: log in, close the tab, come back once the token has expired.
  describe("booting with an already-expired token", () => {
    /** Mounts the provider with the given token already in the store, as a page reload would. */
    function renderWithStoredToken(token: string) {
      useUserStore.setState({ token });

      return render(
        <UserProvider>
          <Dashboard />
        </UserProvider>
      );
    }

    it("does not verify the session nor mount the app", async () => {
      renderWithStoredToken(buildTokenExpiringAt(Date.now() - 1000));

      expect(await screen.findByTestId("login-screen")).toBeTruthy();
      // No burst of doomed requests: this is what produced the misleading "system error" message.
      expect(getSession).not.toHaveBeenCalled();
      expect(screen.queryByTestId("dashboard")).toBeNull();
    });

    it("still verifies the session for a token that has not expired", async () => {
      renderWithStoredToken(buildTokenExpiringAt(Date.now() + 60_000));

      await screen.findByTestId("dashboard");
      expect(getSession).toHaveBeenCalledTimes(1);
    });

    it("still verifies the session when expiration is disabled", async () => {
      renderWithStoredToken(buildToken({ user: "U1" }));

      await screen.findByTestId("dashboard");
      expect(getSession).toHaveBeenCalledTimes(1);
    });
  });

  describe("the 401 safety net picks the right message", () => {
    beforeEach(() => {
      // Neutralize the keep-alive so the interceptor is exercised on its own: this covers the
      // cases that reach a 401 before the tick does (clock skew, a failed renewal).
      (useSessionKeepAlive as jest.Mock).mockImplementation(() => undefined);
    });

    /** Mounts the provider, then runs the registered interceptor against a 401 response. */
    async function fire401(token: string) {
      useUserStore.setState({ token });
      render(
        <UserProvider>
          <Dashboard />
        </UserProvider>
      );
      await screen.findByTestId("dashboard");

      const interceptor = (Metadata.registerInterceptor as jest.Mock).mock.calls[0][0];
      await act(async () => {
        interceptor({ status: HTTP_CODES.UNAUTHORIZED, url: "https://erp/meta/menu" });
      });
    }

    it("blames inactivity when the token had expired", async () => {
      await fire401(buildTokenExpiringAt(Date.now() - 1000));

      expect(useUserStore.getState().loginErrorText).toBe("login.errors.sessionExpired.title");
      expect(useUserStore.getState().loginErrorDescription).toBe("login.errors.sessionExpired.description");
    });

    // No regression: a 401 with a perfectly valid token is still a system error.
    it("keeps the generic system error for a token that has not expired", async () => {
      await fire401(buildTokenExpiringAt(Date.now() + 60_000));

      expect(useUserStore.getState().loginErrorText).toBe("login.errors.defaultLogout.title");
    });

    // And so is a 401 while expiration is disabled instance-wide.
    it("keeps the generic system error when the token has no expiration", async () => {
      await fire401(buildToken({ user: "U1" }));

      expect(useUserStore.getState().loginErrorText).toBe("login.errors.defaultLogout.title");
    });
  });

  describe("no regression on the normal paths", () => {
    it("still verifies the session when the token changes for any other reason", async () => {
      await renderAuthenticatedProvider();
      expect(getSession).toHaveBeenCalledTimes(1);

      act(() => useUserStore.getState().setToken("token-from-role-switch"));

      await waitFor(() => expect(getSession).toHaveBeenCalledTimes(2));
    });

    it("verifies again on the next token change after a silent renewal", async () => {
      await renderAuthenticatedProvider();

      act(() => getKeepAliveCallbacks().onRefreshed(RENEWED_TOKEN));
      await waitFor(() => expect(useUserStore.getState().token).toBe(RENEWED_TOKEN));
      expect(getSession).toHaveBeenCalledTimes(1);

      act(() => useUserStore.getState().setToken("token-from-role-switch"));

      await waitFor(() => expect(getSession).toHaveBeenCalledTimes(2));
    });
  });
});

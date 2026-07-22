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

import { useContext } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import UserProvider, { UserContext } from "../user";
import { useUserStore } from "@/stores/userStore";
import { login as doLogin, logout as doLogout } from "@workspaceui/api-client/src/api/authentication";
import { getSession } from "@workspaceui/api-client/src/api/getSession";
import { getPreferences } from "@workspaceui/api-client/src/api/getPreferences";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot/client";

// ── Mocks ─────────────────────────────────────────────────────────────────

// jest.setup.js mocks @/contexts/user globally; we need the real provider here.
jest.unmock("@/contexts/user");

jest.mock("@workspaceui/api-client/src/api/authentication", () => ({
  login: jest.fn(),
  logout: jest.fn(),
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

// The login screen is the only thing rendered while logged out, so it doubles
// as the entry point to trigger login() from within the provider tree.
jest.mock("@/screens/Login", () => {
  const ReactLib = require("react");
  return {
    __esModule: true,
    default: () => {
      const { UserContext: Ctx } = require("../user");
      const ctx = ReactLib.useContext(Ctx);
      return ReactLib.createElement(
        "button",
        { "data-testid": "trigger-login", onClick: () => ctx.login("user", "pass") },
        "login"
      );
    },
  };
});

// ── Helpers ─────────────────────────────────────────────────────────────────

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

/** A deferred promise whose resolution can be controlled from the test. */
const createDeferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

function Dashboard() {
  const ctx = useContext(UserContext);
  return (
    <div data-testid="dashboard">
      <button type="button" data-testid="trigger-logout" onClick={() => ctx.logout()}>
        logout
      </button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <UserProvider>
      <Dashboard />
    </UserProvider>
  );

describe("UserProvider auth UX", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useUserStore.setState({ token: null, currentRole: undefined, prevRole: undefined, roles: [] });
    (getPreferences as jest.Mock).mockResolvedValue({});
    (doLogin as jest.Mock).mockResolvedValue({ token: "jwt-token" });
  });

  it("keeps the SessionLoading gate until the session is loaded after login", async () => {
    const deferred = createDeferred<ReturnType<typeof makeSessionResponse>>();
    (getSession as jest.Mock).mockReturnValue(deferred.promise);

    renderProvider();

    // Logged out: the login screen (trigger) is shown, not the dashboard.
    const trigger = await screen.findByTestId("trigger-login");
    expect(screen.queryByTestId("dashboard")).toBeNull();

    fireEvent.click(trigger);

    // While getSession is in flight the loader is shown and the dashboard is not.
    expect(await screen.findByTestId("SessionLoading__container")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).toBeNull();

    // Once the session resolves, the dashboard replaces the loader.
    deferred.resolve(makeSessionResponse());
    expect(await screen.findByTestId("dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("SessionLoading__container")).toBeNull();
  });

  it("clears every client token on logout and never re-throws when the backend fails", async () => {
    (getSession as jest.Mock).mockResolvedValue(makeSessionResponse());
    (doLogout as jest.Mock).mockRejectedValue(new Error("network down"));

    renderProvider();

    fireEvent.click(await screen.findByTestId("trigger-login"));
    const logoutButton = await screen.findByTestId("trigger-logout");

    // Ignore the setToken calls made during login; only assert the logout ones.
    (Metadata.setToken as jest.Mock).mockClear();
    (datasource.setToken as jest.Mock).mockClear();
    (CopilotClient.setToken as jest.Mock).mockClear();

    fireEvent.click(logoutButton);

    // Back to the logged-out screen even though doLogout rejected.
    expect(await screen.findByTestId("trigger-login")).toBeInTheDocument();
    expect(Metadata.setToken).toHaveBeenCalledWith("");
    expect(datasource.setToken).toHaveBeenCalledWith("");
    expect(CopilotClient.setToken).toHaveBeenCalledWith("");
    expect(useUserStore.getState().token).toBeNull();
  });
});

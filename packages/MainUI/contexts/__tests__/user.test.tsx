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
import { changePassword as doChangePassword } from "@workspaceui/api-client/src/api/changePassword";
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
  const MockLoginScreen = () => {
    const { UserContext: Ctx } = require("../user");
    const ctx = ReactLib.useContext(Ctx);
    return ReactLib.createElement(
      "button",
      { "data-testid": "trigger-login", onClick: () => ctx.login("user", "pass") },
      "login"
    );
  };
  return { __esModule: true, default: MockLoginScreen };
});

// Stands in for the mandatory password-change screen, exposing the context action it submits and
// surfacing the rejection the way the real screen does (caught and rendered, never re-thrown).
jest.mock("@/screens/ForcePasswordChange", () => {
  const ReactLib = require("react");
  const MockForcePasswordChangeScreen = () => {
    const { UserContext: Ctx } = require("../user");
    const ctx = ReactLib.useContext(Ctx);
    const [error, setError] = ReactLib.useState("");
    const submit = async () => {
      try {
        await ctx.completeExpiredPasswordChange({ newPwd: NEW_PASSWORD, confirmPwd: NEW_PASSWORD });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    return ReactLib.createElement(
      "button",
      { "data-testid": "trigger-password-change", onClick: submit },
      error || "change"
    );
  };
  return { __esModule: true, default: MockForcePasswordChangeScreen };
});

// ── Helpers ─────────────────────────────────────────────────────────────────

const NEW_PASSWORD = "Str0ng-P4ss!";

const makeSessionResponse = (passwordExpired = false) => ({
  user: { id: "u1", name: "John", client$_identifier: "john@acme.com", image: "", defaultLanguage: "en_US" },
  attributes: {},
  currentClient: { id: "c1", name: "Acme" },
  currentOrganization: { id: "o1", name: "Org" },
  currentRole: { id: "r1", name: "Admin" },
  currentWarehouse: { id: "w1", name: "WH" },
  roles: [],
  languages: {},
  passwordExpired,
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
    useUserStore.setState({
      token: null,
      currentRole: undefined,
      prevRole: undefined,
      roles: [],
      passwordExpired: false,
      loginErrorText: "",
      loginErrorDescription: "",
    });
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

describe("UserProvider expired password gate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useUserStore.setState({
      token: null,
      currentRole: undefined,
      prevRole: undefined,
      roles: [],
      passwordExpired: false,
      loginErrorText: "",
      loginErrorDescription: "",
    });
    (getPreferences as jest.Mock).mockResolvedValue({});
    (doLogin as jest.Mock).mockResolvedValue({ token: "jwt-token" });
  });

  /** Logs in with a session that reports the password as expired. */
  const loginWithExpiredPassword = async () => {
    (getSession as jest.Mock).mockResolvedValue(makeSessionResponse(true));
    renderProvider();
    fireEvent.click(await screen.findByTestId("trigger-login"));
    return screen.findByTestId("trigger-password-change");
  };

  it("replaces the app with the mandatory change screen when the password is expired", async () => {
    await loginWithExpiredPassword();

    expect(screen.queryByTestId("dashboard")).toBeNull();
    expect(useUserStore.getState().passwordExpired).toBe(true);
  });

  it("grants access after the password is changed successfully", async () => {
    const trigger = await loginWithExpiredPassword();

    // The reload triggered by the change reports the password as valid again.
    (getSession as jest.Mock).mockResolvedValue(makeSessionResponse(false));
    fireEvent.click(trigger);

    expect(await screen.findByTestId("dashboard")).toBeInTheDocument();
    expect(doChangePassword).toHaveBeenCalledWith({
      currentPwd: "pass",
      newPwd: NEW_PASSWORD,
      confirmPwd: NEW_PASSWORD,
    });
    expect(useUserStore.getState().passwordExpired).toBe(false);
  });

  it("keeps the change screen open when the change fails", async () => {
    const trigger = await loginWithExpiredPassword();
    (doChangePassword as jest.Mock).mockRejectedValue(new Error("CPPasswordNotStrongEnough"));

    fireEvent.click(trigger);

    expect(await screen.findByTestId("trigger-password-change")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard")).toBeNull();
    expect(getSession).toHaveBeenCalledTimes(1);
  });

  it("does not log the user out on the 401 the backend returns while the password is expired", async () => {
    await loginWithExpiredPassword();

    const interceptor = (Metadata.registerInterceptor as jest.Mock).mock.calls[0][0];
    const blockedResponse = { status: 401, url: "https://erp/sws/com.etendoerp.metadata.meta/window/123" };

    expect(interceptor(blockedResponse)).toBe(blockedResponse);
    expect(await screen.findByTestId("trigger-password-change")).toBeInTheDocument();
    expect(useUserStore.getState().token).toBe("jwt-token");
    expect(useUserStore.getState().loginErrorText).toBe("");
  });

  it("goes directly to the app when the password is valid", async () => {
    (getSession as jest.Mock).mockResolvedValue(makeSessionResponse(false));
    renderProvider();

    fireEvent.click(await screen.findByTestId("trigger-login"));

    expect(await screen.findByTestId("dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("trigger-password-change")).toBeNull();
  });
});

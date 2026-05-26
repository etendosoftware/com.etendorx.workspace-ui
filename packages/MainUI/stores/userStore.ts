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

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { LanguageOption } from "@/contexts/types";
import type {
  ISession,
  ProfileInfo,
  SessionResponse,
  User,
  CurrentWarehouse,
  CurrentRole,
  CurrentClient,
  CurrentOrganization,
} from "@workspaceui/api-client/src/api/types";

const INITIAL_PROFILE: ProfileInfo = { name: "", email: "", image: "" };

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

export interface UserStore {
  // Auth
  token: string | null;
  setToken: (token: string | null) => void;

  // Profile
  user: User;
  setUser: (user: User) => void;
  profile: ProfileInfo;
  setProfile: (profile: ProfileInfo) => void;
  roles: SessionResponse["roles"];
  setRoles: (roles: SessionResponse["roles"]) => void;
  /** Updated atomically when setCurrentRole is called. */
  currentRole: CurrentRole | undefined;
  prevRole: CurrentRole | undefined;
  setCurrentRole: (role: CurrentRole | undefined) => void;
  languages: LanguageOption[];
  setLanguages: (languages: LanguageOption[]) => void;

  // Organization
  currentClient: CurrentClient | undefined;
  setCurrentClient: (client: CurrentClient | undefined) => void;
  currentOrganization: CurrentOrganization | undefined;
  setCurrentOrganization: (org: CurrentOrganization | undefined) => void;
  currentWarehouse: CurrentWarehouse | undefined;
  setCurrentWarehouse: (warehouse: CurrentWarehouse | undefined) => void;

  // Session
  session: ISession;
  /**
   * Accepts either a new session object or an updater function (prev => next).
   * Supports both forms so callers can do partial merges:
   *   setSession(s => ({ ...s, ...attrs }))
   */
  setSession: (sessionOrUpdater: ISession | ((prev: ISession) => ISession)) => void;
  isSessionSyncLoading: boolean;
  setSessionSyncLoading: (loading: boolean) => void;

  // UI / error states
  loginErrorText: string;
  setLoginErrorText: (text: string) => void;
  loginErrorDescription: string;
  setLoginErrorDescription: (description: string) => void;
  isCopilotInstalled: boolean;
  setIsCopilotInstalled: (installed: boolean) => void;

  // Helpers
  getCsrfToken: () => string;

  /**
   * Resets all user state and clears localStorage keys.
   * Does NOT clear the language — UserProvider wraps this and additionally
   * calls setLanguage(null) since that requires a React hook.
   */
  clearUserDataState: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readLocalStorageJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readLocalStorageString(key: string, fallback: string | null): string | null {
  if (typeof window === "undefined") return fallback;
  return localStorage.getItem(key) ?? fallback;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      // ── Auth ──────────────────────────────────────────────────────────────
      token: readLocalStorageString("token", null),
      setToken: (token) => {
        if (token === null) {
          localStorage.removeItem("token");
        } else {
          localStorage.setItem("token", token);
        }
        set({ token }, false, "setToken");
      },

      // ── Profile ───────────────────────────────────────────────────────────
      user: {} as User,
      setUser: (user) => set({ user }, false, "setUser"),

      profile: readLocalStorageJson<ProfileInfo>("currentInfo", INITIAL_PROFILE),
      setProfile: (profile) => set({ profile }, false, "setProfile"),

      roles: readLocalStorageJson<SessionResponse["roles"]>("roles", []),
      setRoles: (roles) => set({ roles }, false, "setRoles"),

      currentRole: undefined,
      prevRole: undefined,
      /** Atomically shift currentRole → prevRole before applying the new value. */
      setCurrentRole: (role) =>
        set((state) => ({ prevRole: state.currentRole, currentRole: role }), false, "setCurrentRole"),

      languages: [],
      setLanguages: (languages) => set({ languages }, false, "setLanguages"),

      // ── Organization ──────────────────────────────────────────────────────
      currentClient: undefined,
      setCurrentClient: (currentClient) => set({ currentClient }, false, "setCurrentClient"),

      currentOrganization: undefined,
      setCurrentOrganization: (currentOrganization) => set({ currentOrganization }, false, "setCurrentOrganization"),

      currentWarehouse: undefined,
      setCurrentWarehouse: (currentWarehouse) => set({ currentWarehouse }, false, "setCurrentWarehouse"),

      // ── Session ───────────────────────────────────────────────────────────
      session: {},
      setSession: (sessionOrUpdater) =>
        set(
          (state) => ({
            session: typeof sessionOrUpdater === "function" ? sessionOrUpdater(state.session) : sessionOrUpdater,
          }),
          false,
          "setSession"
        ),

      isSessionSyncLoading: false,
      setSessionSyncLoading: (isSessionSyncLoading) => set({ isSessionSyncLoading }, false, "setSessionSyncLoading"),

      // ── UI ────────────────────────────────────────────────────────────────
      loginErrorText: "",
      setLoginErrorText: (loginErrorText) => set({ loginErrorText }, false, "setLoginErrorText"),

      loginErrorDescription: "",
      setLoginErrorDescription: (loginErrorDescription) =>
        set({ loginErrorDescription }, false, "setLoginErrorDescription"),

      isCopilotInstalled: false,
      setIsCopilotInstalled: (isCopilotInstalled) => set({ isCopilotInstalled }, false, "setIsCopilotInstalled"),

      // ── Helpers ───────────────────────────────────────────────────────────
      getCsrfToken: () => {
        const { session } = get();
        return (session.csrfToken as string) || localStorage.getItem("csrfToken") || "";
      },

      // ── Cleanup ───────────────────────────────────────────────────────────
      clearUserDataState: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("roles");
        localStorage.removeItem("currentRole");
        localStorage.removeItem("currentInfo");
        localStorage.removeItem("currentWarehouse");
        localStorage.removeItem("currentLanguage");
        localStorage.removeItem("language");
        set(
          {
            token: null,
            roles: [],
            currentRole: undefined,
            prevRole: undefined,
            currentWarehouse: undefined,
            currentOrganization: undefined,
            currentClient: undefined,
            profile: INITIAL_PROFILE,
            user: {} as User,
            session: {},
            loginErrorText: "",
            loginErrorDescription: "",
          },
          false,
          "clearUserDataState"
        );
      },
    }),
    { name: "UserStore" }
  )
);

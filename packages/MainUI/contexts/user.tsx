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

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { logger } from "../utils/logger";
import { Metadata } from "@workspaceui/api-client/src/api/metadata";
import { datasource } from "@workspaceui/api-client/src/api/datasource";
import { login as doLogin, logout as doLogout } from "@workspaceui/api-client/src/api/authentication";
import { changeProfile as doChangeProfile } from "@workspaceui/api-client/src/api/changeProfile";
import { changePassword as doChangePassword } from "@workspaceui/api-client/src/api/changePassword";
import { getSession } from "@workspaceui/api-client/src/api/getSession";
import { getPreferences } from "@workspaceui/api-client/src/api/getPreferences";
import { savePreferences, clearPreferences } from "@/utils/propertyStore";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot/client";
import { HTTP_CODES } from "@workspaceui/api-client/src/api/constants";
import type { DefaultConfiguration, IUserContext, Language, LanguageOption } from "./types";
import type { ISession, ProfileInfo, SessionResponse } from "@workspaceui/api-client/src/api/types";
import { setDefaultConfiguration as apiSetDefaultConfiguration } from "@workspaceui/api-client/src/api/defaultConfig";
import { useLanguage } from "./language";
import LoginScreen from "@/screens/Login";
import SessionLoading from "@/components/SessionLoading";
import { useRouter } from "next/navigation";
import { useTranslation } from "../hooks/useTranslation";
import { useUserStore } from "@/stores/userStore";

export const UserContext = createContext({} as IUserContext);

export default function UserProvider(props: React.PropsWithChildren) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);
  // Drives the full-screen SessionLoading gate. Kept separate from
  // isVerifyingSession, which guards verifySession against re-entrancy and
  // therefore cannot be pre-set from login() without skipping the load.
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  // ── Subscribe to all store state so the context value stays reactive ──────
  // Each subscription is granular; UserProvider re-renders only when one of
  // these slices changes, keeping re-renders as focused as possible while
  // still propagating updates to legacy consumers of UserContext.
  const token = useUserStore((s) => s.token);
  const user = useUserStore((s) => s.user);
  const profile = useUserStore((s) => s.profile);
  const roles = useUserStore((s) => s.roles);
  const currentRole = useUserStore((s) => s.currentRole);
  const prevRole = useUserStore((s) => s.prevRole);
  const currentClient = useUserStore((s) => s.currentClient);
  const currentOrganization = useUserStore((s) => s.currentOrganization);
  const currentWarehouse = useUserStore((s) => s.currentWarehouse);
  const session = useUserStore((s) => s.session);
  const languages = useUserStore((s) => s.languages);
  const isSessionSyncLoading = useUserStore((s) => s.isSessionSyncLoading);
  const isCopilotInstalled = useUserStore((s) => s.isCopilotInstalled);
  const loginErrorText = useUserStore((s) => s.loginErrorText);
  const loginErrorDescription = useUserStore((s) => s.loginErrorDescription);

  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  // ── Helpers ───────────────────────────────────────────────────────────────

  const updateProfile = useCallback((newProfile: ProfileInfo) => {
    useUserStore.getState().setProfile(newProfile);
    localStorage.setItem("currentInfo", JSON.stringify(newProfile));
  }, []);

  const updateSessionInfo = useCallback(
    async (sessionResponse: SessionResponse) => {
      const currentProfileInfo: ProfileInfo = {
        name: sessionResponse.user.name,
        email: sessionResponse.user.client$_identifier,
        image: sessionResponse.user.image || "",
      };

      useUserStore.getState().setSession((prev: ISession) => ({
        ...prev,
        ...sessionResponse.attributes,
        "#AD_Org_ID": sessionResponse.currentOrganization.id,
        adOrgId: sessionResponse.currentOrganization.id,
        "#AD_Client_ID": sessionResponse.currentClient.id,
        AD_CLIENT_ID: sessionResponse.currentClient.id,
      }));

      updateProfile(currentProfileInfo);
      useUserStore.getState().setUser(sessionResponse.user);

      localStorage.setItem("currentInfo", JSON.stringify(currentProfileInfo));
      localStorage.setItem("currentRole", JSON.stringify(sessionResponse.currentRole));
      localStorage.setItem("currentRoleId", sessionResponse.currentRole.id);

      const defaultLanguage = sessionResponse.user.defaultLanguage as Language;
      if (!language && defaultLanguage) {
        setLanguage(defaultLanguage);
      }

      useUserStore.getState().setLanguages(Object.values(sessionResponse.languages) as LanguageOption[]);
      useUserStore.getState().setCurrentClient(sessionResponse.currentClient);
      useUserStore.getState().setCurrentRole(sessionResponse.currentRole);
      useUserStore.getState().setCurrentOrganization(sessionResponse.currentOrganization);
      useUserStore.getState().setCurrentWarehouse(sessionResponse.currentWarehouse);
      useUserStore.getState().setRoles(sessionResponse.roles);

      try {
        const prefs = await getPreferences();
        savePreferences(prefs);
      } catch (prefError) {
        logger.warn("Failed to load preferences:", prefError);
      }
    },
    [language, setLanguage, updateProfile]
  );

  // ── Actions ───────────────────────────────────────────────────────────────

  const setDefaultConfiguration = useCallback(async (config: DefaultConfiguration) => {
    try {
      return await apiSetDefaultConfiguration(config);
    } catch (error) {
      logger.warn("Error setting default configuration:", error);
      throw error;
    }
  }, []);

  /**
   * Resets all user state (via store) and clears the language —
   * which requires the useLanguage hook and therefore lives here.
   */
  const clearUserData = useCallback(() => {
    useUserStore.getState().clearUserDataState();
    clearPreferences();
    setLanguage(null);
  }, [setLanguage]);

  const changeProfile = useCallback(
    async (params: { role?: string; client?: string; organization?: string; warehouse?: string }) => {
      const currentToken = useUserStore.getState().token;
      if (!currentToken) {
        throw new Error("Authentication token is not available");
      }

      try {
        const response = await doChangeProfile(params);

        if (params.role) {
          localStorage.setItem("currentRoleId", params.role);
        }
        localStorage.setItem("token", response.token);
        useUserStore.getState().setToken(response.token);

        Metadata.setToken(response.token);
        datasource.setToken(response.token);
        CopilotClient.setToken(response.token);

        const sessionData = await getSession();
        await updateSessionInfo(sessionData);
      } catch (error) {
        logger.warn("Error updating profile:", error);
        throw error;
      }
    },
    [updateSessionInfo]
  );

  const changePassword = useCallback(async (params: { currentPwd: string; newPwd: string; confirmPwd: string }) => {
    try {
      await doChangePassword(params);
    } catch (error) {
      logger.warn("Error changing password:", error instanceof Error ? error.message : "Unknown error");
      throw error;
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      Metadata.setToken("");
      datasource.setToken("");
      CopilotClient.setToken("");

      const loginResponse = await doLogin(username, password);

      localStorage.setItem("token", loginResponse.token);
      Metadata.setToken(loginResponse.token);
      datasource.setToken(loginResponse.token);
      CopilotClient.setToken(loginResponse.token);
      // Show the session loader from the very first render after the token is
      // set, so the dashboard never flashes empty while getSession is in flight.
      setIsSessionLoading(true);
      useUserStore.getState().setToken(loginResponse.token);
    } catch (e) {
      logger.warn("Login or session retrieval error:", e);
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    // Optimistic logout: clear local state and every client token first so the
    // user is fully logged out regardless of the backend outcome. The backend
    // call is best-effort (the JWT is stateless and cannot be revoked), so its
    // failure is swallowed and never surfaces as an unhandled rejection.
    clearUserData();
    Metadata.setToken("");
    datasource.setToken("");
    CopilotClient.setToken("");

    try {
      await doLogout();
    } catch (error) {
      logger.warn("Logout error:", error);
    }
  }, [clearUserData]);

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const verifySession = async () => {
      if (isVerifyingSession) return;
      try {
        if (token) {
          setIsVerifyingSession(true);
          setIsSessionLoading(true);
          let activeToken = token;

          const savedRoleId = localStorage.getItem("currentRoleId");
          if (savedRoleId) {
            try {
              const [, payloadB64] = token.split(".");
              const payload = JSON.parse(atob(payloadB64));
              if (payload.role !== savedRoleId) {
                const refreshed = await doChangeProfile({ role: savedRoleId });
                activeToken = refreshed.token;
                localStorage.setItem("token", activeToken);
                useUserStore.getState().setToken(activeToken);
              }
            } catch {
              // JWT decode or changeProfile failed — proceed with the stored token
            }
          }

          Metadata.setToken(activeToken);
          datasource.setToken(activeToken);
          CopilotClient.setToken(activeToken);
          const sessionData = await getSession();
          await updateSessionInfo(sessionData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsVerifyingSession(false);
        setIsSessionLoading(false);
        setReady(true);
      }
    };

    verifySession().catch(logger.warn);
    // updateSessionInfo is intentionally excluded to avoid re-running on every
    // language change; it is stable enough for the session verification flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const interceptor = (response: Response) => {
      const isIgnorableError =
        (response.status === HTTP_CODES.INTERNAL_SERVER_ERROR || response.status === HTTP_CODES.UNAUTHORIZED) &&
        (response.url.includes("meta/window") ||
          response.url.includes("meta/tab") ||
          response.url.includes("meta/toolbar") ||
          response.url.includes("api/datasource") ||
          response.url.includes("org.openbravo.client.kernel") ||
          response.url.includes("meta/labels") ||
          response.url.includes("utility/ReferencedLink") ||
          response.url.includes("meta/widget") ||
          response.url.includes("meta/dashboard"));

      if (
        (response.status === HTTP_CODES.UNAUTHORIZED || response.status === HTTP_CODES.INTERNAL_SERVER_ERROR) &&
        !isIgnorableError
      ) {
        logout();
        useUserStore.getState().setLoginErrorText(t("login.errors.defaultLogout.title"));
        useUserStore.getState().setLoginErrorDescription(t("login.errors.defaultLogout.description"));
      }

      return response;
    };

    if (token) {
      const unregisterMetadataInterceptor = Metadata.registerInterceptor(interceptor);
      const unregisterDatasourceInterceptor = datasource.registerInterceptor(interceptor);
      const unregisterCopilotInterceptor = CopilotClient.registerInterceptor(interceptor);

      return () => {
        unregisterMetadataInterceptor();
        unregisterDatasourceInterceptor();
        unregisterCopilotInterceptor();
      };
    }
  }, [logout, t, token]);

  useEffect(() => {
    if (ready && prevRole && prevRole?.id !== currentRole?.id) {
      router.push("/");
    }
  }, [currentRole?.id, prevRole, ready, router]);

  // ── Context value (backward-compat — provides full IUserContext) ───────────
  //
  // All state fields are sourced from the Zustand store (subscribed above).
  // Legacy consumers using useContext(UserContext) or useUserContext() continue
  // to work unchanged.  New code should import selectors from useUserStore
  // directly for finer-grained subscriptions.

  const value = useMemo<IUserContext>(
    () => ({
      // State (from store subscriptions)
      token,
      user,
      profile,
      roles,
      currentRole,
      prevRole,
      currentClient,
      currentOrganization,
      currentWarehouse,
      session,
      languages,
      isSessionSyncLoading,
      isCopilotInstalled,
      loginErrorText,
      loginErrorDescription,
      // Actions (hook-dependent — live in UserProvider)
      login,
      logout,
      changeProfile,
      changePassword,
      clearUserData,
      setDefaultConfiguration,
      // Store setters (stable references — satisfy consumers that call setters)
      setToken: useUserStore.getState().setToken,
      setSession: useUserStore.getState().setSession,
      setSessionSyncLoading: useUserStore.getState().setSessionSyncLoading,
      setIsCopilotInstalled: useUserStore.getState().setIsCopilotInstalled,
      setLoginErrorText: useUserStore.getState().setLoginErrorText,
      setLoginErrorDescription: useUserStore.getState().setLoginErrorDescription,
      getCsrfToken: useUserStore.getState().getCsrfToken,
    }),
    [
      token,
      user,
      profile,
      roles,
      currentRole,
      prevRole,
      currentClient,
      currentOrganization,
      currentWarehouse,
      session,
      languages,
      isSessionSyncLoading,
      isCopilotInstalled,
      loginErrorText,
      loginErrorDescription,
      login,
      logout,
      changeProfile,
      changePassword,
      clearUserData,
      setDefaultConfiguration,
    ]
  );

  const renderContent = () => {
    if (!token) {
      return <LoginScreen data-testid="LoginScreen__2e05d2" />;
    }
    if (isSessionLoading) {
      return <SessionLoading />;
    }
    return props.children;
  };

  if (!ready) {
    return <SessionLoading />;
  }

  return <UserContext.Provider value={value}>{renderContent()}</UserContext.Provider>;
}

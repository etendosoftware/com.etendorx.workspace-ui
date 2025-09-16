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
import { login as doLogin } from "@workspaceui/api-client/src/api/authentication";
import { changeProfile as doChangeProfile } from "@workspaceui/api-client/src/api/changeProfile";
import { getSession } from "@workspaceui/api-client/src/api/getSession";
import { CopilotClient } from "@workspaceui/api-client/src/api/copilot/client";
import { HTTP_CODES } from "@workspaceui/api-client/src/api/constants";
import type { DefaultConfiguration, IUserContext, Language, LanguageOption } from "./types";
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
import { setDefaultConfiguration as apiSetDefaultConfiguration } from "@workspaceui/api-client/src/api/defaultConfig";
import useLocalStorage from "@workspaceui/componentlibrary/src/hooks/useLocalStorage";
import { useLanguage } from "./language";
import LoginScreen from "@/screens/Login";
import { usePrevious } from "@/hooks/usePrevious";
import { useRouter } from "next/navigation";

export const UserContext = createContext({} as IUserContext);

export default function UserProvider(props: React.PropsWithChildren) {
  const router = useRouter();
  const [token, setToken] = useLocalStorage<string | null>("token", null);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<IUserContext["user"]>({} as User);
  const [session, setSession] = useState<ISession>({});
  const [isSessionSyncLoading, setSessionSyncLoading] = useState(false);
  const [currentOrganization, setCurrentOrganization] = useState<CurrentOrganization>();
  const [currentWarehouse, setCurrentWarehouse] = useState<CurrentWarehouse>();
  const [currentRole, setCurrentRole] = useState<CurrentRole>();
  const [currentClient, setCurrentClient] = useState<CurrentClient>();
  const prevRole = usePrevious(currentRole);

  const [roles, setRoles] = useState<SessionResponse["roles"]>(() => {
    const savedRoles = localStorage.getItem("roles");
    return savedRoles ? JSON.parse(savedRoles) : [];
  });

  const INITIAL_PROFILE: ProfileInfo = useMemo(
    () => ({
      name: "",
      email: "",
      image: "",
    }),
    []
  );

  const [profile, setProfile] = useState<ProfileInfo>(() => {
    const savedProfile = localStorage.getItem("currentInfo");
    return savedProfile ? JSON.parse(savedProfile) : INITIAL_PROFILE;
  });

  const [languages, setLanguages] = useState<LanguageOption[]>([]);

  const setDefaultConfiguration = useCallback(async (config: DefaultConfiguration) => {
    try {
      return await apiSetDefaultConfiguration(config);
    } catch (error) {
      logger.warn("Error setting default configuration:", error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback((newProfile: ProfileInfo) => {
    setProfile(newProfile);
    localStorage.setItem("currentInfo", JSON.stringify(newProfile));
  }, []);

  const { language, setLanguage } = useLanguage();

  const updateSessionInfo = useCallback(
    async (sessionResponse: SessionResponse) => {
      const currentProfileInfo: ProfileInfo = {
        name: sessionResponse.user.name,
        email: sessionResponse.user.client$_identifier,
        image: sessionResponse.user.image || "",
      };

      setSession((prev) => ({ ...prev, ...sessionResponse.attributes }));
      updateProfile(currentProfileInfo);
      setUser(sessionResponse.user);
      setProfile(currentProfileInfo);

      localStorage.setItem("currentInfo", JSON.stringify(currentProfileInfo));
      localStorage.setItem("currentRole", JSON.stringify(sessionResponse.currentRole));
      localStorage.setItem("currentRoleId", sessionResponse.currentRole.id);

      const defaultLanguage = sessionResponse.user.defaultLanguage as Language;

      if (!language && defaultLanguage) {
        setLanguage(defaultLanguage);
      }

      setLanguages(Object.values(sessionResponse.languages));
      setCurrentClient(sessionResponse.currentClient);
      setCurrentRole(sessionResponse.currentRole);
      setCurrentOrganization(sessionResponse.currentOrganization);
      setCurrentWarehouse(sessionResponse.currentWarehouse);
      setRoles(sessionResponse.roles);
    },
    [language, setLanguage, updateProfile]
  );

  const clearUserData = useCallback(() => {
    setToken(null);
    setRoles([]);
    setCurrentRole(undefined);
    setCurrentWarehouse(undefined);
    setCurrentOrganization(undefined);
    setCurrentClient(undefined);
    setProfile(INITIAL_PROFILE);
    setUser({} as User);
    localStorage.removeItem("token");
    localStorage.removeItem("roles");
    localStorage.removeItem("currentRole");
    localStorage.removeItem("currentInfo");
    localStorage.removeItem("currentWarehouse");
    localStorage.removeItem("currentLanguage");
  }, [INITIAL_PROFILE, setToken]);

  const changeProfile = useCallback(
    async (params: { role?: string; client?: string; organization?: string; warehouse?: string }) => {
      if (!token) {
        throw new Error("Authentication token is not available");
      }

      try {
        const response = await doChangeProfile(params);

        localStorage.setItem("token", response.token);
        setToken(response.token);

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
    [setToken, token, updateSessionInfo]
  );

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const loginResponse = await doLogin(username, password);

        localStorage.setItem("token", loginResponse.token);
        Metadata.setToken(loginResponse.token);
        datasource.setToken(loginResponse.token);
        CopilotClient.setToken(loginResponse.token);
        setToken(loginResponse.token);

        // Fetch and update session info immediately after login
        const sessionData = await getSession();
        await updateSessionInfo(sessionData);
      } catch (e) {
        logger.warn("Login or session retrieval error:", e);
        throw e;
      }
    },
    [setToken, updateSessionInfo]
  );

  const value = useMemo<IUserContext>(
    () => ({
      login,
      roles,
      currentRole,
      profile,
      changeProfile,
      currentWarehouse,
      currentClient,
      currentOrganization,
      token,
      clearUserData,
      setToken,
      setDefaultConfiguration,
      languages,
      session,
      setSession,
      user,
      prevRole,
      isSessionSyncLoading,
      setSessionSyncLoading,
    }),
    [
      login,
      roles,
      currentRole,
      profile,
      changeProfile,
      currentWarehouse,
      currentClient,
      currentOrganization,
      token,
      clearUserData,
      setToken,
      setDefaultConfiguration,
      languages,
      session,
      user,
      prevRole,
      isSessionSyncLoading,
    ]
  );

  useEffect(() => {
    const verifySession = async () => {
      try {
        if (token) {
          Metadata.setToken(token);
          datasource.setToken(token);
          CopilotClient.setToken(token);
          const sessionData = await getSession();
          await updateSessionInfo(sessionData);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setReady(true);
      }
    };

    verifySession().catch(logger.warn);
  }, [clearUserData, token, updateSessionInfo]);

  useEffect(() => {
    const interceptor = (response: Response) => {
      if (response.status === HTTP_CODES.UNAUTHORIZED || response.status === HTTP_CODES.INTERNAL_SERVER_ERROR) {
        clearUserData();
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
  }, [clearUserData, token]);

  useEffect(() => {
    if (ready && prevRole && prevRole?.id !== currentRole?.id) {
      router.push("/");
    }
  }, [currentRole?.id, prevRole, ready, router]);

  if (!ready) {
    return null;
  }

  return (
    <UserContext.Provider value={value}>
      {token ? props.children : <LoginScreen data-testid="LoginScreen__2e05d2" />}
    </UserContext.Provider>
  );
}

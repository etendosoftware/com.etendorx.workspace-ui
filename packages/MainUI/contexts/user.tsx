'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { logger } from '../utils/logger';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { login as doLogin } from '@workspaceui/etendohookbinder/src/api/authentication';
import { changeProfile as doChangeProfile } from '@workspaceui/etendohookbinder/src/api/changeProfile';
import { getSession } from '@workspaceui/etendohookbinder/src/api/getSession';
import { HTTP_CODES } from '@workspaceui/etendohookbinder/src/api/constants';
import { DefaultConfiguration, IUserContext, Language, LanguageOption } from './types';
import {
  ISession,
  ProfileInfo,
  SessionResponse,
  User,
  CurrentWarehouse,
  CurrentRole,
  CurrentClient,
  CurrentOrganization,
} from '@workspaceui/etendohookbinder/src/api/types';
import { setDefaultConfiguration as apiSetDefaultConfiguration } from '@workspaceui/etendohookbinder/src/api/defaultConfig';
import useLocalStorage from '@workspaceui/componentlibrary/src/hooks/useLocalStorage';
import { useLanguage } from './language';
import LoginScreen from '@/screens/Login';

export const UserContext = createContext({} as IUserContext);

export default function UserProvider(props: React.PropsWithChildren) {
  const [token, setToken] = useLocalStorage<string | null>('token', null);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<IUserContext['user']>({} as User);
  const [session, setSession] = useState<ISession>({});
  const [currentOrganization, setCurrentOrganization] = useState<CurrentOrganization>();
  const [currentWarehouse, setCurrentWarehouse] = useState<CurrentWarehouse>();
  const [currentRole, setCurrentRole] = useState<CurrentRole>();
  const [currentClient, setCurrentClient] = useState<CurrentClient>();

  const [roles, setRoles] = useState<SessionResponse['roles']>(() => {
    const savedRoles = localStorage.getItem('roles');
    return savedRoles ? JSON.parse(savedRoles) : [];
  });

  const INITIAL_PROFILE: ProfileInfo = useMemo(
    () => ({
      name: '',
      email: '',
      image: '',
    }),
    [],
  );

  const [profile, setProfile] = useState<ProfileInfo>(() => {
    const savedProfile = localStorage.getItem('currentInfo');
    return savedProfile ? JSON.parse(savedProfile) : INITIAL_PROFILE;
  });

  const [languages, setLanguages] = useState<LanguageOption[]>([]);

  const setDefaultConfiguration = useCallback(async (config: DefaultConfiguration) => {
    try {
      return apiSetDefaultConfiguration(config);
    } catch (error) {
      logger.error('Error setting default configuration:', error);

      throw error;
    }
  }, []);

  const updateProfile = useCallback((newProfile: ProfileInfo) => {
    setProfile(newProfile);
    localStorage.setItem('currentInfo', JSON.stringify(newProfile));
  }, []);

  const { language, setLanguage } = useLanguage();

  const updateSessionInfo = useCallback(
    async (sessionResponse: SessionResponse) => {
      const currentProfileInfo: ProfileInfo = {
        name: sessionResponse.user.name,
        email: sessionResponse.user.client$_identifier,
        image: sessionResponse.user.image || '',
      };

      setSession(prev => ({ ...prev, ...sessionResponse.attributes }));
      updateProfile(currentProfileInfo);
      setUser(sessionResponse.user);
      setProfile(currentProfileInfo);

      localStorage.setItem('currentInfo', JSON.stringify(currentProfileInfo));
      localStorage.setItem('currentRole', JSON.stringify(sessionResponse.currentRole));
      localStorage.setItem('currentRoleId', sessionResponse.currentRole.id);

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
    [language, setLanguage, updateProfile],
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
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentInfo');
    localStorage.removeItem('currentWarehouse');
    localStorage.removeItem('currentLanguage');
  }, [INITIAL_PROFILE, setToken]);

  const changeProfile = useCallback(
    async (params: { role?: string; warehouse?: string }) => {
      if (!token) {
        throw new Error('Authentication token is not available');
      }

      try {
        const response = await doChangeProfile(params);

        localStorage.setItem('token', response.token);
        setToken(response.token);
      } catch (error) {
        logger.warn('Error updating profile:', error);
        throw error;
      }
    },
    [setToken, token],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const loginResponse = await doLogin(username, password);

        localStorage.setItem('token', loginResponse.token);
        setToken(loginResponse.token);
      } catch (e) {
        logger.error('Login or session retrieval error:', e);
        throw e;
      }
    },
    [setToken],
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
    ],
  );

  useEffect(() => {
    const verifySession = async () => {
      try {
        if (token) {
          Metadata.setToken(token);
          datasource.setToken(token);
          const sessionData = await getSession();
          await updateSessionInfo(sessionData);
        }
      } catch (error) {
        clearUserData();
      } finally {
        setReady(true);
      }
    };

    verifySession().catch(logger.warn);
  }, [clearUserData, token, updateSessionInfo]);

  useEffect(() => {
    const interceptor = (response: Response) => {
      if (response.status === HTTP_CODES.UNAUTHORIZED) {
        clearUserData();
      }

      return response;
    };

    if (token) {
      const unregisterMetadataInterceptor = Metadata.registerInterceptor(interceptor);
      const unregisterDatasourceInterceptor = datasource.registerInterceptor(interceptor);

      return () => {
        unregisterMetadataInterceptor();
        unregisterDatasourceInterceptor();
      };
    }
  }, [clearUserData, token]);

  if (!ready) {
    return null;
  }

  return <UserContext.Provider value={value}>{token ? props.children : <LoginScreen />}</UserContext.Provider>;
}

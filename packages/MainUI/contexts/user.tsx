/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Role,
  ProfileInfo,
  SessionResponse,
  Warehouse,
  User,
  CurrentWarehouse,
  CurrentRole,
  CurrentClient,
  CurrentOrganization,
} from '@workspaceui/etendohookbinder/src/api/types';
import { setDefaultConfiguration as apiSetDefaultConfiguration } from '@workspaceui/etendohookbinder/src/api/defaultConfig';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../hooks/useLanguage';
import { DEFAULT_LANGUAGE } from '@workspaceui/componentlibrary/src/locales';

export const UserContext = createContext({} as IUserContext);

export default function UserProvider(props: React.PropsWithChildren) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<IUserContext['user']>({} as User);
  const [session, setSession] = useState<ISession>({});
  const [currentOrganization, setCurrentOrganization] = useState<CurrentOrganization>();
  const [currentWarehouse, setCurrentWarehouse] = useState<CurrentWarehouse>();
  const [currentRole, setCurrentRole] = useState<CurrentRole>();
  const [currentClient, setCurrentClient] = useState<CurrentClient>();
  const { setLanguage } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const navigate = router.push;

  const [roles, setRoles] = useState<Role[]>(() => {
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

  const setDefaultConfiguration = useCallback(async (token: string, config: DefaultConfiguration) => {
    try {
      const data = await apiSetDefaultConfiguration(token, config);
      console.debug(data);
    } catch (error) {
      logger.error('Error setting default configuration:', error);
      throw error;
    }
  }, []);

  const updateProfile = useCallback((newProfile: ProfileInfo) => {
    setProfile(newProfile);
    localStorage.setItem('currentInfo', JSON.stringify(newProfile));
  }, []);

  const updateSessionInfo = useCallback(
    async (sessionResponse: SessionResponse) => {
      const currentProfileInfo: ProfileInfo = {
        name: sessionResponse.user.name,
        email: sessionResponse.user.client$_identifier,
        image: sessionResponse.user.image || '',
      };

      updateProfile(currentProfileInfo);
      setUser(sessionResponse.user);
      setProfile(currentProfileInfo);

      localStorage.setItem('currentInfo', JSON.stringify(currentProfileInfo));
      localStorage.setItem('currentRole', JSON.stringify(sessionResponse.currentRole));
      localStorage.setItem('currentRoleId', sessionResponse.currentRole.id);

      if (sessionResponse.user.defaultLanguage) {
        setLanguage(sessionResponse.user.defaultLanguage as Language);
      }

      const languages = Object.values(sessionResponse.languages);

      setLanguages(languages);
      setCurrentClient(sessionResponse.currentClient);
      setCurrentRole(sessionResponse.currentRole);
      setCurrentOrganization(sessionResponse.currentOrganization);
      setCurrentWarehouse(sessionResponse.currentWarehouse);

      if (sessionResponse.currentWarehouse) {
        localStorage.setItem('currentWarehouse', JSON.stringify(sessionResponse.currentWarehouse));
        setCurrentWarehouse(sessionResponse.currentWarehouse);
      }
    },
    [setLanguage, updateProfile],
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
  }, [INITIAL_PROFILE]);

  const changeProfile = useCallback(
    async (params: { role?: string; warehouse?: string }) => {
      if (!token) {
        throw new Error('Authentication token is not available');
      }

      try {
        const response = await doChangeProfile(params);

        localStorage.setItem('token', response.token);
        setToken(response.token);

        const sessionResponse = await getSession(response.token);
        updateSessionInfo(sessionResponse);

        if (params.role) {
          navigate('/');
        }
      } catch (error) {
        logger.warn('Error updating profile:', error);
        throw error;
      }
    },
    [token, updateSessionInfo, navigate],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const loginResponse = await doLogin(username, password);

        localStorage.setItem('token', loginResponse.token);
        setToken(loginResponse.token);

        Metadata.setToken(loginResponse.token);
        datasource.setToken(loginResponse.token);

        const sessionResponse = await getSession(loginResponse.token);
        updateSessionInfo(sessionResponse);

        if (loginResponse.roleList) {
          localStorage.setItem('roles', JSON.stringify(loginResponse.roleList));
          setRoles(loginResponse.roleList);
        }
      } catch (e) {
        logger.error('Login or session retrieval error:', e);
        throw e;
      }
    },
    [updateSessionInfo],
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
      setDefaultConfiguration,
      languages,
      session,
      user,
    ],
  );

  useEffect(() => {
    if (token) {
      const verifySession = async () => {
        try {
          Metadata.setToken(token);
          datasource.setToken(token);

          updateSessionInfo(await getSession(token));
        } catch (error) {
          clearUserData();
          navigate('/login');
        }
      };
      verifySession();
    }
  }, [clearUserData, navigate, token, updateSessionInfo]);

  useEffect(() => {
    if (token || pathname === '/login') {
      setReady(true);
    }

    if (!token) {
      navigate('/login');
    }
  }, [navigate, pathname, token]);

  useEffect(() => {
    const interceptor = (response: Response) => {
      if (response.status === HTTP_CODES.UNAUTHORIZED) {
        clearUserData();
        navigate('/login');
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
  }, [clearUserData, navigate, token]);

  useEffect(() => {
    if (languages.length === 0) return;

    const savedLanguage = localStorage.getItem('currentLanguage');
    const matchedLanguage = languages.find(lang => lang.language === savedLanguage);

    setLanguage((matchedLanguage?.language as Language) || DEFAULT_LANGUAGE);
  }, [languages, setLanguage]);

  if (!ready) {
    return null;
  }

  return <UserContext.Provider value={value}>{props.children}</UserContext.Provider>;
}

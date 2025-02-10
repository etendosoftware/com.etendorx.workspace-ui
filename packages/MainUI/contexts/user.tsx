'use client';

import { createContext, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { logger } from '../utils/logger';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { Datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { login as doLogin } from '@workspaceui/etendohookbinder/src/api/authentication';
import { changeRole as doChangeRole } from '@workspaceui/etendohookbinder/src/api/role';
import { getSession } from '@workspaceui/etendohookbinder/src/api/getSession';
import { changeWarehouse as doChangeWarehouse } from '@workspaceui/etendohookbinder/src/api/warehouse';
import { HTTP_CODES } from '@workspaceui/etendohookbinder/src/api/constants';
import { DefaultConfiguration, IUserContext, Language, LanguageOption } from './types';
import { ISession, Role, SessionResponse, Warehouse } from '@workspaceui/etendohookbinder/src/api/types';
import { setDefaultConfiguration as apiSetDefaultConfiguration } from '@workspaceui/etendohookbinder/src/api/defaultConfig';
import { usePathname, useRouter } from 'next/navigation';
import Spinner from '@workspaceui/componentlibrary/src/components/Spinner';
import { useLanguage } from '../hooks/useLanguage';
import { DEFAULT_LANGUAGE } from './languageProvider';

export const UserContext = createContext({} as IUserContext);

export default function UserProvider(props: React.PropsWithChildren) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<ISession>({});
  const { setLanguage } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const navigate = router.push;

  const [roles, setRoles] = useState<Role[]>(() => {
    const savedRoles = localStorage.getItem('roles');
    return savedRoles ? JSON.parse(savedRoles) : [];
  });

  const [currentRole, setCurrentRole] = useState<Role | null>(() => {
    const savedCurrentRole = localStorage.getItem('currentRole');
    return savedCurrentRole ? JSON.parse(savedCurrentRole) : null;
  });

  const [currentWarehouse, setCurrentWarehouse] = useState<Warehouse | null>(() => {
    const savedCurrentWarehouse = localStorage.getItem('currentWarehouse');
    return savedCurrentWarehouse ? JSON.parse(savedCurrentWarehouse) : null;
  });

  const [languages, setLanguages] = useState<LanguageOption[]>([]);

  const setDefaultConfiguration = useCallback(async (token: string, config: DefaultConfiguration) => {
    try {
      await apiSetDefaultConfiguration(token, config);
    } catch (error) {
      logger.error('Error setting default configuration:', error);
      throw error;
    }
  }, []);

  const updateSessionInfo = useCallback(
    (sessionResponse: SessionResponse) => {
      const currentRole: Role = {
        id: sessionResponse.role.id,
        name: sessionResponse.role.name,
        orgList: [],
      };
      localStorage.setItem('currentRole', JSON.stringify(currentRole));
      localStorage.setItem('currentRoleId', currentRole.id);
      setSession(sessionResponse.session);

      if (sessionResponse.user.defaultLanguage) {
        setLanguage(sessionResponse.user.defaultLanguage as Language);
      }

      setLanguages(
        sessionResponse.languages.map(lang => ({
          id: lang.id,
          language: lang.language,
          name: lang.name,
        })),
      );

      setCurrentRole(currentRole);

      if (sessionResponse.user.defaultWarehouse) {
        const defaultWarehouse: Warehouse = {
          id: sessionResponse.user.defaultWarehouse,
          name: sessionResponse.user.defaultWarehouse$_identifier,
        };
        localStorage.setItem('currentWarehouse', JSON.stringify(defaultWarehouse));
        setCurrentWarehouse(defaultWarehouse);
      }
    },
    [setLanguage],
  );

  const clearUserData = useCallback(() => {
    setToken(null);
    setRoles([]);
    setCurrentRole(null);
    setCurrentWarehouse(null);
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentWarehouse');
    localStorage.removeItem('currentLanguage');
  }, []);

  const changeRole = useCallback(
    async (roleId: string) => {
      if (!token) {
        throw new Error('No authentication token available');
      }

      try {
        const response = await doChangeRole(roleId, token);
        localStorage.setItem('token', response.token);
        setToken(response.token);

        const sessionResponse = await getSession(response.token);
        updateSessionInfo(sessionResponse);

        Metadata.clearMenuCache();
        await Metadata.refreshMenuOnLogin();

        navigate('/');
      } catch (e) {
        logger.warn('Change role error:', e);
        throw e;
      }
    },
    [token, updateSessionInfo, navigate],
  );

  const changeWarehouse = useCallback(
    async (warehouseId: string) => {
      if (!token) {
        throw new Error('No authentication token available');
      }

      try {
        const response = await doChangeWarehouse(warehouseId, token);
        localStorage.setItem('token', response.token);
        setToken(response.token);

        const sessionResponse = await getSession(response.token);
        updateSessionInfo(sessionResponse);
      } catch (e) {
        logger.warn('Change warehouse error:', e);
        throw e;
      }
    },
    [token, updateSessionInfo],
  );

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const loginResponse = await doLogin(username, password);

        localStorage.setItem('token', loginResponse.token);
        setToken(loginResponse.token);

        Metadata.setToken(loginResponse.token);
        Datasource.authorize(loginResponse.token);

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
      changeRole,
      changeWarehouse,
      roles,
      currentRole,
      currentWarehouse,
      token,
      clearUserData,
      setToken,
      setDefaultConfiguration,
      languages,
      session,
      setSession,
    }),
    [
      login,
      changeRole,
      changeWarehouse,
      roles,
      currentRole,
      currentWarehouse,
      token,
      clearUserData,
      setDefaultConfiguration,
      languages,
      session,
      setSession,
    ],
  );

  useEffect(() => {
    if (token) {
      const verifySession = async () => {
        try {
          Metadata.setToken(token);
          Datasource.authorize(token);
          const sessionResponse = await getSession(token);
          updateSessionInfo(sessionResponse);
        } catch (error) {
          clearUserData();
          navigate('/login');
        }
      };
      verifySession();
    }
  }, [clearUserData, navigate, token, updateSessionInfo]);

  useLayoutEffect(() => {
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
        localStorage.removeItem('token');
        localStorage.removeItem('roles');
        localStorage.removeItem('currentRole');
        setToken(null);
        setRoles([]);
        setCurrentRole(null);
        navigate('/login');
      }
      return response;
    };

    if (token) {
      const unregisterMetadataInterceptor = Metadata.registerInterceptor(interceptor);
      const unregisterDatasourceInterceptor = Datasource.registerInterceptor(interceptor);

      return () => {
        unregisterMetadataInterceptor();
        unregisterDatasourceInterceptor();
      };
    }
  }, [navigate, token]);

  useEffect(() => {
    if (!languages.length) {
      return;
    }

    const savedLanguage = localStorage.getItem('currentLanguage');
    const givenLanguage = languages.find(lang => lang.language == savedLanguage);

    if (givenLanguage) {
      setLanguage(givenLanguage.language as Language);
    } else {
      setLanguage(DEFAULT_LANGUAGE);
    }
  }, [languages, languages.length, setLanguage]);

  return <UserContext.Provider value={value}>{ready ? props.children : <Spinner />}</UserContext.Provider>;
}

'use client';

import { createContext, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { logger } from '../utils/logger';
import { Metadata } from '@workspaceui/etendohookbinder/api/metadata';
import { Datasource } from '@workspaceui/etendohookbinder/api/datasource';
import { login as doLogin } from '@workspaceui/etendohookbinder/api/authentication';
import { changeRole as doChangeRole } from '@workspaceui/etendohookbinder/api/role';
import { getSession } from '@workspaceui/etendohookbinder/api/getSession';
import { changeWarehouse as doChangeWarehouse } from '@workspaceui/etendohookbinder/api/warehouse';
import { HTTP_CODES } from '@workspaceui/etendohookbinder/api/constants';
import { DefaultConfiguration, IUserContext, Role, Warehouse } from './types';
import { SessionResponse } from '@workspaceui/etendohookbinder/api/types';
import { setDefaultConfiguration as apiSetDefaultConfiguration } from '@workspaceui/etendohookbinder/api/defaultConfig';
import { usePathname, useRouter } from 'next/navigation';

export const UserContext = createContext({} as IUserContext);

export default function UserProvider(props: React.PropsWithChildren) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const pathname = usePathname();
  const navigate = useRouter().push;

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

  const setDefaultConfiguration = useCallback(async (token: string, config: DefaultConfiguration) => {
    try {
      await apiSetDefaultConfiguration(token, config);
    } catch (error) {
      logger.error('Error setting default configuration:', error);
      throw error;
    }
  }, []);

  const updateSessionInfo = useCallback((sessionResponse: SessionResponse) => {
    const currentRole: Role = {
      id: sessionResponse.role.id,
      name: sessionResponse.role.name,
      orgList: [],
    };
    localStorage.setItem('currentRole', JSON.stringify(currentRole));
    localStorage.setItem('currentRoleId', currentRole.id);
    setCurrentRole(currentRole);

    if (sessionResponse.user.defaultWarehouse) {
      const defaultWarehouse: Warehouse = {
        id: sessionResponse.user.defaultWarehouse,
        name: sessionResponse.user.defaultWarehouse$_identifier,
      };
      localStorage.setItem('currentWarehouse', JSON.stringify(defaultWarehouse));
      setCurrentWarehouse(defaultWarehouse);
    }
  }, []);

  const clearUserData = useCallback(() => {
    setToken(null);
    setRoles([]);
    setCurrentRole(null);
    setCurrentWarehouse(null);
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentWarehouse');
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

        Metadata.authorize(loginResponse.token);
        Datasource.authorize(loginResponse.token);

        const sessionResponse = await getSession(loginResponse.token);
        updateSessionInfo(sessionResponse);

        if (loginResponse.roleList) {
          localStorage.setItem('roles', JSON.stringify(loginResponse.roleList));
          setRoles(loginResponse.roleList);
        }

        await Metadata.refreshMenuOnLogin();
      } catch (e) {
        logger.error('Login or session retrieval error:', e);
        throw e;
      }
    },
    [updateSessionInfo],
  );

  const value = useMemo(
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
    ],
  );

  useLayoutEffect(() => {
    if (token) {
      Metadata.authorize(token);
      Datasource.authorize(token);
    }
  }, [token]);

  useEffect(() => {
    if (token && pathname === '/login') {
      navigate('/');
    } else if (!token && pathname !== '/login') {
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
    console.debug(value);
  }, [value]);

  return <UserContext.Provider value={value}>{props.children}</UserContext.Provider>;
}

import { createContext, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import { Metadata } from '@workspaceui/etendohookbinder/api/metadata';
import { Datasource } from '@workspaceui/etendohookbinder/api/datasource';
import { login as doLogin } from '@workspaceui/etendohookbinder/api/authentication';
import { changeRole as doChangeRole } from '@workspaceui/etendohookbinder/api/role';
import { changeWarehouse as doChangeWarehouse } from '@workspaceui/etendohookbinder/api/warehouse';
import { HTTP_CODES } from '@workspaceui/etendohookbinder/api/constants';
import { IUserContext, Role, Warehouse } from './types';

export const UserContext = createContext({} as IUserContext);

export default function UserProvider(props: React.PropsWithChildren) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const { pathname } = useLocation();
  const navigate = useNavigate();

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

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await doLogin(username, password);

      localStorage.setItem('token', response.token);
      setToken(response.token);

      Metadata.authorize(response.token);
      Datasource.authorize(response.token);

      localStorage.setItem('roles', JSON.stringify(response.roleList));
      setRoles(response.roleList);

      if (response.roleList.length > 0) {
        const defaultRole = response.roleList[0];
        localStorage.setItem('currentRole', JSON.stringify(defaultRole));
        localStorage.setItem('currentRoleId', defaultRole.id);
        setCurrentRole(defaultRole);

        if (defaultRole.orgList.length > 0 && defaultRole.orgList[0].warehouseList.length > 0) {
          const defaultWarehouse = defaultRole.orgList[0].warehouseList[0];
          localStorage.setItem('currentWarehouse', JSON.stringify(defaultWarehouse));
          setCurrentWarehouse(defaultWarehouse);
        }
      }

      await Metadata.refreshMenuOnLogin();

      console.log('Login process completed successfully');
    } catch (e) {
      console.error('Login error:', e);
      throw e;
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
        localStorage.setItem('currentRoleId', roleId);
        setToken(response.token);

        const newRole = response.roleList.find((role: Role) => role.id === roleId);
        if (newRole) {
          localStorage.setItem('currentRole', JSON.stringify(newRole));
          setCurrentRole(newRole);

          setCurrentWarehouse(null);
          localStorage.removeItem('currentWarehouse');

          Metadata.clearMenuCache();
        } else {
          throw new Error('Selected role not found in the updated roles list');
        }
      } catch (e) {
        logger.warn('Change role error:', e);
        throw e;
      }
    },
    [token],
  );

  const changeWarehouse = useCallback(
    async (warehouseId: string) => {
      if (!currentRole) {
        throw new Error('No current role selected');
      }

      if (!token) {
        throw new Error('No authentication token available');
      }

      try {
        const response = await doChangeWarehouse(warehouseId, token);
        localStorage.setItem('token', response.token);
        setToken(response.token);

        const newWarehouse = currentRole.orgList
          .flatMap(org => org.warehouseList)
          .find(warehouse => warehouse.id === warehouseId);

        if (newWarehouse) {
          localStorage.setItem('currentWarehouse', JSON.stringify(newWarehouse));
          setCurrentWarehouse(newWarehouse);
        } else {
          throw new Error('Selected warehouse not found in the current role');
        }
      } catch (e) {
        logger.warn('Change warehouse error:', e);
        throw e;
      }
    },
    [currentRole, token],
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
    }),
    [login, changeRole, changeWarehouse, roles, currentRole, currentWarehouse, token, clearUserData, setToken],
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

  return <UserContext.Provider value={value}>{props.children}</UserContext.Provider>;
}

import { createContext, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import { Metadata } from '@workspaceui/etendohookbinder/api/metadata';
import { Datasource } from '@workspaceui/etendohookbinder/api/datasource';
import { login as doLogin } from '@workspaceui/etendohookbinder/api/authentication';
import { changeRole as doChangeRole } from '@workspaceui/etendohookbinder/api/role';
import { HTTP_CODES } from '@workspaceui/etendohookbinder/api/constants';
import { IUserContext, Role } from './types';

export const UserContext = createContext({} as IUserContext);

export default function UserProvider(props: React.PropsWithChildren) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [roles, setRoles] = useState<Role[]>(() => {
    const savedRoles = localStorage.getItem('roles');
    return savedRoles ? JSON.parse(savedRoles) : [];
  });
  const [currentRole, setCurrentRole] = useState<Role | null>(() => {
    const savedCurrentRole = localStorage.getItem('currentRole');
    return savedCurrentRole ? JSON.parse(savedCurrentRole) : null;
  });
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await doLogin(username, password);

      localStorage.setItem('token', response.token);
      localStorage.setItem('roles', JSON.stringify(response.roleList));
      setToken(response.token);
      setRoles(response.roleList);

      if (response.roleList.length > 0) {
        localStorage.setItem('currentRole', JSON.stringify(response.roleList[0]));
        setCurrentRole(response.roleList[0]);
      } else {
        localStorage.removeItem('currentRole');
        setCurrentRole(null);
      }
    } catch (e) {
      logger.warn('Login error:', e);
      throw e;
    }
  }, []);

  const changeRole = useCallback(
    async (roleId: string) => {
      if (!token) {
        throw new Error('No token available. Please login first.');
      }
      try {
        const response = await doChangeRole(roleId, token);
        localStorage.setItem('token', response.token);
        localStorage.setItem('roles', JSON.stringify(response.roleList));
        setToken(response.token);
        setRoles(response.roleList);

        const newRole = response.roleList.find(role => role.id === roleId);
        if (newRole) {
          localStorage.setItem('currentRole', JSON.stringify(newRole));
          setCurrentRole(newRole);
        } else {
          throw new Error('Selected role not found in the updated roles list');
        }

        window.location.reload();
      } catch (e) {
        logger.warn('Change role error:', e);
        throw e;
      }
    },
    [token],
  );
  const value = useMemo(
    () => ({ login, changeRole, roles, currentRole, token }),
    [login, changeRole, roles, currentRole, token],
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

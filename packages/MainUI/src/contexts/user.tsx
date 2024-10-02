import { createContext, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { Datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { login as doLogin } from '@workspaceui/etendohookbinder/src/api/authentication';
import { HTTP_CODES } from '@workspaceui/etendohookbinder/src/api/constants';

interface IUserContext {
  login: (username: string, password: string) => Promise<void>;
  token: string | null;
}

export const UserContext = createContext({} as IUserContext);

export default function UserProvider(props: React.PropsWithChildren) {
  const [token, settoken] = useState(localStorage.getItem('token'));
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const login = useCallback(async (username: string, password: string) => {
    try {
      const token = await doLogin(username, password);
      localStorage.setItem('token', token);
      settoken(token);
    } catch (e) {
      logger.warn(e);

      throw e;
    }
  }, []);

  const value = useMemo(() => ({ login, token }), [login, token]);

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
        settoken(null);
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

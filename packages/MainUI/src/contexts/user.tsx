import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { Datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { login as doLogin } from '@workspaceui/etendohookbinder/src/api/authentication';

interface IUserContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  login: (username: string, password: string) => Promise<any>;
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
      Datasource.authorize(token);
      Metadata.authorize(token);

      settoken(token);
    } catch (e) {
      logger.warn(e);

      throw e;
    }
  }, []);

  const value = useMemo(() => ({ login, token }), [login, token]);

  useEffect(() => {
    const interceptor = (response: Response) => {
      if (response.status === 401) {
        localStorage.removeItem('token');
        settoken(null);
      }

      return response;
    };

    const unregisterMetadataInterceptor =
      Metadata.registerInterceptor(interceptor);
    const unregisterDatasourceInterceptor =
      Datasource.registerInterceptor(interceptor);

    return () => {
      unregisterMetadataInterceptor();
      unregisterDatasourceInterceptor();
    };
  }, []);

  useEffect(() => {
    if (token && pathname === '/login') {
      navigate('/');
    } else if (!token) {
      navigate('/login');
    }
  }, [navigate, pathname, token]);

  useEffect(() => {
    if (token) {
      Datasource.authorize(token);
      Metadata.authorize(token);
      Metadata.initialize();
    }
  }, [token]);

  return (
    <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
  );
}

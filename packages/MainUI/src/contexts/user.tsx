import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@workspaceui/etendohookbinder/src/api/constants';
import { logger } from '../utils/logger';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { Datasource } from '@workspaceui/etendohookbinder/src/api/datasource';

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

  const login = useCallback(
    async (username: string, password: string) => {
      try {
        const result = await fetch(`${API_BASE_URL}/sws/login`, {
          method: 'POST',
          body: JSON.stringify({
            username,
            password,
          }),
        });
        const data = await result.json();

        if (data.status === 'error') {
          throw new Error(data.message);
        } else {
          localStorage.setItem('token', data.token);
          Datasource.authorize(data.token);
          Metadata.authorize(data.token);
          Metadata.initialize();
          settoken(data.token);
          navigate({ pathname: '/' });
        }
      } catch (e) {
        logger.warn(e);

        throw e;
      }
    },
    [navigate],
  );

  const value = useMemo(() => ({ login, token }), [login, token]);

  useEffect(() => {
    if (token && pathname === '/login') {
      navigate('/');
    } else if (!token) {
      navigate('/login');
    }
  }, [navigate, pathname, token]);

  useEffect(() => {
    if (token) {
      Metadata.authorize(token);
      Datasource.authorize(token);
    }
  }, [token]);

  return (
    <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
  );
}

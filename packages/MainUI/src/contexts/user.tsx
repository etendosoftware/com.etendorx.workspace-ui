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

interface IUserContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  login: (username: string, password: string) => Promise<any>;
  swsToken: string | null;
}

export const UserContext = createContext({} as IUserContext);

export default function UserProvider(props: React.PropsWithChildren) {
  const [swsToken, setSwsToken] = useState(localStorage.getItem('swsToken'));
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
          localStorage.setItem('swsToken', data.token);
          setSwsToken(data.token);
          navigate({ pathname: '/' });
        }
      } catch (e) {
        logger.warn(e);

        throw e;
      }
    },
    [navigate],
  );

  const value = useMemo(() => ({ login, swsToken }), [login, swsToken]);

  useEffect(() => {
    if (swsToken && pathname === '/login') {
      navigate('/');
    } else if (!swsToken) {
      navigate('/login');
    }
  }, [navigate, pathname, swsToken]);

  return (
    <UserContext.Provider value={value}>{props.children}</UserContext.Provider>
  );
}

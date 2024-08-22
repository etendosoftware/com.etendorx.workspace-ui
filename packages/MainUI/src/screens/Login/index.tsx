import { useCallback, useState } from 'react';
import { useUserContext } from '../../hooks/useUserContext';
import { logger } from '../../utils/logger';
import Login from '@workspaceui/componentlibrary/src/components/Forms/Login';

export default function LoginScreen() {
  const [error, setError] = useState('');
  const { login } = useUserContext();

  const handleLogin = useCallback(
    async (username: string, password: string) => {
      try {
        await login(username, password);
      } catch (e) {
        logger.warn(e);
        setError((e as Error).message);
      }
    },
    [login],
  );

  return <Login title="Etendo" onClick={handleLogin} error={error} />;
}

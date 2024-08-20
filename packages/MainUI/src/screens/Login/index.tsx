import Box from '@mui/material/Box';
import { useCallback, useState } from 'react';
import { useUserContext } from '../../hooks/useUserContext';
import { logger } from '../../utils/logger';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useUserContext();

  const handleUsernameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setUsername(e.currentTarget.value),
    [],
  );

  const handlePasswordChannge = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setPassword(e.currentTarget.value),
    [],
  );

  const handleLogin = useCallback(async () => {
    try {
      await login(username, password);
    } catch (e) {
      logger.warn(e)
      setError((e as Error).message);
    }
  }, [login, password, username]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      height="100%"
      flex={1}
      gap={1}>
      <input
        type="text"
        name="username"
        id="username"
        placeholder="Username"
        value={username}
        onChange={handleUsernameChange}
      />
      <input
        type="password"
        name="password"
        id="password"
        placeholder="Password"
        value={password}
        onChange={handlePasswordChannge}
      />
      <button onClick={handleLogin}>Log In</button>
      <code>{error}</code>
    </Box>
  );
}

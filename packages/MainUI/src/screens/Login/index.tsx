import { useCallback, useState } from 'react';
import { useUserContext } from '../../hooks/useUserContext';
import { logger } from '../../utils/logger';
import { Box, Input, Paper } from '@mui/material';
import { Button } from '@workspaceui/componentlibrary/src/components';
import { styles } from './styles';

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
      logger.warn(e);
      setError((e as Error).message);
    }
  }, [login, password, username]);

  return (
    <Box sx={styles.container}>
      <Paper sx={styles.paper}>
        <h1>Etendo</h1>
        <Input
          type="text"
          name="username"
          id="username"
          placeholder="Username"
          value={username}
          onChange={handleUsernameChange}
        />
        <Input
          type="password"
          name="password"
          id="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChannge}
        />
        <Button onClick={handleLogin}>Log In</Button>
        <code>{error}</code>
      </Paper>
    </Box>
  );
}

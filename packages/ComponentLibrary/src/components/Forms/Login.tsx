import { useCallback, useState } from 'react';
import { Box, Input, Paper } from '@mui/material';
import { Button } from '../../components';
import { styles } from './styles';

export default function Login({
  title,
  onClick,
  error,
}: {
  title: string;
  onClick: (username: string, password: string) => Promise<void>;
  error?: string;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

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

  const handleClick = useCallback(
    () => onClick(username, password),
    [onClick, password, username],
  );

  return (
    <Box sx={styles.container}>
      <Paper sx={styles.paper}>
        <h1>{title}</h1>
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
        <Button onClick={handleClick}>Log In</Button>
        {error ? <code>{error}</code> : null}
      </Paper>
    </Box>
  );
}

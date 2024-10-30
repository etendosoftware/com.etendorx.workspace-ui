'use client';
import { useCallback, useState } from 'react';
import { Box, Button, Input, Paper } from '@mui/material';
import { useStyle } from './styles';

export default function Login({
  title,
  onSubmit,
  error,
}: {
  title: string;
  onSubmit: (username: string, password: string) => Promise<void>;
  error?: string;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { styles } = useStyle();

  const handleUsernameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.currentTarget.value),
    [],
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.currentTarget.value),
    [],
  );

  const handleSubmit = useCallback<React.FormEventHandler>(
    async e => {
      e.preventDefault();
      e.stopPropagation();
      await onSubmit(username, password);
    },
    [onSubmit, password, username],
  );

  return (
    <Box component="main" sx={styles.container}>
      <form onSubmit={handleSubmit} noValidate>
        <Paper sx={styles.paper} elevation={3}>
          <h1>{title}</h1>
          <Input
            type="text"
            name="username"
            id="username"
            placeholder="Username"
            value={username}
            onChange={handleUsernameChange}
            fullWidth
            margin="dense"
            autoComplete="username"
          />
          <Input
            type="password"
            name="password"
            id="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            fullWidth
            margin="dense"
            autoComplete="current-password"
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }}>
            Log In
          </Button>
          {error && (
            <Box
              component="code"
              sx={{
                display: 'block',
                mt: 2,
                color: 'error.main',
              }}>
              {error}
            </Box>
          )}
        </Paper>
      </form>
    </Box>
  );
}

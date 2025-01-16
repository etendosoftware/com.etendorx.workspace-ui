'use client';
import { useCallback, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useStyle } from './styles';
import GridLayout from './GridLayout';
import { TextInputBase } from '..';

export default function Login({ title, onSubmit, error }: LoginProps) {
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
      <Box sx={styles.contentWrapper}>
        <Box sx={styles.leftSection}>
          <GridLayout />
        </Box>
        <Box sx={styles.rightSection}>
          <form onSubmit={handleSubmit} noValidate style={{ width: '100%' }}>
            <Paper sx={styles.paper} elevation={0}>
              <Typography variant="h1" sx={styles.title}>
                {title}✨
              </Typography>
              <Typography variant="body1" sx={styles.subtitle}>
                Enter your credentials to access your account.
              </Typography>
              <TextInputBase
                type="text"
                name="username"
                id="username"
                placeholder="Username"
                label="Username"
                value={username}
                onChange={handleUsernameChange}
                fullWidth
                sx={styles.input}
                autoComplete="username"
              />
              <TextInputBase
                type="password"
                name="password"
                id="password"
                placeholder="Password"
                label="Password"
                value={password}
                onChange={handlePasswordChange}
                fullWidth
                sx={styles.input}
                autoComplete="current-password"
              />
              <Button type="submit" fullWidth variant="contained" sx={styles.button}>
                Log In
              </Button>
              {error && (
                <Typography component="div" sx={styles.error}>
                  {error}
                </Typography>
              )}
            </Paper>
          </form>
        </Box>
      </Box>
    </Box>
  );
}

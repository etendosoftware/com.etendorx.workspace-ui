'use client';
import { useCallback, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useStyle } from './styles';
import GridLayout from './GridLayout';
import { LoginProps } from './types';
import { TextInputBase } from '@workspaceui/componentlibrary/src/components';
import { useTranslation } from '../../hooks/useTranslation';
import { GRID_CONSTANTS } from './constants';

export default function Login({ title, onSubmit, error }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { styles } = useStyle();
  const { t } = useTranslation();

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
                {title}
                {GRID_CONSTANTS.ICONS.TITLE_EMOJI}
              </Typography>
              <Typography variant="body1" sx={styles.subtitle}>
                {t('login.subtitle')}
              </Typography>
              <TextInputBase
                type="text"
                name="username"
                id="username"
                placeholder={t('login.fields.username.placeholder')}
                label={t('login.fields.username.label')}
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
                placeholder={t('login.fields.password.placeholder')}
                label={t('login.fields.password.label')}
                value={password}
                onChange={handlePasswordChange}
                fullWidth
                sx={styles.input}
                autoComplete="current-password"
              />
              <Button type="submit" fullWidth variant="contained" sx={styles.button}>
                {t('login.buttons.submit')}
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

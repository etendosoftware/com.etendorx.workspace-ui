'use client';
import { useCallback, useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useStyle } from './styles';
import GridLayout from './GridLayout';
import type { LoginProps } from './types';
import { useTranslation } from '../../hooks/useTranslation';
import { GRID_CONSTANTS } from './constants';
import Input from './Input';

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
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await onSubmit(username, password);
    },
    [onSubmit, password, username],
  );

  return (
    <Box component='main' sx={styles.container}>
      <Box sx={styles.contentWrapper}>
        <Box sx={styles.leftSection}>
          <GridLayout />
        </Box>
        <div className='flex flex-1 items-center justify-center'>
          <form onSubmit={handleSubmit} noValidate>
            <Paper sx={styles.paper} elevation={0}>
              <Typography variant='h1' sx={styles.title}>
                {title}
                {GRID_CONSTANTS.ICONS.TITLE_EMOJI}
              </Typography>
              <Typography variant='body1' sx={styles.subtitle}>
                {t('login.subtitle')}
              </Typography>
              <Input
                type='text'
                name='username'
                id='username'
                placeholder={t('login.fields.username.placeholder')}
                value={username}
                onChange={handleUsernameChange}
                autoComplete='username'
              />
              <Input
                type='password'
                name='password'
                id='password'
                placeholder={t('login.fields.password.placeholder')}
                value={password}
                onChange={handlePasswordChange}
                autoComplete='current-password'
              />
              <Button type='submit' fullWidth variant='contained' sx={styles.button}>
                {t('login.buttons.submit')}
              </Button>
              {error && (
                <Typography component='div' sx={styles.error}>
                  {error}
                </Typography>
              )}
            </Paper>
          </form>
        </div>
      </Box>
    </Box>
  );
}

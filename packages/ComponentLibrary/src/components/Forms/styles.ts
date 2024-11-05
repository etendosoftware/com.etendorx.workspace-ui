import { useMemo } from 'react';
import { useTheme } from '@mui/material';

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        container: {
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: theme.spacing(1),
        },
        paper: {
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing(1),
          padding: theme.spacing(1),
        },
      },
    }),
    [theme],
  );
};

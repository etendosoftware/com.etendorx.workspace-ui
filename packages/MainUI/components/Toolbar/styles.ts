import { useMemo } from 'react';
import { useTheme } from '@mui/material';

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        portal: {
          position: 'fixed',
          top: '5.5rem',
          right: '0.5rem',
          backgroundColor: theme.palette.baselineColor.neutral[0],
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          borderRadius: '1.5rem',
          padding: '0.25rem',
          width: '20rem',
          zIndex: 9999,
        },
      },
    }),
    [theme],
  );
};

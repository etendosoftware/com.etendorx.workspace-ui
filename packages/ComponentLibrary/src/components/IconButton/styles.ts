import { SxProps, Theme, useTheme } from '@mui/material';
import { useMemo } from 'react';

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        defaultContainer: {
          borderRadius: '6.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          background: theme.palette.baselineColor.neutral[0],
          '&:hover': {
            backgroundColor: theme.palette.dynamicColor.main,
          },
        },
        buttonContainer: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        iconText: {
          marginLeft: '0.5rem',
          whiteSpace: 'nowrap',
          fontSize: '0.825rem',
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme],
  );
};

import { type SxProps, type Theme, useTheme } from '@mui/material';
import { useMemo } from 'react';

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        rightButton: {
          background: theme.palette.baselineColor.neutral[100],
          color: theme.palette.baselineColor.neutral[0],
          height: '2rem',
          borderRadius: '6.25rem',
          padding: '0.5rem 1rem',
          '&:hover': {
            border: 'none',
            background: theme.palette.dynamicColor.main,
            color: theme.palette.dynamicColor.contrastText,
          },
        },
        leftButton: {
          background: theme.palette.baselineColor.neutral[10],
          color: theme.palette.baselineColor.transparentNeutral[100],
          height: '2rem',
          borderRadius: '6.25rem',
          padding: '0.5rem 1rem',
          border: `1px solid ${theme.palette.baselineColor.neutral[10]}`,
          '&:hover': {
            border: 'none',
            background: theme.palette.dynamicColor.main,
            color: theme.palette.dynamicColor.contrastText,
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme],
  );
};

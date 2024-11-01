import { SxProps, Theme, useTheme } from '@mui/material';
import { CSSProperties, useMemo } from 'react';

type StylesType = {
  styles: Record<string, CSSProperties>;
  sx: Record<string, SxProps<Theme>>;
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        tabLabelContainer: {
          display: 'flex',
          alignItems: 'center',
        },
        badgeText: {
          marginLeft: '0.5rem',
          marginRight: '0.5rem',
          fontSize: '0.875rem',
        },
      },
      sx: {
        badge: {
          marginLeft: '0.875rem',
          '& .MuiBadge-badge': {
            backgroundColor: theme.palette.baselineColor.transparentNeutral[5],
            color: theme.palette.baselineColor.neutral[100],
            fontSize: '0.875rem',
            fontWeight: 500,
            height: '1.5rem',
            borderRadius: '12.5rem',
            paddingX: '0.5rem',
          },
        },
      },
    }),
    [theme],
  );
};

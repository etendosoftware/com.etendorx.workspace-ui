import { SxProps, useTheme, Theme } from '@mui/material';
import { useMemo } from 'react';

type StylesType = {
  sx: Record<string, SxProps<Theme>>;
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        menuItem: {
          width: '8.5rem',
          borderRadius: '0.75rem',
          display: 'flex',
          gap: '0.5rem',
          flexDirection: 'column',
          padding: '0.5rem',
          marginBottom: '0.5rem',
        },
        menuItemContent: {
          width: '100%',
        },
        menuItemTitle: {
          color: theme.palette.baselineColor.neutral[100],
          fontWeight: 'bold',
          marginBottom: '0.25rem',
          fontSize: '0.875rem',
          lineHeight: 1.2,
        },
        menuItemDescription: {
          color: theme.palette.baselineColor.neutral[80],
          fontSize: '0.75rem',
          lineHeight: 1.2,
          wordBreak: 'break-word',
          whiteSpace: 'normal',
        },
        radioButton: {
          padding: 0,
          alignSelf: 'start',
          marginRight: '0.5rem',
          '& .MuiSvgIcon-root': {
            fontSize: '1.25rem',
          },
          color: theme.palette.baselineColor.neutral[70],
          '&.Mui-checked': {
            color: theme.palette.baselineColor.etendoPrimary.main,
          },
        },
      },
    }),
    [theme],
  );
};

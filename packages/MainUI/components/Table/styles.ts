import { SxProps, Theme, useTheme } from '@mui/material';
import { useMemo } from 'react';

type StylesType = {
  sx: Record<string, SxProps<Theme>>;
};

export const useStyle = (): StylesType => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        loader: {
          position: 'absolute',
          flex: 1,
          height: '100%',
          width: '100%',
          zIndex: 2000,
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        },
        container: {
          overflow: 'auto',
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        },
        table: {
          flex: 1,
        },
        fetchMore: {
          alignSelf: 'center',
          borderRadius: theme.shape.borderRadius,
          margin: theme.spacing(1),
          padding: theme.spacing(1),
          boxShadow: theme.shadows[2],
        },
      },
    }),
    [theme],
  );
};

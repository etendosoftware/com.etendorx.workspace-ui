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
        tablePaper: {
          borderRadius: '1rem 1rem 0 0',
          overflow: 'hidden',
        },
        fetchMore: {
          alignSelf: 'center',
          borderRadius: theme.shape.borderRadius,
          margin: theme.spacing(1),
          padding: theme.spacing(1),
          boxShadow: theme.shadows[2],
        },
        tableHeadCell: {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          borderRight: `1px solid ${theme.palette.divider}`,
          background: theme.palette.baselineColor.transparentNeutral[5],
          fontWeight: 'bold',
          color: theme.palette.text.primary,
          '&:last-child': {
            borderRight: 'none',
          },
          '& .MuiBox-root': {
            whiteSpace: 'nowrap',
          },
        },
        tableBodyCell: {
          borderRight: `1px solid ${theme.palette.divider}`,
          '&:first-of-type': {
            textAlign: 'center',
          },
        },
        tableBody: {
          '& tr': {
            backgroundColor: theme.palette.background.paper,
          },
        },
      },
    }),
    [theme],
  );
};

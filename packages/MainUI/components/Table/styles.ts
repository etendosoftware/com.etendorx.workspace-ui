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
        // multiselect
          selectedContainer: {
            flex: 1,
            border: `1px solid ${theme.palette.baselineColor.neutral[40]}`,
            borderRadius: '4px',
            minHeight: 100,
            maxHeight: 200,
            overflow: 'auto',
          },
          selectedItem: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            borderBottom: `1px solid ${theme.palette.baselineColor.neutral[10]}`,
            '&:hover': {
              backgroundColor: theme.palette.baselineColor.neutral[5],
            },
          },
          emptyState: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: theme.palette.text.secondary,
          },
          searchBar: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: 'auto',
            minWidth: '120px',
            gap: 1,
            border: `1px solid ${theme.palette.baselineColor.neutral[40]}`,
            borderRadius: '4px',
            padding: '8px 12px',
          },
      },
    }),
    [theme],
  );
};

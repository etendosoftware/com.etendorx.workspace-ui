import { useTheme } from '@mui/material';
import { type CSSProperties, useMemo } from 'react';

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        container: {
          padding: '0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        },
        sectionContainer: {
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        },
        sectionBox: {
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '0.75rem',
          backgroundColor: theme.palette.baselineColor.neutral[0],
          padding: '0.75rem 1rem',
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
        },
        sectionTitle: {
          display: 'flex',
          alignItems: 'center',
          fontSize: '0.875rem',
          fontWeight: 500,
          marginBottom: '0.5rem',
          color: theme.palette.baselineColor.neutral[90],
        },
        itemsContainer: {
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem',
        },
        itemBox: {
          display: 'flex',
          cursor: 'pointer',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          transition: 'background-color 500ms, color 500ms',
          '&:hover': {
            backgroundColor: theme.palette.dynamicColor.contrastText,
            color: theme.palette.dynamicColor.main,
          },
        },
        itemIcon: {
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          fontWeight: 500,
        },
        itemText: {
          fontSize: '0.875rem',
          lineHeight: '1.25rem',
          fontWeight: 500,
          opacity: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      } as { [key: string]: CSSProperties },
    }),
    [theme],
  );
};

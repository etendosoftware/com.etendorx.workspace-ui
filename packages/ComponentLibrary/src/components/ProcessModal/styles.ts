import { useTheme, Theme, SxProps } from '@mui/material';
import { useMemo } from 'react';

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () =>
      ({
        styles: {
          dialog: {
            '& .MuiDialog-paper': {
              borderRadius: '1rem',
            },
          },
          dialogTitle: {
            padding: '1.5rem',
          },
          dialogContent: {
            padding: '1.5rem',
          },
          dialogActions: {
            padding: '1rem 1.5rem',
          },
          messageBox: {
            padding: '1rem',
            borderRadius: '0.75rem',
            backgroundColor: theme.palette.baselineColor.neutral[5],
            marginTop: '1rem',
          },
          responseBox: {
            margin: 0,
            padding: '0.75rem',
            backgroundColor: theme.palette.baselineColor.neutral[10],
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          },
          cancelButton: {
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
            height: '2.5rem',
            borderRadius: '6.25rem',
            color: theme.palette.baselineColor.neutral[100],
            background: theme.palette.baselineColor.neutral[20],
            '&:hover': {
              borderRadius: '6.25rem',
              border: 'none',
              background: theme.palette.dynamicColor.main,
            },
          },
          executeButton: {
            fontWeight: 600,
            fontSize: '0.875rem',
            padding: '0.5rem 1rem',
            height: '2.5rem',
            borderRadius: '6.25rem',
            color: theme.palette.baselineColor.neutral[100],
            background: theme.palette.specificColor.warning.main,
            '&:hover': {
              borderRadius: '6.25rem',
              border: 'none',
              background: theme.palette.dynamicColor.main,
            },
            '&.Mui-disabled': {
              background: theme.palette.baselineColor.transparentNeutral[20],
              color: theme.palette.baselineColor.transparentNeutral[40],
            },
          },
          message: {
            fontSize: '1rem',
            color: theme.palette.baselineColor.neutral[80],
            marginBottom: '1rem',
          },
          errorMessage: {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: theme.palette.specificColor.error.main,
            marginBottom: '0.5rem',
          },
          successMessage: {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: theme.palette.baselineColor.neutral[80],
            marginBottom: '0.5rem',
          },
        },
      } satisfies Record<string, SxProps<Theme>>),
    [theme],
  );
};

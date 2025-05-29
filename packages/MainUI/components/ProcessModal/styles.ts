import { useTheme, type Theme, type SxProps } from '@mui/material';
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
          clearButtonHover: {
            width: '2rem',
            height: '2rem',
            transition: 'background-color 0.3s, color 0.3s',
            '&:hover': {
              borderRadius: '50%',
              '& .MuiSvgIcon-root': {
                color: theme.palette.baselineColor.neutral[100],
              },
            },
          },
        },
      }) satisfies Record<string, SxProps<Theme>>,
    [theme],
  );
};

export const tableStyles = {
  paper: 'rounded-lg overflow-hidden border-2 border-gray-200 flex flex-col flex-1 shadow-none max-h-[30rem]',
  headCell:
    'whitespace-nowrap overflow-hidden text-ellipsis border-r border-gray-200 bg-gray-50 font-medium text-gray-800 text-sm py-2 px-3 last:border-r-0',
  bodyCell: 'border-r border-gray-200 first:text-center py-1 px-3 text-sm last:border-r-0 bg-red-400',
  body: 'min-h-min cursor-pointer h-full',
  container: 'flex-1 overflow-auto',
};

import { useMemo } from 'react';
import { Theme, SxProps, useTheme } from '@mui/material';

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(() => {
    return {
      sx: {
        root: {
          '& .MuiInput-root': {
            fontSize: '0.875rem',
            fontWeight: 500,
            textAlign: 'left',
            color: theme.palette.baselineColor.neutral[100],
            borderRadius: '0.75rem 0.75rem 0 0',
            '&:after': {
              borderColor: theme.palette.baselineColor.transparentNeutral[10],
              borderWidth: '0 0 2px',
            },
            '&.Mui-disabled': {
              color: theme.palette.baselineColor.transparentNeutral[50],
              backgroundColor: theme.palette.baselineColor.transparentNeutral[10],
              '&:before': {
                borderColor: theme.palette.baselineColor.transparentNeutral[10],
              },
              '&:after': {
                borderColor: theme.palette.baselineColor.transparentNeutral[10],
              },
            },
            '&:focus-within': {
              '&:after': {
                borderColor: theme.palette.baselineColor.etendoPrimary.main,
                borderWidth: '0 0 2px',
              },
            },
          },
          '& .MuiInputLabel-root': {
            color: theme.palette.baselineColor.neutral[80],
            fontWeight: 'bold',
          },
        },
        labelProps: {
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: '1.25rem',
          color: theme.palette.baselineColor.neutral[80],
          overflow: 'hidden',
        },
        props: {
          height: '3rem',
          padding: '0px 0.5rem',
        },
        startAdornment: {
          height: '1rem',
          width: '1rem',
          marginRight: '0.5rem',
        },
        imgIconLeft: {
          width: '1rem',
          height: '1rem',
          marginRight: '0.5rem',
        },
        buttonsContainer: {
          display: 'flex',
          alignItems: 'center',
        },
        helperTextContainer: {
          display: 'flex',
          alignItems: 'center',
          marginTop: '0.25rem',
          overflow: 'hidden',
        },
        helperText: {
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: '1.25rem',
          color: theme.palette.baselineColor.transparentNeutral[50],
        },
        helperTextIcon: {
          width: '0.875rem',
          height: '0.875rem',
          marginRight: '0.188rem',
        },
        optionsContainer: {
          borderRadius: '0.75rem',
          border: '1px',
          boxShadow: `0px 0.25rem 0.625rem 0px ${theme.palette.baselineColor.transparentNeutral[10]}`,
          padding: '0.5rem',
          '& .MuiAutocomplete-listbox .MuiAutocomplete-option.Mui-focused': {
            bgcolor: theme.palette.baselineColor.neutral[0],
          },
          '& .MuiAutocomplete-listbox .MuiAutocomplete-option.Mui-focused .textOption': {
            color: theme.palette.dynamicColor.dark,
          },
        },
        optionContainer: {
          padding: '0.5rem',
          marginRight: '0.5rem',
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          marginBottom: '0.5rem',
        },
        optionText: {
          flex: 1,
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: '1.25rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        dropdownIcons: {
          width: '0.938rem',
          height: '0.938rem',
        },
        checkIcon: {
          width: '0.875rem',
          height: '0.875rem',
          marginLeft: '0.5rem',
        },
        autocomplete: {
          '& .MuiAutocomplete-endAdornment': {
            marginRight: '0.5rem',
          },
          '& .MuiAutocomplete-clearIndicator': {
            marginRight: '0.063rem',
          },
        },
        listBox: {
          '&::-webkit-scrollbar': {
            width: '0.375rem',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.baselineColor.transparentNeutral[10],
            borderRadius: '0.625rem',
            '&:hover': {
              backgroundColor: theme.palette.baselineColor.transparentNeutral[50],
            },
          },
        },
      } satisfies Record<string, SxProps<Theme>>,
    };
  }, [theme]);
};

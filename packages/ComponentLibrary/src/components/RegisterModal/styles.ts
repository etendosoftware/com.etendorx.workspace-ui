import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { theme } from '../../theme';
import { CSSProperties } from 'react';

export const styles: { [key: string]: CSSProperties } = {
  buttonContainerStyles: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.5rem',
    flex: '1 0 0',
  },
};

export const sx: { [key: string]: SxProps<Theme> } = {
  itemList: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  saveButton: {
    fontWeight: '600',
    fontSize: '0.875rem',
    color: theme.palette.baselineColor.neutral[0],
    padding: '0.5rem 1rem',
    background: theme.palette.baselineColor.neutral[100],
    flex: '1 0 0',
    borderRadius: '6.25rem',
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[80]}`,
    height: '2.5rem',
    '&:hover': {
      borderRadius: '6.25rem',
      background: theme.palette.dynamicColor.main,
      color: theme.palette.baselineColor.neutral[0],
    },
    '&:disabled': {
      border: 'none',
      color: theme.palette.baselineColor.neutral[0],
      background: theme.palette.baselineColor.transparentNeutral[10],
    },
  },

  cancelButton: {
    fontWeight: '600',
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    height: '2.5rem',
    borderRadius: '6.25rem',
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[20]}`,
    flex: '1 0 0',
    color: theme.palette.baselineColor.transparentNeutral[70],
    background: theme.palette.baselineColor.neutral[0],
    '&:hover': {
      borderRadius: '6.25rem',
      background: theme.palette.dynamicColor.main,
      color: theme.palette.baselineColor.neutral[0],
    },
  },
  registerButton: {
    fontWeight: '600',
    fontSize: '0.875rem',
    padding: '0.5rem 1rem',
    width: '8.5rem',
    height: '2.5rem',
    borderRadius: '6.25rem',
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[20]}`,
    flex: '1 0 0',
    color: theme.palette.baselineColor.transparentNeutral[70],
    background: theme.palette.baselineColor.transparentNeutral[0],
    '&:hover': {
      borderRadius: '6.25rem',
      background: theme.palette.dynamicColor.dark,
      color: theme.palette.baselineColor.neutral[0],
    },
  },
};

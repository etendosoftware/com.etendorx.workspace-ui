import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { theme } from '../../theme';

export const cancelLabel = 'Cancel';
export const confirmLabel = 'Confirm';

export const sx: { [key: string]: SxProps<Theme> } = {
  itemList: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
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

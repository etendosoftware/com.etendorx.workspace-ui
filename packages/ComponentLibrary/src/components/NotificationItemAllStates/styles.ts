import { SxProps, Theme } from '@mui/material';
import { theme } from '../../theme';

export const sx: { [key: string]: SxProps<Theme> } = {
  rightButton: {
    background: theme.palette.baselineColor.neutral[100],
    color: theme.palette.baselineColor.neutral[0],
    height: '2rem',
    borderRadius: '6.25rem',
    padding: '0.5rem 1rem',
    '&:hover': {
      border: 'none',
      background: theme.palette.dynamicColor.main,
      color: theme.palette.dynamicColor.contrastText,
    },
  },
  leftButton: {
    background: theme.palette.baselineColor.neutral[10],
    color: theme.palette.baselineColor.transparentNeutral[1000],
    height: '2rem',
    borderRadius: '6.25rem',
    padding: '0.5rem 1rem',
    border: `1px solid ${theme.palette.baselineColor.neutral[10]}`,
    '&:hover': {
      border: 'none',
      background: theme.palette.dynamicColor.main,
      color: theme.palette.dynamicColor.contrastText,
    },
  },
};

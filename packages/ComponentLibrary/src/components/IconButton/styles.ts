import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { theme } from '../../theme';

export const defaultStyles: SxProps<Theme> = {
  boxSizing: 'border-box',
  borderRadius: '6.25rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s ease',
  background: theme.palette.baselineColor.neutral[0],
  '&:hover': {
    backgroundColor: theme.palette.dynamicColor.main,
  },
};

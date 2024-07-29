import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { theme } from '../../theme';

export const defaultStyles: SxProps<Theme> = {
  background: theme.palette.baselineColor.neutral[0],
  '&:hover': {
    backgroundColor: theme.palette.dynamicColor.main,
  },
};

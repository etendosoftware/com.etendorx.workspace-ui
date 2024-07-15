import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { theme } from '../../theme';

export const defaultStyles: SxProps<Theme> = {
  background: 'white',
  '&:hover': {
    backgroundColor: theme.palette.dynamicColor.main,
    '& .MuiSvgIcon-root': {
      color: theme.palette.baselineColor.neutral[0],
    },
  },
};

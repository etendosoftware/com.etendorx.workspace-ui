import type { Theme } from '@emotion/react';
import type { SxProps } from '@mui/material';
import type { CSSProperties } from 'react';
import { theme } from '../../../ComponentLibrary/src/theme';

export const sx: { [key: string]: SxProps<Theme> } = {
  menuStyles: {
    display: 'flex',
    alignItems: 'center',
    '&:hover': {
      color: theme.palette.dynamicColor.dark,
    },
  },
};

export const styles: { [key: string]: CSSProperties } = {
  spanStyles: {
    marginRight: '0.5rem',
  },
};

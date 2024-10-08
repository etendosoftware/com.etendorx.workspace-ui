import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { CSSProperties } from 'react';
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

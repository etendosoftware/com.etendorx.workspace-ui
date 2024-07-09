import { CSSProperties } from 'react';
import { theme } from '../../theme';
import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';

export const styles: { [key: string]: CSSProperties } = {
  iconButtonStyles: {
    width: '2.5rem',
    height: '2.5rem',
    color: theme.palette.baselineColor.neutral[80],
  },
  logoStyles: {
    width: '2.5em',
    height: '2.5rem',
    marginRight: '0.5rem',
    paddingLeft: '0.25rem',
  },
};

export const sx: { [key: string]: SxProps<Theme> } = {
  hoverStyles: {
    background: 'white',
    '&:hover': {
      backgroundColor: theme.palette.dynamicColor.main,
      '& .MuiSvgIcon-root': {
        color: theme.palette.baselineColor.neutral[0],
      },
    },
  },
  iconStyles: {
    width: '1.5rem',
    height: '1.5rem',
    color: theme.palette.baselineColor.neutral[80],
  },
};

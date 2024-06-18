import { CSSProperties } from 'react';
import { SxProps, Theme } from '@mui/material/styles';

const NEUTRAL_0 = '#FCFCFD';
const DYNAMIC_COLOR_MAIN = '#004ACA';
const NEUTRAL_90 = '#1D223A';

export const styles: { [key: string]: CSSProperties } = {
  iconButtonStyles: {
    width: '2.5rem',
    height: '2.5rem',
  },
};

export const sx: { [key: string]: SxProps<Theme> } = {
  hoverStyles: {
    background: 'white',
    '&:hover': {
      backgroundColor: DYNAMIC_COLOR_MAIN,
      '& .MuiSvgIcon-root': {
        color: NEUTRAL_0,
      },
    },
  },
  iconStyles: {
    width: '1.5rem',
    height: '1.5rem',
    color: NEUTRAL_90,
  },
  badgeStyles: {
    '.MuiBadge-badge': {
      fontSize: '0.75rem',
    },
  },
};

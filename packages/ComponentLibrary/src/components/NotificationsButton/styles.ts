import { CSSProperties } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { PRIMARY_MAIN, PRIMARY_50, NEUTRAL_80 } from '../../colors';

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
      backgroundColor: PRIMARY_MAIN,
      '& .MuiSvgIcon-root': {
        color: PRIMARY_50,
      },
    },
  },
  iconStyles: {
    width: '1.5rem',
    height: '1.5rem',
    color: NEUTRAL_80,
  },
  badgeStyles: {
    '.MuiBadge-badge': {
      fontSize: '0.75rem',
    },
  },
};

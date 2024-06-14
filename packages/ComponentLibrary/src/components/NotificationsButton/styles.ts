import { CSSProperties } from 'react';
import { SxProps, Theme } from '@mui/material/styles';

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
      backgroundColor: '#004ACA',
      '& .MuiSvgIcon-root': {
        color: '#ffffff',
      },
    },
  },
  iconStyles: {
    width: '1.5rem',
    height: '1.5rem',
    color: '#2E365C',
  },
  badgeStyles: {
    '.MuiBadge-badge': {
      fontSize: '0.75rem',
    },
  },
};

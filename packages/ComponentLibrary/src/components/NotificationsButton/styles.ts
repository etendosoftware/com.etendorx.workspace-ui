import { CSSProperties } from 'react';
import { SxProps, Theme } from '@mui/material/styles';
import { theme } from '../../theme';

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
  badgeStyles: {
    '.MuiBadge-badge': {
      fontSize: '0.75rem',
    },
  },
};

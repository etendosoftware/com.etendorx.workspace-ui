import { SxProps } from '@mui/material';
import { CSSProperties } from 'react';
import { theme } from '../../../../theme';

export const tabLabelContainerStyles: SxProps = {
  display: 'flex',
  alignItems: 'center',
};

export const badgeStyles: SxProps = {
  marginLeft: '0.875rem',
  '& .MuiBadge-badge': {
    backgroundColor: theme.palette.baselineColor.transparentNeutral[5],
    color: theme.palette.baselineColor.neutral[100],
    fontSize: '0.875rem',
    fontWeight: 500,
    height: '1.5rem',
    borderRadius: '12.5rem',
    paddingX: '0.5rem',
  },
};

export const badgeTextStyles: CSSProperties | undefined = {
  marginLeft: '0.5rem',
  marginRight: '0.5rem',
  fontSize: '0.875rem',
};

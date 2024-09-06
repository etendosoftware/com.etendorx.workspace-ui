import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { theme } from '../../theme';

export const sx: { [key: string]: SxProps<Theme> } = {
  statusModalContainer: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  statusIcon: {
    width: '2.25rem',
    height: '2.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '1.125rem',
  },
  statusText: {
    position: 'relative',
    zIndex: 1,
    marginBottom: '1rem',
    fontWeight: '600',
    fontSize: '1.350rem',
    color: theme.palette.baselineColor.neutral[90],
  },
};

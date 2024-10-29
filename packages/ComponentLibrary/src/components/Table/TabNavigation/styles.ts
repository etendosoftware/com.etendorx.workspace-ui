import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { theme } from '../../../theme';

export const styles: { [key: string]: SxProps<Theme> } = {
  paper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderRadius: '1rem 1rem 0 0',
    transition: 'transform 0.3s ease, height 0.3s ease',
    zIndex: 9999,
  },
  resizer: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '4rem',
    height: '0.5rem',
    backgroundColor: theme.palette.grey[300],
    marginTop: '0.25rem',
    borderRadius: '0.5rem',
    cursor: 'ns-resize',
    '&:hover': {
      backgroundColor: theme.palette.grey[400],
    },
  },
  container: {
    overflow: 'auto',
    height: '100%',
  },
  //Record Styles
  recordContainer: {
    display: 'flex',
    flexDirection: 'column',
    cursor: 'ns-resize',
  },
  recordContainerItems: {
    display: 'flex',
    alignItems: 'center',
  },
  recordHeader: {
    height: '2.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem',
    borderRadius: '1rem 1rem 0 0',
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
    background: theme.palette.baselineColor.transparentNeutral[5],
  },
  typeBox: {
    display: 'flex',
    alignItems: 'center',
    background: theme.palette.baselineColor.transparentNeutral[5],
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
    padding: '0 0.5rem 0 0.5rem',
    borderRadius: '1.5rem',
    maxHeight: '2rem',
  },
  identifierBox: {
    marginLeft: '0.5rem',
    minWidth: '2rem',
  },
  title: {
    color: theme.palette.baselineColor.neutral[100],
    fontWeight: 600,
    fontSize: '1.25rem',
  },
  iconButton: {
    background: 'none',
    '&:hover': {
      background: theme.palette.baselineColor.transparentNeutral[5],
    },
  },
  contentContainer: {
    flexGrow: 1,
    overflowY: 'auto',
    height: '100%',
  },
};

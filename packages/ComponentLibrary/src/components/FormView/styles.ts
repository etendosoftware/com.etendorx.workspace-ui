import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { CSSProperties } from 'react';
import { theme } from '../../theme';

export const styles: { [key: string]: CSSProperties } = {
  dottedLine: {
    borderRight: `2px dotted ${theme.palette.divider}`,
    height: '100%',
    margin: '0 1rem',
  },
  labelWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  labelText: {
    fontSize: '0.875rem',
    whiteSpace: 'nowrap',
    color: theme.palette.baselineColor.neutral[80],
  },
  dottedSpacing: {
    flex: 1,
    borderBottom: `1px dotted ${theme.palette.text.secondary}`,
    marginLeft: theme.spacing(0.5),
    marginRight: theme.spacing(1),
  },
  requiredAsterisk: {
    width: '0.75rem',
    height: '1rem',
    color: theme.palette.specificColor.error.main,
    marginLeft: theme.spacing(1),
  },
  fieldContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
};

export const sx: { [key: string]: SxProps<Theme> } = {
  accordion: {
    width: '100%',
    marginTop: '0.5rem',
    borderRadius: '0.75rem',
    '&:before': {
      display: 'none',
    },
    '&:first-of-type': {
      borderRadius: '0.75rem',
    },
    '&:last-of-type': {
      borderRadius: '0.75rem',
    },
  },
  accordionSummary: {
    borderRadius: '0.75rem',
    '&.Mui-expanded': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
  },
  labelBox: {
    flexBasis: '40%',
    alignContent: 'center',
    alignItems: 'center',
  },
  inputBox: {
    flexGrow: 1,
  },
  checkboxContainer: {
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '1px',
      backgroundColor: theme.palette.baselineColor.neutral[100],
      opacity: 0.42,
    },
    '&:hover::after': {
      height: '2px',
      opacity: 0.87,
    },
    '&:focus-within::after': {
      height: '2px',
      backgroundColor: theme.palette.baselineColor.neutral[100],
      opacity: 1,
    },
  },
  gridItem: {
    display: 'flex',
    alignItems: 'stretch',
  },
};

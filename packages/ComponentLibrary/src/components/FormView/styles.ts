import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { CSSProperties } from 'react';
import { theme } from '../../theme';

export const defaultFill = theme.palette.dynamicColor.main;

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
    border: `1px solid ${theme.palette.divider}`,
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
    '&.MuiAccordion-root': {
      '&:before': {
        display: 'none',
      },
      '&.Mui-expanded': {
        margin: `${theme.spacing(1)} 0 0`,
      },
    },
    '& .MuiAccordionSummary-root': {
      minHeight: 'auto',
      '&.Mui-expanded': {
        minHeight: 'auto',
      },
    },
    '& .MuiAccordionSummary-content': {
      margin: `${theme.spacing(1)} 0`,
      '&.Mui-expanded': {
        margin: `${theme.spacing(1)} 0`,
      },
    },
    '& .MuiAccordionDetails-root': {
      padding: theme.spacing(2),
    },
  },
  iconLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  iconButton: {
    width: '2rem',
    height: '2rem',
    background: theme.palette.dynamicColor.contrastText,
  },
  chevronButton: {
    background: 'none',
    '&:hover': {
      background: theme.palette.baselineColor.transparentNeutral[5],
    },
  },
  accordionSummary: {
    borderRadius: '0.75rem',
    '&.Mui-expanded': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
    '&:hover .main-icon-button': {
      backgroundColor: theme.palette.dynamicColor.main,
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

import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';
import { CSSProperties } from 'react';
import { theme } from '@workspaceui/componentlibrary/src/theme';

export const defaultFill = theme.palette.dynamicColor.main;
export const noteColors = [
  '#FFA07A',
  '#98FB98',
  '#87CEFA',
  '#DDA0DD',
  '#F0E68C',
  '#47a3f3',
  '#2186eb',
];

export const styles: { [key: string]: CSSProperties } = {
  dottedLine: {
    backgroundImage: `radial-gradient(circle, ${theme.palette.divider} 1px, transparent 1px)`,
    backgroundSize: '8px 8px',
    backgroundPosition: 'right',
    backgroundRepeat: 'repeat-y',
    width: '8px',
    height: '100%',
    margin: '0 1rem',
  },
  dottedSpacing: {
    flex: 1,
    backgroundImage: `radial-gradient(circle, ${theme.palette.text.secondary} 1px, transparent 1px)`,
    backgroundSize: '8px 4px',
    backgroundPosition: 'bottom',
    backgroundRepeat: 'repeat-x',
    height: '4px',
    marginLeft: theme.spacing(1.5),
    marginRight: theme.spacing(2),
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
  //Notes Styles
  addNoteButton: {
    height: '8rem',
    width: '100%',
    border: `2px solid ${theme.palette.baselineColor.neutral[40]}`,
    alignItems: 'center',
    flexDirection: 'column',
    display: 'flex',
    justifyContent: 'center',
    borderRadius: '1.75rem',
    borderStyle: 'dashed',
    '&:hover': {
      border: `2px solid ${theme.palette.dynamicColor.main}`,
      borderRadius: '1.75rem',
      background: theme.palette.baselineColor.etendoPrimary.contrastText,
    },
  },
  addNoteText: {
    maxHeight: '4rem',
    overflow: 'hidden',
    color: theme.palette.baselineColor.neutral[90],
  },
  noteCard: {
    height: '8rem',
    padding: '1.25rem',
    position: 'relative',
    borderRadius: '1.75rem',
    border: `2px solid ${theme.palette.baselineColor.transparentNeutral[0]}`,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    '&:hover': {
      border: `2px solid ${theme.palette.dynamicColor.main}`,
    },
  },
  noteCardContent: {
    padding: 0,
    '&:last-child': {
      paddingBottom: 0,
    },
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'space-between',
  },
  noteContentBox: {
    flex: 1,
    overflow: 'hidden',
  },
  noteContentText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    lineHeight: '1rem',
    maxHeight: '3rem',
    wordBreak: 'break-word',
    color: theme.palette.baselineColor.transparentNeutral[100],
  },
  noteDate: {
    color: theme.palette.baselineColor.transparentNeutral[50],
  },
  deleteButtonBox: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.75rem',
    display: 'none',
    '.MuiCard-root:hover &': {
      display: 'flex',
    },
  },
};

import { CSSProperties } from 'react';
import { SxProps, Theme } from '@mui/material';
import { theme } from '../../theme';

export const styles: { [key: string]: CSSProperties } = {
  iconContainerStyles: {
    width: '2.25rem',
    height: '2.25rem',
    display: 'flex',
    justifyContent: 'center',
    alignContent: 'center',
    flexWrap: 'wrap',
    background: theme.palette.dynamicColor.contrastText,
    borderRadius: '100%',
  },
  textContainerStyles: {
    marginLeft: '0.5rem',
    width: '22.25rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  descriptionStyles: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.25rem',
  },
  ctaButtonContainer: {
    marginTop: '10px',
    display: 'flex',
    gap: '10px',
  },
  dateContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  dateStyles: {
    fontSize: '0.75rem',
    fontWeight: '500',
    marginTop: '0.25rem',
  },
  anchorStyles: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.063rem',
    color: theme.palette.dynamicColor.main,
    textDecoration: 'none',
  },
};

export const sx: { [key: string]: SxProps<Theme> } = {
  listItem: {
    padding: 0,
  },
  notificationBox: {
    width: '27.25rem',
    borderRadius: '0.75rem',
    margin: '0.25rem 0.75rem',
    padding: '0.75rem 1rem',
    display: 'flex',
    backgroundColor: theme.palette.baselineColor.neutral[0],
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
    '&:hover': {
      backgroundColor: theme.palette.baselineColor.neutral[10],
      outline: `2px solid ${theme.palette.dynamicColor.main}`,
      '& .closeIcon': {
        visibility: 'visible',
      },
      '& > .textContainer': {
        paddingRight: '1.5rem',
      },
    },
  },
  closeIconButton: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    visibility: 'hidden',
    '& .closeIcon': {
      fill: theme.palette.baselineColor.neutral[80],
      width: '1rem',
      height: '1rem',
    },
  },
  leftButton: {
    background: theme.palette.baselineColor.transparentNeutral[10],
    color: theme.palette.baselineColor.transparentNeutral[70],
    height: '2rem',
    borderRadius: '6.25rem',
    padding: '0.5rem 1rem',
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
    '&:hover': {
      border: 'none',
      background: theme.palette.dynamicColor.main,
      color: theme.palette.baselineColor.neutral[10],
    },
  },
  rightButton: {
    background: theme.palette.baselineColor.neutral[100],
    color: theme.palette.baselineColor.neutral[0],
    height: '2rem',
    borderRadius: '6.25rem',
    padding: '0.5rem 1rem',
    '&:hover': {
      border: 'none',
      background: theme.palette.dynamicColor.main,
      color: theme.palette.baselineColor.neutral[10],
    },
  },
};

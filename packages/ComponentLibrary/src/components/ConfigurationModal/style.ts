import { CSSProperties } from 'react';
import { theme } from '../../theme';
import { Theme } from '@emotion/react';
import { SxProps } from '@mui/material';

export const menuSyle = { paddingY: 0 };
export const COLUMN_SPACING = '0.75rem';
export const FIRST_MARGIN_TOP = '0.75rem';
export const BORDER_SELECT_1 = '1px solid ';
export const BORDER_SELECT_2 = '2px solid ';

export const styles: { [key: string]: CSSProperties } = {
  titleModalContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: theme.palette.baselineColor.neutral[0],
    padding: '0.75rem',
  },
  titleModalImageContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleModalImageRadius: {
    width: '2rem',
    height: '2rem',
    alignItems: 'center',
    justifyContent: 'center',
    display: 'flex',
    background: theme.palette.baselineColor.neutral[10],
    borderRadius: '2rem',
    marginRight: '0.25rem',
  },
  titleModalImage: {
    width: '1rem',
    height: '1rem',
  },
  titleModal: {
    fontSize: '1rem',
    fontWeight: '600',
    lineHeight: '1.21rem',
    textAlign: 'left',
  },
  imgContainer: {
    borderRadius: '0.75rem',
    width: '7rem',
    height: '4.5rem',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.25s ease',
  },
  img: { width: '100%', height: '100%' },
  title: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.063rem',
    textAlign: 'left',
    marginBottom: '0.75rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1.063rem',
    textAlign: 'left',
  },
  labelIcon: {
    width: '1rem',
    height: '1rem',
    marginRight: '0.25rem',
  },
  labelIconContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: '1.25rem',
    marginTop: '0.25rem',
  },
  gridContainer: {
    padding: '0.75rem 1rem',
  },
  gridSectionContainer: {
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
    background: theme.palette.baselineColor.neutral[0],
    padding: '0.75rem 1rem 0.75rem 1rem',
    borderRadius: '0.75rem',
  },
  paperStyleMenu: {
    background: theme.palette.baselineColor.neutral[10],
    borderRadius: '0.75rem',
  },
  listContainer: {
    padding: '0.75rem',
  },
  iconButtonStyles: {
    width: '2.5rem',
    height: '2.5rem',
    color: theme.palette.baselineColor.neutral[80],
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
  linkStyles: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1rem',
    color: theme.palette.dynamicColor.main,
    textDecoration: 'none',
    paddingRight: '0.5rem',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
};

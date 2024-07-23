import { SxProps, Theme, styled } from '@mui/material';
import { CSSProperties } from 'react';
import { theme } from '../../theme';

export const menuSyle = { paddingY: 0 };

export const styles: { [key: string]: CSSProperties } = {
  SectionContainer: {
    padding: '0.5rem',
  },
  StartIconStyles: {
    marginLeft: '0.5rem',
    maxHeight: '1rem',
    maxWidth: '1rem',
  },
  EndIconStyles: {
    position: 'absolute',
    right: '0',
    marginRight: '0.5rem',
  },
  SpanStyles: {
    paddingRight: '0.5rem',
  },
  paperStyleMenu: {
    borderRadius: '0.75rem',
  },
};

export const FadeWrapper = styled('div')({
  transition: 'opacity 0.2s ease-in-out',
  opacity: 1,
  '&.fade-out': {
    opacity: 0,
  },
});

export const sx: { [key: string]: SxProps<Theme> } = {
  menuItemStyles: {
    margin: '0 0.5rem',
    padding: '0.5rem',
    '&:hover': {
      borderRadius: '0.5rem',
      background: theme.palette.dynamicColor.contrastText,
    },
  },
  customizeButton: {
    fontWeight: '500',
    fontSize: '1rem',
    width: '100%',
    height: '2.25rem',
    borderRadius: '0.5rem',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
    '&:hover': {
      border: 'none',
      color: theme.palette.baselineColor.neutral[80],
    },
  },
  headerBox: {
    '&:hover': {
      background: theme.palette.dynamicColor.contrastText,
      borderRadius: '0.5rem',
    },
  },
};

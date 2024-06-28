import { SxProps, Theme, styled } from '@mui/material';
import { CSSProperties } from 'react';
import { theme } from '../../theme';

export const MODAL_WIDTH = 240;

export const styles: { [key: string]: CSSProperties } = {
  CustomizeButton: {
    fontWeight: '500',
    fontSize: '1rem',
    width: '100%',
    height: '2.25rem',
    borderRadius: '0.5rem',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    position: 'relative',
  },
  StartIconStyles: {
    marginLeft: '0.5rem',
    maxHeight: '1rem',
    maxWidth: '1rem',
  },
  EndIconStyles: {
    position: 'absolute',
    right: '0',
    paddingLeft: '0 0.5rem',
  },
  SectionContainer: {
    padding: '0.5rem',
  },
  SpanStyles: {
    paddingRight: '0.5rem',
  },
  containerStyles: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1.25rem 0 1.25rem',
    maxHeight: '2.25rem',
  },
  showAllStyles: {
    textDecoration: 'none',
    color: 'blue',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
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
  customizeButton: {
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
  menuItemStyles: {
    margin: '0 0.5rem',
    padding: '0.5rem',
    '&:hover': {
      background: '',
      borderRadius: '0.5rem',
      color: theme.palette.baselineColor.neutral[80],
    },
  },
};

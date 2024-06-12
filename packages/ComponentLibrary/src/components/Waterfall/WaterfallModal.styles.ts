import { styled } from '@mui/material';
import { CSSProperties } from 'react';
import { TERTIARY_800, NEUTRAL_300 } from '../../colors';

export const MODAL_WIDTH = 240;
export const PRIMARY_BLUE = TERTIARY_800;
export const PRIMARY_GREY = NEUTRAL_300;

export const SectionContainer: CSSProperties = {
  padding: '0.5rem',
};

export const CustomizeButton: CSSProperties = {
  fontWeight: '500',
  fontSize: '1rem',
  width: '100%',
  height: '2.25rem',
  borderRadius: '0.5rem',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  position: 'relative',
};

export const StartIconStyles: CSSProperties = {
  paddingLeft: '0.5rem',
  paddingRight: '0.5rem',
  maxHeight: '1rem',
  maxWidth: '1rem',
};

export const EndIconStyles: CSSProperties = {
  position: 'absolute',
  right: '0',
  paddingLeft: '0 0.5rem',
};

export const FadeWrapper = styled('div')({
  transition: 'opacity 0.2s ease-in-out',
  opacity: 1,
  '&.fade-out': {
    opacity: 0,
  },
});

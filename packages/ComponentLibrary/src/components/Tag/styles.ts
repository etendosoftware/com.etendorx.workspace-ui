import React from 'react';
import { TagType } from './types';
import { theme } from '../../theme';

export const getColor = (type: TagType): string => {
  switch (type) {
    case 'primary':
      return theme.palette.dynamicColor.main;
    case 'success':
      return theme.palette.specificColor.success.main;
    case 'warning':
      return theme.palette.specificColor.warning.main;
    case 'error':
      return theme.palette.specificColor.error.main;
    case 'draft':
      return theme.palette.specificColor.draft.contrastText;
    default:
      return theme.palette.dynamicColor.main;
  }
};

export const getTextColor = (type: TagType): string => {
  switch (type) {
    case 'primary':
    case 'success':
    case 'error':
      return theme.palette.dynamicColor.contrastText;
    case 'warning':
    case 'draft':
      return theme.palette.baselineColor.neutral[100];
    default:
      return theme.palette.dynamicColor.contrastText;
  }
};

export const getColoredIcon = (icon: React.ReactElement, type: TagType): React.ReactElement => {
  return React.cloneElement(icon, {
    style: { ...icon.props.style, ...getColoredIconStyle(type) }
  });
};

export const getColoredIconStyle = (type: TagType) => ({
  color: getTextColor(type),
  width: '1rem',
  height: '1rem',
  margin: '0',
  padding: '0'
});

export const chipStyles = (type: TagType) => ({
  backgroundColor: getColor(type),
  color: getTextColor(type),
  height: '1.5rem',
  fontWeight: 500,
  cursor: 'default' as const,
  padding: '0 0.5rem',
  fontFamily: 'Inter, sans-serif',
  border: 'none',
});

export const chipLabelStyles = (icon?: React.ReactElement) => ({
  '& .MuiChip-label': {
    fontFamily: 'Inter',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    padding: '0',
    margin: '0',
    paddingLeft: icon ? '0.25rem' : '0',
  },
});

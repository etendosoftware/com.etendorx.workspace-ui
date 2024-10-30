import React from 'react';
import { Theme, useTheme, SxProps } from '@mui/material';
import { CSSProperties, ReactElement, useMemo } from 'react';
import { TagType } from './types';

type StylesType = {
  getColor: (type: TagType) => string;
  getTextColor: (type: TagType) => string;
  getColoredIcon: (icon: ReactElement, type: TagType) => ReactElement;
  getChipStyles: (type: TagType) => CSSProperties;
  sx: {
    chipLabel: (icon?: ReactElement) => SxProps<Theme>;
  };
};

export const useStyle = (): StylesType => {
  const theme = useTheme();
  const self = useMemo(
    () => ({
      getColor: (type: TagType): string => {
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
      },
      getTextColor: (type: TagType): string => {
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
      },
      getChipStyles: (type: TagType): CSSProperties => ({
        backgroundColor: self.getColor(type),
        color: self.getTextColor(type),
        height: '1.5rem',
        fontWeight: 500,
        cursor: 'default',
        padding: '0 0.5rem',
        fontFamily: 'Inter, sans-serif',
        border: 'none',
      }),
      sx: {
        chipLabel: (icon?: ReactElement): SxProps<Theme> => ({
          '& .MuiChip-label': {
            fontFamily: 'Inter',
            fontWeight: 500,
            fontSize: '0.875rem',
            lineHeight: '1.25rem',
            padding: '0',
            margin: '0',
            paddingLeft: icon ? '0.25rem' : '0',
          },
        }),
      },
    }),
    [theme],
  );

  const getColoredIcon = (icon: ReactElement, type: TagType): ReactElement => {
    return React.cloneElement(icon, {
      style: {
        ...icon.props.style,
        color: self.getTextColor(type),
        width: '1rem',
        height: '1rem',
        margin: '0',
        padding: '0',
      },
    });
  };

  return {
    ...self,
    getColoredIcon,
  };
};

import { type Theme, useTheme } from '@mui/material';
import { useMemo } from 'react';

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      sx: {
        container: {
          display: 'flex',
          flexDirection: 'column',
        },
        tabsContainer: {
          overflow: 'hidden',
          cursor: 'grab',
          height: '2.25rem',
          display: 'flex',
          alignItems: 'center',
          padding: '0 0.5rem',
          width: '100%',
          position: 'relative',
          '& .MuiTabs-root': {
            minHeight: '2.25rem',
          },
          '& .MuiTabs-scroller': {
            overflow: 'hidden !important',
          },
        },
        rightButtonContainer: {
          position: 'absolute',
          right: '0.5rem',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          zIndex: 1,
        },
        iconContainer: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        menuItemTypography: {
          marginRight: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: theme.palette.baselineColor.neutral[90],
          transition: 'color 0.5s ease',
        },
        menuItemIcon: {
          width: '1rem',
          height: '1rem',
          color: theme.palette.baselineColor.neutral[70],
        },
        tab: {
          minWidth: 'auto',
          padding: '0 0.725rem',
          backgroundColor: 'transparent',
          position: 'relative',
          transition: 'color 0.3s ease',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '2px',
            backgroundColor: theme.palette.baselineColor.neutral[90],
            transform: 'scaleX(0)',
            transition: 'transform 0.3s ease',
            top: '2.5rem',
          },
          '&.Mui-selected': {
            color: theme.palette.baselineColor.neutral[90],
            '&::after': {
              transform: 'scaleX(1)',
            },
          },
          '&:hover': {
            backgroundColor: 'transparent',
            color: theme.palette.baselineColor.neutral[90],
          },
        },
        common: {
          width: '2rem',
          height: '2rem',
          backgroundColor: theme.palette.baselineColor.neutral[0],
          borderRadius: '12.5rem',
          marginTop: '0.375rem',
        },
        menuPaper: {
          marginTop: '0.25rem',
          border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
          padding: '0.5rem',
          boxShadow: `0 0.25rem 0.625rem 0 ${theme.palette.baselineColor.transparentNeutral[10]}`,
          borderRadius: '0.75rem',
        },
        menuItemRoot: {
          '.MuiList-root': { padding: 0 },
        },
        menuItem: {
          display: 'flex',
          alignItems: 'center',
          maxHeight: '36.25rem',
          width: '14.5rem',
          padding: '0.5rem',
          fontWeight: 500,
          fontSize: '0.875rem',
          borderRadius: '0.5rem',
          transition: 'background-color 500ms, color 500ms',
          '&:hover': {
            backgroundColor: theme.palette.dynamicColor.contrastText,
            color: theme.palette.dynamicColor.main,
          },
        },
        menuItemIconModal: {
          width: '1rem',
          height: '1rem',
          marginRight: '0.5rem',
          color: theme.palette.baselineColor.neutral[60],
        },
      },
    }),
    [theme],
  );
};

export const getRightButtonStyles = (open: boolean, theme: Theme) => ({
  color: open ? theme.palette.dynamicColor.contrastText : theme.palette.baselineColor.neutral[80],
  backgroundColor: open ? theme.palette.baselineColor.neutral[80] : theme.palette.baselineColor.neutral[0],
  borderRadius: '50%',
  boxShadow: '0 0.25rem 0.5rem rgba(0, 0, 0, 0.15)',
  transition: 'background-color 0.5s ease, color 0.5s ease, border-radius 0.5s ease, box-shadow 0.5s ease',
  '&:hover': {
    color: theme.palette.dynamicColor.contrastText,
    backgroundColor: theme.palette.baselineColor.neutral[80],
    boxShadow: '0 0.25rem 0.625rem 0 #00030D1A',
    borderRadius: '12.5rem',
  },
  padding: 0,
  height: '1.75rem',
  width: '1.75rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

import { useMemo } from 'react';
import { type SxProps, type Theme, useTheme } from '@mui/material';

export const menuStyle = { paddingY: 0 };

export const useStyle = () => {
  const theme = useTheme();
  return useMemo(
    () => ({
      sx: {
        container: {
          display: 'flex',
          maxWidth: '100%',
          overflow: 'hidden',
          minWidth: '4.75rem',
          paddingRight: '2rem',
          height: '3rem',
          background: '',
        },
        breadcrumbs: {
          flexGrow: 1,
          overflow: 'hidden',
        },
        homeLink: {
          width: '2.5rem',
          height: '2.5rem',
          padding: '0 1rem',
          borderRadius: '6.5rem',
          maxWidth: '18.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.375rem',
          textDecoration: 'none',
        },
        breadcrumbTypography: {
          fontSize: '1.375rem',
          fontWeight: '600',
          color: theme.palette.baselineColor.neutral[100],
          '&:hover': {
            textDecoration: 'underline',
            color: theme.palette.baselineColor.neutral[100],
          },
        },
        breadcrumbItem: {
          height: '3rem',
          padding: '0 1rem',
          borderRadius: '6.5rem',
          maxWidth: '100%',
          display: 'inline-flex',
          alignItems: 'center',
        },
        lastItemTypography: {
          fontSize: '1.375rem',
          fontWeight: '600',
          cursor: 'pointer',
          color: theme.palette.baselineColor.neutral[100],
        },
        link: {
          textDecoration: 'none',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        },
        homeContainer: {
          display: 'flex',
          alignItems: 'center',
        },
        homeIconString: {
          backgroundColor: theme.palette.baselineColor.transparentNeutral[5],
          width: '2.5rem',
          height: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '1.25rem',
          padding: '1rem',
        },
        homeText: {
          fontSize: '1.375rem',
          fontWeight: '600',
          margin: '0 0.5rem',
          cursor: 'pointer',
          color: theme.palette.baselineColor.neutral[100],
          '&:hover': {
            textDecoration: 'underline',
          },
        },
        actionButton: {
          marginLeft: '0.5rem',
          padding: '0.25rem',
        },
        menu: {
          borderRadius: '0.75rem',
          '& .MuiPaper-root': {
            borderRadius: '0.75rem',
            background: theme.palette.dynamicColor.contrastText,
          },
        },
        menuItem: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '0.5rem',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          '&:hover': {
            color: theme.palette.dynamicColor.main,
            background: theme.palette.dynamicColor.contrastText,
          },
        },
        iconBox: {
          display: 'flex',
          alignItems: 'center',
          '& > *:first-of-type': {
            marginRight: '0.5rem',
          },
          '& span': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        },
        toggleContainer: {
          marginLeft: '1rem',
        },
        homeIconHovered: {
          '&:hover': {
            background: theme.palette.baselineColor.neutral[0],
          },
        },
        homeIconComponent: {
          background: theme.palette.baselineColor.transparentNeutral[5],
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme],
  );
};

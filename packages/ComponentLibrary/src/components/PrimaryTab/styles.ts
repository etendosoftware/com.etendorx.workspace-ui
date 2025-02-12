import { CSSProperties, useMemo } from 'react';
import { SxProps, Theme, useTheme } from '@mui/material';

export const tabIndicatorProps = { style: { display: 'none' } };
export const menuStyle = { paddingY: 0 };

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        containerBox: {
          display: 'inline-flex',
          background: theme.palette.baselineColor.transparentNeutral[5],
          borderRadius: '12.5rem',
          padding: '0.25rem',
          alignItems: 'center',
          width: '100%',
        },
        tabsContainer: {
          flexGrow: 1,
          overflowX: 'auto',
        },
        iconButtonMore: {
          marginLeft: '0.25rem',
          padding: '0.5rem',
        },
      } as { [key: string]: CSSProperties },
      sx: {
        tabs: {
          minHeight: 'unset',
          '& .MuiTabs-scrollButtons': {
            '&.Mui-disabled': {
              opacity: 0.3,
            },
          },
        },
        tab: {
          marginRight: '0.25rem',
          minHeight: 48,
          textTransform: 'none',
          borderRadius: '12.5rem',
          transition: 'background-color 0.3s, color 0.4s',
          color: theme.palette.baselineColor.neutral[90],
          padding: '0.25rem 1rem',
          whiteSpace: 'nowrap',
          '& .MuiTab-iconWrapper': {
            marginRight: '0.5rem',
          },
          '&.Mui-selected': {
            background: theme.palette.baselineColor.neutral[0],
            color: theme.palette.baselineColor.neutral[90],
          },
          '&:hover:not(.Mui-selected)': {
            color: theme.palette.baselineColor.neutral[0],
            background: theme.palette.dynamicColor.main,
          },
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
          width: '15rem',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '0.5rem',
          padding: '0.5rem',
          borderRadius: '0.5rem',
          '&.Mui-selected': {
            background: theme.palette.baselineColor.neutral[10],
          },
          '&:hover': {
            background: '',
            color: theme.palette.baselineColor.neutral[80],
          },
        },
        selectedMenuItem: {
          backgroundColor: theme.palette.dynamicColor.contrastText,
        },
        iconBox: {
          display: 'flex',
          alignItems: 'center',
          maxWidth: '10rem',
          overflow: 'hidden',
          '& span': {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginLeft: '0.5rem',
          },
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme],
  );
};

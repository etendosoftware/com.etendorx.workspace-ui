import { CSSProperties } from 'react';
import { SxProps, Theme } from '@mui/material';
import { theme } from '../../theme';

export const tabIndicatorProps = { style: { display: 'none' } };
export const menuStyle = { paddingY: 0 };

export const styles: { [key: string]: CSSProperties } = {
  containerBox: {
    display: 'inline-flex',
    background: theme.palette.baselineColor.transparentNeutral[5],
    borderRadius: '12.5rem',
    padding: '0.25rem',
    alignItems: 'center',
    overflowX: 'auto',
  },
  tabsContainer: {
    display: 'flex',
    flexGrow: 1,
    minWidth: 0,
    zIndex: 1100,
  },
  iconButtonMore: {
    marginLeft: '0.25rem',
    padding: '0.5rem',
  },
};

export const sx: { [key: string]: SxProps<Theme> } = {
  tabs: {
    minHeight: 'unset',
    '& .MuiTabs-scrollButtons': {
      '&.Mui-disabled': {
        opacity: 0.3,
      },
    },
  },
  tab: {
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
};

import { SxProps, Theme } from '@mui/material';
import { theme } from '../../theme';

export const menuStyle = { paddingY: 0 };

export const styles: { [key: string]: SxProps<Theme> } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: '2.5rem',
    padding: '0 0.25rem',
    height: '2.25rem',
    background: theme.palette.baselineColor.transparentNeutral[5],
  },
  homeButton: {
    height: '2rem',
    width: '2rem',
  },
  tabList: {
    alignItems: 'center',
    '& .MuiTabs-flexContainer': {
      gap: '0.25rem',
    },
    '& .MuiTabs-indicator': {
      backgroundColor: theme.palette.dynamicColor.main,
    },
    '& .MuiTabScrollButton-root': {
      width: '1.5rem',
      height: '1.5rem',
      borderRadius: '1rem',
      margin: '0.25rem',
    },
  },
  tabWrapper: {
    display: 'flex',
    alignItems: 'center',
  },
  tab: {
    borderRadius: '0.75rem 0.75rem 0 0',
    background: 'none',
    minHeight: 'unset',
    height: '2.25rem',
    '&.Mui-selected': {
      background: theme.palette.baselineColor.neutral[0],
    },
  },
  tabLabel: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.baselineColor.neutral[90],
  },
  closeButton: {
    background: 'none',
    padding: '0.15rem',
    width: '1.25rem',
    height: '1.25rem',
    marginLeft: '1rem',
    '&:hover': {
      background: theme.palette.baselineColor.transparentNeutral[5],
    },
  },
  tabPanel: {
    padding: '3rem',
  },
};

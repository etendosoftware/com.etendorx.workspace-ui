import { SxProps, Theme } from '@mui/material';
import { theme } from '../../theme';

export const tableStyles: Record<string, SxProps<Theme>> = {
  container: {
    display: 'flex',
    width: '100%',
    padding: '1rem 0 1rem 0',
    flexDirection: 'column',
    gap: '1rem',
  },
  topToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tablePaper: {
    borderRadius: '15rem',
  },
  fullScreenContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    padding: '1rem',
    gap: '1rem',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
  },
  actionButton: {
    minWidth: 120,
  },
  salaryCell: {
    backgroundColor: theme.palette.success.light,
    borderRadius: '4px',
    padding: '4px 8px',
    display: 'inline-block',
  },
  tableContainer: {
    '& .MuiPaper-root': {
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
    },
  },
  headerCell: {
    fontWeight: 'bold',
    backgroundColor: theme.palette.grey[100],
  },
  rowHover: {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  pagination: {
    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
      marginBottom: 0,
    },
  },
};

export const sx: { [key: string]: SxProps<Theme> } = {
  linkStyles: {
    fontSize: '0.875rem',
    fontWeight: '500',
    lineHeight: '1rem',
    color: theme.palette.dynamicColor.main,
    textDecoration: 'none',
    paddingRight: '0.5rem',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  leftSection: {
    background: theme.palette.baselineColor.neutral[0],
    display: 'flex',
    padding: '0.25rem',
    gap: '0.25rem',
    borderRadius: '6.25rem',
  },
  newLineButton: {
    background: theme.palette.baselineColor.neutral[100],
    width: '9.375rem',
    borderRadius: '6.25rem',
    padding: '0.25rem 0 0.25rem 0.75rem',
    justifyContent: 'flex-start',
    paddingLeft: '0.75rem',
    color: theme.palette.baselineColor.neutral[0],
    '&:hover': {
      border: 'none',
      background: theme.palette.dynamicColor.main,
      borderRadius: '6.25rem',
    },
  },
};

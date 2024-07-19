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
    width: '50%',
    borderRadius: '5rem',
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

export const getConditionalStyles = (theme: Theme) => ({
  lowSalary: {
    color: theme.palette.error.dark,
  },
  highSalary: {
    color: theme.palette.error.light,
  },
});

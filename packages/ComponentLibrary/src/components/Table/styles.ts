import { SxProps, Theme } from '@mui/material';
import { theme } from '../../theme';

export const tableStyles: Record<string, SxProps<Theme>> = {
  topToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  topToolbarCenter: {
    flex: 1,
    display: 'flex',
    justifyContent: 'flex-start',
    marginLeft: '1rem',
  },
  actionButton: {
    minWidth: 120,
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
  container: {
    display: 'flex',
    flex: 1,
    transition: 'all 0.3s ease',
    position: 'relative',
    padding: '1rem 0 1rem 0',
    flexDirection: 'column',
    gap: '1rem',
    overflow: 'hidden',
  },
  tablePaper: {
    borderRadius: '1rem',
    overflow: 'auto',
    transition: 'width 0.3s ease',
  },
  sidebarPaper: {
    position: 'absolute',
    top: 0,
    height: '50rem',
    backgroundColor: theme.palette.baselineColor.neutral[10],
    boxShadow: '-4px 0 10px rgba(0, 0, 0, 0.1)',
    padding: '0.5rem',
    transition: 'transform 0.3s ease',
    borderRadius: '1rem',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  tableBodyRow: {
    cursor: 'pointer',
  },
  tableBody: {
    '& tr': {
      backgroundColor: theme.palette.background.paper,
    },
  },
  tableHeadCell: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderRight: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderRight: 'none',
    },
    background: theme.palette.baselineColor.transparentNeutral[5],
    fontWeight: 'bold',
    color: theme.palette.text.primary,
  },
  tableBodyCell: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  expandColumn: {
    borderRight: 'none',
    background: theme.palette.baselineColor.transparentNeutral[5],
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
  sidebarContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'start',
    gap: 2,
    padding: '1rem',
  },
  iconContainer: {
    flexShrink: 0,
    height: '3rem',
    width: '3rem',
    background: theme.palette.baselineColor.neutral[0],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '1.5rem',
  },
  identifier: {
    color: theme.palette.baselineColor.transparentNeutral[70],
    fontWeight: 500,
  },
  title: {
    color: theme.palette.baselineColor.neutral[100],
    fontWeight: 600,
  },
  contentContainer: {
    flexGrow: 1,
    overflowY: 'auto',
  },
  container: {
    gridContainer: '1rem',
  },
  widgetBox: {
    border: `1px solid ${theme.palette.baselineColor.neutral[20]}`,
    borderRadius: '0.25rem',
    height: '18.75rem',
    minHeight: '18.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

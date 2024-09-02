import { SxProps, Theme } from '@mui/material';
import { theme } from '../../theme';

export const cancelLabel = 'Cancel';
export const confirmLabel = 'Confirm';
export const registerText = 'Register';

export const tableStyles: { [key: string]: SxProps<Theme> } = {
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
    display: 'flex',
    flexDirection: 'column',
  },
  recordContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem',
    gap: 2,
  },
  recordHeader: {
    height: '2.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    padding: '1rem',
    borderRadius: '1rem 1rem 0 0',
    background: theme.palette.baselineColor.transparentNeutral[5],
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
    fontSize: '1.25rem',
  },
  gridContainer: {
    padding: '0.75rem 1rem',
  },
  widgetContainer: {
    color: theme.palette.baselineColor.neutral[0],
    borderRadius: '1.5rem',
    padding: '1rem',
    maxHeight: '40rem',
    overflow: 'auto',
    marginBottom: '1rem',
    display: 'flex',
    gap: '0.75rem',
    flexDirection: 'column',
    boxShadow: `0px 4px 10px 0px ${theme.palette.baselineColor.transparentNeutral[10]}`,
  },
  widgetHeader: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  widgetBox: {
    borderRadius: '0.25rem',
    display: 'flex',
    maxWidth: '100%',
    maxHeight: '100%',
    alignItems: 'center',
    padding: '0.5rem',
  },
  widgetHeaderIcon: {
    width: '2rem',
    height: '2rem',
    padding: '0.25rem',
    borderRadius: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  widgetHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
  },
};

import { css } from '@mui/material';
import { theme } from '../../theme';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_CLOSED = 56;

export const styles = {
  drawer: {
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
  },
  drawerPaper: {
    backgroundColor: theme.palette.baselineColor.neutral[0],
    borderRight: 'none',
    borderTopRightRadius: '0.75rem',
    borderBottomRightRadius: '0.75rem',
    border: '0, 1px, 0, 0',
  },
  drawerHeader: {
    height: '3.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
  },
  appBar: {
    height: '3.5rem',
    display: 'flex',
    alignItems: 'center',
    padding: '0.25rem 0.25rem',
    zIndex: () => theme.zIndex.drawer + 1,
    transition: () =>
      theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    boxShadow: 'none',
  },
  appBarShift: {
    transition: () =>
      theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
  },
  content: {
    flexGrow: 1,
  },
  listItemButton: {
    display: 'flex',
    gap: '0.5rem',
    width: '100%',
    alignItems: 'center',
    cursor: 'pointer',
    borderRadius: '0.5rem',
    fontSize: '1.5rem',
    justifyContent: 'space-between',
    padding: '0.5rem',
    color: theme.palette.baselineColor.neutral[90],
    transition: 'background-color 500ms, color 500ms',
    '&:hover': {
      backgroundColor: theme.palette.dynamicColor.contrastText,
      color: theme.palette.dynamicColor.main,
    },
  },
  listItemInnerContentText: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%',
    overflow: 'hidden',
    justifyContent: 'flex-start',
  },
  listItemContentText: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
  },
  listItemButtonSelected: {
    backgroundColor: theme.palette.dynamicColor.main,
    color: theme.palette.dynamicColor.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.baselineColor.neutral[90],
    },
  },
  listItemIconContent: {
    width: '1rem',
    display: 'flex',
    justifyContent: 'center',
  },
  listItemIconTypography: {
    fontSize: '1rem',
  },
  listItemText: css({
    fontWeight: 500,
    fontSize: '0.875rem',
    textOverflow: 'clip',
    overflow: 'hidden',
  }),
  listItemTextSelected: {
    fontWeight: 600,
  },
  summaryBadge: {
    borderRadius: '0.75rem',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    minWidth: '1.25rem',
    textAlign: 'center',
  },
  toggleButton: {},
  drawerWidth: DRAWER_WIDTH,
  drawerWidthClosed: DRAWER_WIDTH_CLOSED,
  drawerSectionBox: {
    width: '100%',
    borderRadius: '0.5rem',
    overflow: 'hidden',
  },
  drawerHeaderTitle: {
    fontWeight: 600,
    color: theme.palette.baselineColor.neutral[90],
    fontSize: '1rem',
  },
  drawerHeaderImgBox: {
    display: 'flex',
    gap: '0.25rem',
    alignItems: 'center',
    flex: 1,
  },
  drawerHeaderImg: {
    width: '2.25rem',
    height: '2.25rem',
  },
  drawerSectionBoxMainSelected: {
    backgroundColor: theme.palette.baselineColor.neutral[10],
    padding: '0.5rem',
  },
  iconButtonBoxStyles: {
    padding: '0.5rem',
    color: theme.palette.baselineColor.neutral[90],
    transition: 'background-color 500ms, color 500ms',
    '&:hover': {
      backgroundColor: theme.palette.dynamicColor.main,
      color: theme.palette.dynamicColor.contrastText,
    },
  },
  subsectionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
    margin: 0,
    padding: '0.5rem',
  },
  contentBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    width: '100%',
    marginTop: '0.5rem',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: '1rem',
    display: 'flex',
    justifyContent: 'center',
  },
  typographyIcon: {
    fontSize: '1rem',
  },
};

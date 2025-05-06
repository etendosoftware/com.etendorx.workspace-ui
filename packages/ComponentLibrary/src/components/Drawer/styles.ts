import { useMemo } from 'react';
import { Theme, useTheme, SxProps } from '@mui/material';

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_CLOSED = 56;

export const useStyle = () => {
  const theme = useTheme();

  const focusStyles = useMemo(
    () => ({
      outline: `1px solid ${theme.palette.dynamicColor.main}`,
      borderRadius: '0.5rem',
      transition: 'outline-offset 0.1s ease',
    }),
    [theme],
  );

  return useMemo(
    () => ({
      drawerWidth: DRAWER_WIDTH,
      drawerWidthClosed: DRAWER_WIDTH_CLOSED,

      sx: {
        drawer: {
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
        },
        drawerPaper: {
          backgroundColor: theme.palette.baselineColor.neutral[0],
          borderRight: 'none',
          borderTopRightRadius: '0.75rem',
          borderBottomRightRadius: '0.75rem',
          border: '0, 1px, 0, 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          paddingBottom: theme.spacing(1),
        },
        drawerContent: {
          flexGrow: 1,
          overflowY: 'scroll',
          overflowX: 'visible',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        drawerHeader: {
          height: '3.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: theme.spacing(1),
          borderBottom: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
        },
        content: {
          flexGrow: 1,
        },
        popper: {
          marginLeft: '0.75rem',
          borderRadius: '0.75rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        },
        popperContent: {
          padding: '0.5rem',
        },
        listItemIconTypography: {
          fontSize: '1rem',
        },
        drawerSectionBox: {
          margin: '0.5rem',
          borderRadius: '0.5rem',
          '&:focus': focusStyles,
        },
        closeSection: {
          display: 'flex',
          justifyContent: 'center',
          padding: '0.25rem',
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
          textDecoration: 'none',
          color: 'inherit',
        },
        drawerHeaderImg: {
          width: '2.25rem',
          height: '2.25rem',
        },
        contentBox: {
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
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
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme, focusStyles],
  );
};

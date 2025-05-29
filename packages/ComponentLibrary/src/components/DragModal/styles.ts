import { type SxProps, type Theme, useTheme } from '@mui/material';
import { type CSSProperties, useMemo } from 'react';

export const MODAL_WIDTH = 240;

export const useStyle = () => {
  const theme = useTheme();

  return useMemo(
    () => ({
      styles: {
        StartIconStyles: {
          marginLeft: '0.25rem',
          maxHeight: '1rem',
          maxWidth: '1rem',
        },
        EndIconStyles: {
          position: 'absolute',
          right: '0',
          paddingLeft: '0 0.5rem',
        },
        menuItemStyles: {
          height: '2.25rem',
          cursor: 'grab',
          padding: '0.5rem',
        },
        itemsContainer: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        },
        leftContainer: {
          alignItems: 'center',
          display: 'flex',
        },
        containerStyles: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1.25rem 0 1.25rem',
          maxHeight: '2.25rem',
        },
        personLabelStyles: {
          display: 'inline-block',
          maxWidth: '8rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        },
        listStyles: {
          padding: '0.25rem 0rem',
        },
        dragStyles: {
          maxWidth: '1rem',
          maxHeight: '1rem',
          marginRight: '0.5rem',
        },
        sectionContainer: {
          padding: '0.5rem',
        },
        sortableItemContainer: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        },
        sortableItemLeftContainer: {
          alignItems: 'center',
          display: 'flex',
          flex: 1,
          minWidth: 0,
        },
        sortableItemLabel: {
          display: 'inline-block',
          maxWidth: '8rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'all 0.3s ease',
          flex: 1,
          minWidth: 0,
        },
      } as { [key: string]: CSSProperties },
      sx: {
        customizeButton: {
          fontWeight: '500',
          fontSize: '1rem',
          width: '100%',
          height: '2.25rem',
          borderRadius: '0.5rem',
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          position: 'relative',
          '&:hover': {
            border: 'none',
            color: theme.palette.baselineColor.neutral[80],
          },
        },
        headerBox: {
          '&:hover': {
            background: theme.palette.dynamicColor.contrastText,
            borderRadius: '0.5rem',
          },
        },
        linkStyles: {
          cursor: 'pointer',
          padding: 0,
          fontSize: '0.875rem',
          fontWeight: '500',
          lineHeight: '1rem',
          color: theme.palette.dynamicColor.main,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
        menuItemStyles: {
          height: '2.25rem',
          cursor: 'grab',
          margin: '0.25rem 0.5rem',
          padding: '0.5rem',
          position: 'relative',
          touchAction: 'none',
          borderRadius: '0.5rem',
          border: 'none',
          '&:hover': {
            borderRadius: '0.5rem',
            background: theme.palette.dynamicColor.contrastText,
          },
          '&:active, &.Mui-focusVisible': {
            cursor: 'grabbing',
            borderRadius: '0',
            background: theme.palette.baselineColor.neutral[10],
            border: `1px solid ${theme.palette.dynamicColor.main}`,
            '& .toggle-chip': {
              display: 'none',
            },
            '& .person-label': {
              maxWidth: '100%',
              color: theme.palette.dynamicColor.main,
            },
          },
        },
        menuItemDragging: {
          opacity: 0.5,
          zIndex: 1000,
          borderRadius: '0',
          background: theme.palette.baselineColor.neutral[10],
          border: `1px solid ${theme.palette.dynamicColor.main}`,
        },
      } as { [key: string]: SxProps<Theme> },
    }),
    [theme],
  );
};

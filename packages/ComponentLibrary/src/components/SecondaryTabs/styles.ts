import { SxProps } from '@mui/material';
import { CSSProperties } from 'react';
import { theme } from '../../theme';

export const containerStyles: SxProps = {
    display: 'flex',
    flexDirection: 'column',
};

export const tabsContainerStyles: SxProps = {
    overflow: 'hidden',
    cursor: 'grab',
    height: '36px',
    borderBottom: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
    display: 'flex',
    alignItems: 'center',
    padding: '0 0.5rem',
    width: '100%',
    position: 'relative', // Añadimos esta línea
};

export const rightButtonContainerStyles: SxProps = {
    position: 'absolute',
    right: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    height: '100%',
};

export const tabStyles = (numberOfItems?: number, isLoading?: boolean): SxProps => ({
    minWidth: 'auto',
    padding: '0 0.625rem',
    paddingRight: isLoading ? '0rem' : numberOfItems ? '1.25rem' : '1.25rem',
    backgroundColor: 'transparent',
    position: 'relative',
    transition: 'color 0.3s ease',
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '2px',
        backgroundColor: theme.palette.baselineColor.neutral[90],
        transform: 'scaleX(0)',
        transition: 'transform 0.3s ease',
        top: '40px', // Añadimos esta línea para posicionar el borde a 36px desde arriba
    },
    '&.Mui-selected': {
        color: theme.palette.baselineColor.neutral[90],
        '&::after': {
            transform: 'scaleX(1)',
        },
    },
    '&:hover': {
        backgroundColor: 'transparent',
        color: theme.palette.baselineColor.neutral[90],
    },
});

export const commonStyles: SxProps = {
    width: '2rem',
    height: '2rem',
    backgroundColor: theme.palette.baselineColor.neutral[0],
    borderRadius: '12.5rem',
    marginTop: '0.375rem',
};

export const rightButtonStyles = (open: boolean) => ({
    color: open ? theme.palette.dynamicColor.contrastText : theme.palette.baselineColor.neutral[80],
    backgroundColor: open ? theme.palette.baselineColor.neutral[80] : theme.palette.baselineColor.neutral[0],
    borderRadius: '50%',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
    transition: 'background-color 0.5s ease, color 0.5s ease, border-radius 0.5s ease, box-shadow 0.5s ease',
    '&:hover': {
        color: theme.palette.dynamicColor.contrastText,
        backgroundColor: theme.palette.baselineColor.neutral[80],
        boxShadow: '0px 4px 10px 0px #00030D1A',
        borderRadius: '12.5rem',
    },
    padding: 0,
    height: '28px',
    width: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

export const iconContainerStyles: SxProps = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

export const iconStyles: SxProps = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: theme.palette.baselineColor.neutral[90],
};

export const menuPaperProps: SxProps = {
    marginTop: '4px',
    border: `1px solid ${theme.palette.baselineColor.transparentNeutral[10]}`,
    padding: '0.5rem',
    boxShadow: `0px 4px 10px 0px ${theme.palette.baselineColor.transparentNeutral[10]}`,
    borderRadius: '12px',
};

export const menuItemRootStyles: SxProps = {
    '.MuiList-root': { padding: 0 },
};

export const menuItemStyles: SxProps = {
    display: 'flex',
    alignItems: 'center',
    maxHeight: '36.25rem',
    width: '14.5rem',
    padding: '0.5rem',
    fontWeight: 500,
    fontSize: '0.875rem',
    borderRadius: '0.5rem',
    transition: 'background-color 500ms, color 500ms',
    '&:hover': {
        backgroundColor: theme.palette.dynamicColor.contrastText,
        color: theme.palette.dynamicColor.main,
    },
};

export const menuItemTypographyStyles: CSSProperties | undefined = {
    marginRight: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: theme.palette.baselineColor.neutral[90],
    transition: 'color 0.5s ease',
};

export const menuItemIconModalStyles: SxProps = {
    width: '1rem',
    height: '1rem',
    marginRight: '0.5rem',
    color: theme.palette.baselineColor.neutral[60],
};

export const menuItemIconStyles = {
    width: '1rem',
    height: '1rem',
    color: theme.palette.baselineColor.neutral[70],
};

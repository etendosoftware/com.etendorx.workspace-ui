import { CSSProperties } from 'react';
import { SxProps } from '@mui/material';
import { DYNAMIC_CONSTRAST, DYNAMIC_MAIN, NEUTRAL_10, NEUTRAL_90, PRIMARY_0, PRIMARY_500, PRIMARY_CONTRAST } from '../../colors';

export const containerStyles: SxProps = {
    display: 'flex',
    flexDirection: 'column',
};

export const tabsContainerStyles: SxProps = {
    overflow: 'hidden',
    cursor: 'grab',
};

export const tabStyles = (numberOfItems?: number): SxProps => ({
    minWidth: 'auto',
    borderBottom: `2px solid ${NEUTRAL_10}`,
    transition: 'border-bottom-color 0.3s ease-in-out',
    padding: '0.625rem',
    paddingRight: numberOfItems ? '1.25rem' : '0.625rem',
    '&.Mui-selected': {
        backgroundColor: 'transparent',
        borderBottom: '2px solid',
    },
    '&:hover': {
        borderBottom: '2px solid',
        backgroundColor: 'transparent',
    },
});

export const commonStyles: SxProps = {
    width: '2rem',
    height: '2rem',
    backgroundColor: PRIMARY_0,
    borderRadius: '12.5rem',
    marginTop: '0.375rem',
};

export const rightButtonStyles = (open: boolean) => ({
    ...commonStyles,
    color: open ? PRIMARY_CONTRAST : PRIMARY_500,
    backgroundColor: open ? PRIMARY_500 : PRIMARY_0,
    '&:hover': {
        color: PRIMARY_CONTRAST,
        backgroundColor: PRIMARY_500,
    },
    marginLeft: '0.5rem',
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
    color: NEUTRAL_90,
};

export const menuPaperProps: SxProps = {
    marginTop: '4px',
    border: `1px solid ${NEUTRAL_10}`,
    padding: '0.5rem',
    boxShadow: `0px 4px 10px 0px ${NEUTRAL_10}`,
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
    color: PRIMARY_500,
    fontSize: '0.875rem',
    borderRadius: '0.5rem',
    transition: 'background-color 500ms, color 500ms',
    '&:hover': {
        backgroundColor: DYNAMIC_CONSTRAST,
        color: DYNAMIC_MAIN,
    },
};

export const menuItemTypographyStyles: CSSProperties | undefined = {
    marginRight: '0.5rem',
    fontSize: '0.875rem',
};

export const menuItemIconStyles = {
    width: '1rem',
    height: '1rem',
    color: NEUTRAL_90,
};

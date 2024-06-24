import { SxProps } from '@mui/material';
import { NEUTRAL_5, NEUTRAL_100 } from '../../../../colors';
import { CSSProperties } from 'react';

export const tabLabelContainerStyles: SxProps = {
    display: 'flex',
    alignItems: 'center',
};

export const badgeStyles: SxProps = {
    marginLeft: '0.875rem',
    '& .MuiBadge-badge': {
        backgroundColor: NEUTRAL_5,
        color: NEUTRAL_100,
        fontSize: '0.875rem',
        fontWeight: 500,
        height: '1.5rem',
        borderRadius: '12.5rem',
        paddingX: '0.5rem',
    },
};

export const badgeTextStyles: CSSProperties | undefined = {
    marginLeft: '0.5rem',
    marginRight: '0.5rem',
    fontSize: '0.875rem',
}

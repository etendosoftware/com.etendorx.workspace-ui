import React from 'react';
import { Box, Badge, CircularProgress } from '@mui/material';
import { TabLabelProps } from './types';
import { badgeStyles, badgeTextStyles, tabLabelContainerStyles } from './styles';
import { NEUTRAL_100 } from '../../../../colors';

const TabLabel: React.FC<TabLabelProps & { isSelected?: boolean }> = ({ icon, text, count, isLoading }) => (
    <Box sx={tabLabelContainerStyles}>
        <Box sx={tabLabelContainerStyles}>{icon}</Box>
        <span style={{ ...badgeTextStyles }}>{text}</span>
        {isLoading ? (
            <CircularProgress size={16} sx={{ color: NEUTRAL_100 }} />
        ) : (
            !!count && (
                <Badge badgeContent={count} color="secondary" sx={badgeStyles} />
            )
        )}
    </Box>
);

export default TabLabel;

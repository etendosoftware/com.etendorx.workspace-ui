import React from 'react';
import { Box, Badge } from '@mui/material';
import { TabLabelProps } from './types';
import { badgeStyles, badgeTextStyles, tabLabelContainerStyles } from './styles';

const TabLabel: React.FC<TabLabelProps> = ({ icon, text, count }) => (
    <Box sx={tabLabelContainerStyles}>
        <Box sx={tabLabelContainerStyles}>{icon}</Box>
        <span style={badgeTextStyles}>{text}</span>
        {!!count && (
            <Badge badgeContent={count} color="secondary" sx={badgeStyles} />
        )}
    </Box>
);

export default TabLabel;

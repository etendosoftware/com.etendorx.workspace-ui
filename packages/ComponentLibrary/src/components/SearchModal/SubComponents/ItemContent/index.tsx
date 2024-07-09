import React from 'react';
import { Box, Typography } from '@mui/material';
import { ItemContentProps } from './types';
import { styles } from './styles';

export const ItemContent: React.FC<ItemContentProps> = ({ item }) => (
  <Box sx={styles.itemBox}>
    <Box sx={styles.itemIcon}>
      {item.icon}
    </Box>
    <Typography sx={styles.itemText}>
      {item.name}
    </Typography>
    {item.isNew && (
      <Box sx={styles.newLabel}>
        {item.newLabel}
      </Box>
    )}
  </Box>
);

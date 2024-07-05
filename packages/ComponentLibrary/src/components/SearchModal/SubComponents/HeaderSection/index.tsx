import React from 'react';
import { Box, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { styles } from './styles';
import { HeaderSectionProps } from './types';

export const HeaderSection: React.FC<HeaderSectionProps> = ({ title }) => (
  <Box sx={styles.headerSection}>
    <Box sx={styles.searchIconContainer}>
      <SearchIcon sx={styles.iconSearchStyles} />
    </Box>
    <Typography variant="h6" sx={styles.headerTitle}>
      {title}
    </Typography>
  </Box>
);

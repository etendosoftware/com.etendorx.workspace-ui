import { Box, Badge, CircularProgress, useTheme } from '@mui/material';
import type { TabLabelProps } from './types';
import { useStyle } from './styles';

const TabLabel: React.FC<TabLabelProps & { isSelected?: boolean }> = ({ icon, text, count, isLoading }) => {
  const theme = useTheme();
  const { styles } = useStyle();

  return (
    <Box sx={styles.tabLabelContainerStyles}>
      <Box sx={styles.tabLabelContainerStyles}>{icon}</Box>
      <span style={{ ...styles.badgeTextStyles }}>{text}</span>
      {isLoading ? (
        <CircularProgress size={16} sx={{ color: theme.palette.baselineColor.neutral[80] }} />
      ) : (
        !!count && <Badge badgeContent={count} color='secondary' sx={styles.badgeStyles} />
      )}
    </Box>
  );
};

export default TabLabel;

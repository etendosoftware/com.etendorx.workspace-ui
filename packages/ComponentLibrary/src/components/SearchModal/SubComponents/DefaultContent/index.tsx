import { Box, Typography } from '@mui/material';
import { DefaultContentProps } from './types';
import { useStyle } from './styles';

export const DefaultContent: React.FC<DefaultContentProps> = ({ sections }) => {
  const { styles } = useStyle();

  return (
    <Box sx={styles.container}>
      {sections.map((section, index) => (
        <Box key={index} sx={styles.sectionContainer}>
          <Box sx={styles.sectionBox}>
            <Typography sx={styles.sectionTitle}>
              {section.title} ({section.items.length})
            </Typography>
            <Box sx={styles.itemsContainer}>
              {section.items.map((item, itemIndex) => (
                <Box key={itemIndex} sx={styles.itemBox}>
                  <Box sx={styles.itemIcon}>{item.icon}</Box>
                  <Typography sx={styles.itemText}>{item.name}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

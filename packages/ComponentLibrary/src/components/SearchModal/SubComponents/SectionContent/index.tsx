import { Box, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Section } from '../../../SecondaryTabs/types';
import { useStyle } from './styles';
import { ItemContent } from '../ItemContent';

export const SectionContent: React.FC<{ section: Section; isLast: boolean; variant: 'default' | 'tabs' }> = ({
  section,
  isLast,
}) => {
  const { styles } = useStyle();

  return (
    <Box sx={styles.sectionContent}>
      <Box sx={styles.sectionBox(isLast)}>
        <Box sx={styles.sectionInnerBox}>
          <Box sx={styles.contentWrapper}>
            <Box sx={styles.sectionTitleContainer}>
              <Typography sx={styles.sectionTitle}>
                {section.title} ({section.items.length})
              </Typography>
              <ArrowForwardIcon sx={styles.arrowIcon} />
            </Box>
            <Box sx={styles.itemsContainer}>
              {section.items.map((item, index) => (
                <ItemContent key={index} item={item} />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

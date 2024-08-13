import { Box, Typography } from '@mui/material';
import { TabContentProps } from '../../../../../storybook/src/stories/Components/Table/types';
import { recordContentStyles as styles } from '../styles';
import ChevronUp from '../../../assets/icons/chevron-up.svg';
import ChevronDown from '../../../assets/icons/chevron-down.svg';
import ChevronUpRight from '../../../assets/icons/chevron-right.svg';
import IconButton from '../../IconButton';
import { theme } from '../../../theme';

export const TabContent: React.FC<TabContentProps> = ({
  identifier,
  type,
  handleFullSize,
  isFullSize,
}) => (
  <Box sx={styles.recordContainer}>
    <Box sx={styles.recordHeader}>
      <Box sx={styles.recordContainerItems}>
        <Box sx={styles.typeBox}>
          <Typography>{type}</Typography>
        </Box>
        <Box sx={styles.identifierBox}>
          <Typography sx={styles.title}>{identifier}</Typography>
        </Box>
      </Box>
      <Box sx={styles.recordContainerItems}>
        <IconButton
          onClick={handleFullSize}
          size="small"
          hoverFill={theme.palette.baselineColor.neutral[80]}
          sx={styles.iconButton}>
          {isFullSize ? <ChevronDown /> : <ChevronUp />}
        </IconButton>
        <IconButton
          size="small"
          hoverFill={theme.palette.baselineColor.neutral[80]}
          sx={styles.iconButton}>
          <ChevronUpRight />
        </IconButton>
      </Box>
    </Box>
    <Box sx={styles.contentContainer}></Box>
  </Box>
);

export default TabContent;

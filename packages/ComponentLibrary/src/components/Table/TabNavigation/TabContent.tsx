import { Box, Typography, useTheme } from '@mui/material';
import { TabContentProps } from './types';
import { useStyle } from './styles';
import ChevronUp from '../../../assets/icons/chevron-up.svg';
import ChevronDown from '../../../assets/icons/chevron-down.svg';
import ChevronUpRight from '../../../assets/icons/chevron-right.svg';
import IconButton from '../../IconButton';

export const TabContent: React.FC<TabContentProps> = ({ identifier, type, handleFullSize, isFullSize }) => {
  const theme = useTheme();
  const { sx } = useStyle();

  return (
    <Box sx={sx.recordContainer}>
      <Box sx={sx.recordHeader}>
        <Box sx={sx.recordContainerItems}>
          <Box sx={sx.typeBox}>
            <Typography>{type}</Typography>
          </Box>
          <Box sx={sx.identifierBox}>
            <Typography sx={sx.title}>{identifier}</Typography>
          </Box>
        </Box>
        <Box sx={sx.recordContainerItems}>
          <IconButton
            onClick={handleFullSize}
            size="small"
            hoverFill={theme.palette.baselineColor.neutral[80]}
            sx={sx.iconButton}>
            {isFullSize ? <ChevronDown /> : <ChevronUp />}
          </IconButton>
          <IconButton size="small" hoverFill={theme.palette.baselineColor.neutral[80]} sx={sx.iconButton}>
            <ChevronUpRight />
          </IconButton>
        </Box>
      </Box>
      <Box sx={sx.contentContainer}></Box>
    </Box>
  );
};

export default TabContent;

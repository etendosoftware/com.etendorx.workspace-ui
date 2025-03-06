import { Box, Typography, useTheme } from '@mui/material';
import { TabContentProps } from './types';
import { useStyle } from './styles';
import ChevronUp from '../../../../ComponentLibrary/src/assets/icons/chevron-up.svg';
import ChevronDown from '../../../../ComponentLibrary/src/assets/icons/chevron-down.svg';
import ChevronUpRight from '../../../../ComponentLibrary/src/assets/icons/chevron-right.svg';
import IconButton from '@workspaceui/componentlibrary/src/components/IconButton';
import { useMetadataContext } from '@/hooks/useMetadataContext';
import { useMemo } from 'react';
import TabsGroup from '@/screens/Table/TabsGroup';

export const TabContent: React.FC<TabContentProps> = ({ identifier, type, handleFullSize, isFullSize, tab }) => {
  const theme = useTheme();
  const { sx } = useStyle();
  const { groupedTabs } = useMetadataContext();

  const childTabs = useMemo(() => {
    if (!tab) return [];
    return groupedTabs.find(tabs => tabs[0].level === tab.level + 1) || [];
  }, [groupedTabs, tab]);

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

      <Box sx={sx.contentContainer}>
        {childTabs.length > 0 ? (
          TabsGroup(childTabs)
        ) : (
          <Box sx={{ padding: '16px', textAlign: 'center' }}>No child tabs available for this record</Box>
        )}
      </Box>
    </Box>
  );
};

export default TabContent;

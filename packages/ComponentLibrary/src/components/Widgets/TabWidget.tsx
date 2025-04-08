import { Box, Typography } from '@mui/material';
import { useStyle } from './styles';
import { TabWidgetProps } from './types';

const TabWidget: React.FC<TabWidgetProps> = ({ title, content, noRecordText }) => {
  const { sx } = useStyle();

  if (!content) {
    return <Typography variant="h5">{noRecordText}</Typography>;
  }

  return (
    <Box sx={sx.mainContainer}>
      <Box flexGrow={1} overflow="auto" p={2}>
        <Typography variant="h5" fontWeight="medium" mb={2}>
          {title}
        </Typography>
        <Box>{content}</Box>
      </Box>
    </Box>
  );
};

export default TabWidget;

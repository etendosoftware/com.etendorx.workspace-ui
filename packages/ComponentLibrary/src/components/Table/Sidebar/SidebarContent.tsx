import { Box, Typography } from '@mui/material';
import { SidebarContentProps } from '../../../../../storybook/src/stories/Components/Table/types';
import ContentGrid from './WidgetContent';
import { sx } from '../styles';

export const SidebarContent: React.FC<SidebarContentProps> = ({
  icon,
  identifier,
  title,
  widgets,
}) => (
  <Box sx={sx.sidebarContainer}>
    <Box sx={sx.headerContainer}>
      <Box sx={sx.iconContainer}>{icon}</Box>
      <Box>
        <Typography variant="body2" sx={sx.identifier}>
          {identifier}
        </Typography>
        <Typography variant="h5" sx={sx.title}>
          {title}
        </Typography>
      </Box>
    </Box>
    <ContentGrid widgets={widgets} />
  </Box>
);

export default SidebarContent;

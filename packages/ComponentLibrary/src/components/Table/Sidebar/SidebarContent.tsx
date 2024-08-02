import { FC } from 'react';
import { Box, Typography } from '@mui/material';
import { SidebarContentProps } from '../../../../../storybook/src/stories/Components/Table/types';
import ContentGrid from './WidgetContent';
import { sx } from '../styles';

export const SidebarContent: FC<SidebarContentProps> = ({
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
    <Box sx={sx.contentContainer}>
      <ContentGrid widgets={widgets} />
    </Box>
  </Box>
);

export default SidebarContent;

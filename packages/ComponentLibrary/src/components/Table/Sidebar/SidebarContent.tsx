import React from 'react';
import { Box, Typography } from '@mui/material';
import { theme } from '../../../theme';
import { SidebarContentProps } from '../../../../../storybook/src/stories/Components/Table/types';
import ContentGrid from './WidgetContent';

export const SidebarContent: React.FC<SidebarContentProps> = ({
  icon,
  identifier,
  title,
  widgets,
}) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'start',
        gap: 2,
        padding: '1rem',
      }}>
      <Box
        sx={{
          flexShrink: 0,
          height: '3rem',
          width: '3rem',
          background: theme.palette.baselineColor.neutral[0],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
        }}>
        {icon}
      </Box>
      <Box>
        <Typography
          variant="body2"
          color={theme.palette.baselineColor.transparentNeutral[70]}
          fontWeight={500}>
          {identifier}
        </Typography>
        <Typography
          variant="h5"
          color={theme.palette.baselineColor.neutral[100]}
          fontWeight={600}>
          {title}
        </Typography>
      </Box>
    </Box>
    <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
      <ContentGrid widgets={widgets} />
    </Box>
  </Box>
);

export default SidebarContent;

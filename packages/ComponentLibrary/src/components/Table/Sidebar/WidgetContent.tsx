import React from 'react';
import { Box, Grid } from '@mui/material';
import { ContentGridProps } from '../../../../../storybook/src/stories/Components/Table/types';
import { sx } from '../styles';

const ContentGrid: React.FC<ContentGridProps> = ({ widgets }) => {
  return (
    <Box sx={sx.gridContainer}>
      <Grid container spacing={2}>
        {widgets.map(widget => (
          <Grid item key={widget.id} xs={widget.size === 'full' ? 12 : 6}>
            <Box sx={sx.widgetBox}>{widget.content}</Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ContentGrid;

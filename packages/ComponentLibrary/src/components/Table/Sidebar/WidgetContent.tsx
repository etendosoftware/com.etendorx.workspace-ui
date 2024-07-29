import React from 'react';
import { Box, Grid } from '@mui/material';
import { ContentGridProps } from '../types';
import { theme } from '../../../theme';

const ContentGrid: React.FC<ContentGridProps> = ({ widgets }) => {
  return (
    <Box sx={{ padding: '1rem' }}>
      <Grid container spacing={2}>
        {widgets.map(widget => (
          <Grid item key={widget.id} xs={widget.size === 'full' ? 12 : 6}>
            <Box
              sx={{
                border: `1px solid ${theme.palette.baselineColor.neutral[20]}`,
                borderRadius: '0.25rem',
                height: '18.75rem',
                minHeight: '18.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {widget.content}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ContentGrid;

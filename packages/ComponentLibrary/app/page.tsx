'use client';
import { Box, Typography } from '@mui/material';

export default function ComponentLibraryPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom color={'#000'}>
        Component Library
      </Typography>
      <Typography variant="body1" color={'#000'}>
        Welcome to the Component Library. Here you can test and preview components.
      </Typography>
    </Box>
  );
}

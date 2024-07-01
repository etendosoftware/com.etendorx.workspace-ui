import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { theme } from '../../ComponentLibrary/src/theme';
import { ThemeProvider as Emotion10ThemeProvider } from '@emotion/react'

const withThemeProvider = (Story) => (
  <ThemeProvider theme={theme}>
    <Emotion10ThemeProvider theme={theme}>
      <CssBaseline />
      <Story />
    </Emotion10ThemeProvider>
  </ThemeProvider>
);

const preview = {
  decorators: [withThemeProvider]
};

export default preview;

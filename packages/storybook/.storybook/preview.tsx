import React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '../../ComponentLibrary/src/theme';

const withThemeProvider = Story => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Story />
  </ThemeProvider>
);

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [withThemeProvider],
};

export default preview;

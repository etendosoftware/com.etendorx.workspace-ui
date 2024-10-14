import React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '../../ComponentLibrary/src/theme';
import { LanguageProvider } from '../../MainUI/src/contexts/languageProvider';
import { BrowserRouter } from 'react-router-dom';

const withThemeProvider = Story => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageProvider>
        <Story />
      </LanguageProvider>
    </ThemeProvider>
  </BrowserRouter>
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

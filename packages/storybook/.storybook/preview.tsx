import React from 'react';
import { createTheme, ThemeProvider } from '@mui/material';
import { themeOptions } from '@workspaceui/componentlibrary/src/theme';
import { LanguageProvider } from '../../MainUI/contexts/languageProvider';

const withThemeProvider = Story => (
  <ThemeProvider theme={createTheme(themeOptions)}>
    <LanguageProvider>
      <Story />
    </LanguageProvider>
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

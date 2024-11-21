import React, { Suspense } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@workspaceui/componentlibrary/src/theme';

const LanguageProvider = React.lazy(() =>
  import('../../MainUI/contexts/languageProvider').then(mod => ({
    default: mod.LanguageProvider,
  })),
);

const withThemeProvider = Story => (
  <Suspense fallback={<div>Loading...</div>}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LanguageProvider>
        <Story />
      </LanguageProvider>
    </ThemeProvider>
  </Suspense>
);

export default {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [withThemeProvider],
};

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';

// Polyfill para useInsertionEffect si no existe (compatibilidad con React < 18)
if (typeof React.useInsertionEffect === 'undefined') {
  // @ts-ignore
  React.useInsertionEffect = React.useLayoutEffect;
}

const withThemeProvider = (Story) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <Story />
  </ThemeProvider>
);

const withNextRouter = (Story) => {
  const mockRouter = {
    push: () => Promise.resolve(true),
    replace: () => Promise.resolve(true),
    prefetch: () => Promise.resolve(),
    back: () => {},
    beforePopState: () => {},
    reload: () => {},
    events: {
      on: () => {},
      off: () => {},
      emit: () => {},
    },
    isFallback: false,
    isReady: true,
    isPreview: false,
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
    basePath: '',
    locale: undefined,
    locales: undefined,
    defaultLocale: undefined,
    domainLocales: undefined,
  };

  return (
    <RouterContext.Provider value={mockRouter}>
      <Story />
    </RouterContext.Provider>
  );
};

export default {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [withThemeProvider, withNextRouter],
};

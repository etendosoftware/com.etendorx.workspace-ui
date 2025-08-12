/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at  
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

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

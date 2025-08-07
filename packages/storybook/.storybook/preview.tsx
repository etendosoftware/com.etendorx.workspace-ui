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

import React, { Suspense } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from '@workspaceui/componentlibrary/src/theme';

const LanguageProvider = React.lazy(() =>
  import('../../MainUI/contexts/languageProvider').then((mod) => ({
    default: mod.LanguageProvider,
  })),
);

const withThemeProvider = (Story) => (
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

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SanityChecker from '../components/SanityChecker';
import { LanguageProvider } from '../contexts/languageProvider';
import MetadataProvider from '../contexts/metadata';
import { RecordProvider } from '../contexts/record';
import UserProvider from '../contexts/user';
import { useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material';
import { themeOptions } from '@workspaceui/componentlibrary/theme';
import { ThemeOptions } from '@mui/material/styles';

const queryClient = new QueryClient();

export default function App({ children }: React.PropsWithChildren) {
  const [theme] = useState(() => createTheme(themeOptions as ThemeOptions));

  return (
    <ThemeProvider theme={theme}>
      <SanityChecker>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <UserProvider>
              <MetadataProvider>
                <RecordProvider>{children}</RecordProvider>
              </MetadataProvider>
            </UserProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </SanityChecker>
    </ThemeProvider>
  );
}

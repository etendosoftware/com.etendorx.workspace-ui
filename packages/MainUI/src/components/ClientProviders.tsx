'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from 'src/contexts/languageProvider';
import UserProvider from 'src/contexts/user';
import MetadataProvider from 'src/contexts/metadata';
import { RecordProvider } from 'src/contexts/record';
import { theme, CssBaseline, ThemeProvider } from '@workspaceui/componentlibrary/theme';

const queryClient = new QueryClient();

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme>
          <LanguageProvider>
            <UserProvider>
              <MetadataProvider>
                <RecordProvider>{children}</RecordProvider>
              </MetadataProvider>
            </UserProvider>
          </LanguageProvider>
        </CssBaseline>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

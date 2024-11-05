'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SanityChecker from '../components/SanityChecker';
import { LanguageProvider } from '../contexts/languageProvider';
import MetadataProvider from '../contexts/metadata';
import { RecordProvider } from '../contexts/record';
import UserProvider from '../contexts/user';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';

const queryClient = new QueryClient();

export default function App({ children }: React.PropsWithChildren) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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

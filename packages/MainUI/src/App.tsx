'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CssBaseline } from '@workspaceui/componentlibrary/theme';
import MetadataProvider from '@/contexts/metadata';
import UserProvider from '@/contexts/user';
import { LanguageProvider } from '@/contexts/languageProvider';
import { RecordProvider } from '@/contexts/record';
import SanityChecker from '@/components/SanityChecker';

const queryClient = new QueryClient();

export default function App({ children }: React.PropsWithChildren) {
  return (
    <SanityChecker>
      <QueryClientProvider client={queryClient}>
        <CssBaseline>
          <LanguageProvider>
            <UserProvider>
              <MetadataProvider>
                <RecordProvider>{children}</RecordProvider>
              </MetadataProvider>
            </UserProvider>
          </LanguageProvider>
        </CssBaseline>
      </QueryClientProvider>
    </SanityChecker>
  );
}

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SanityChecker from '../components/SanityChecker';
import { LanguageProvider } from '../contexts/languageProvider';
import MetadataProvider from '../contexts/metadata';
import { RecordProvider } from '../contexts/record';
import UserProvider from '../contexts/user';

const queryClient = new QueryClient();

export default function App({ children }: React.PropsWithChildren) {
  return (
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
  );
}

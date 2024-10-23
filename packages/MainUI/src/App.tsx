import { CssBaseline } from '../../ComponentLibrary/src/theme';
import MetadataProvider from './contexts/metadata';
import UserProvider from './contexts/user';
import { LanguageProvider } from './contexts/languageProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SanityChecker from '@/components/SanityChecker';
import { RecordProvider } from './contexts/record';

const queryClient = new QueryClient();

export default function App({ children }: React.PropsWithChildren) {
  return (
    <SanityChecker>
      <QueryClientProvider client={queryClient}>
        <CssBaseline enableColorScheme>
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

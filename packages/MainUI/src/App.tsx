import { theme, CssBaseline, ThemeProvider } from '../../ComponentLibrary/src/theme';
import { Outlet } from 'react-router-dom';
import MetadataProvider from './contexts/metadata';
import UserProvider from './contexts/user';
import { LanguageProvider } from './contexts/languageProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SanityChecker from './components/SanityChecker';
import { RecordProvider } from './contexts/record';

const queryClient = new QueryClient();

export default function App() {
  return (
    <SanityChecker>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline enableColorScheme>
            <LanguageProvider>
              <UserProvider>
                <MetadataProvider>
                  <RecordProvider>
                    <Outlet />
                  </RecordProvider>
                </MetadataProvider>
              </UserProvider>
            </LanguageProvider>
          </CssBaseline>
        </ThemeProvider>
      </QueryClientProvider>
    </SanityChecker>
  );
}

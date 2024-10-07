import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '../../ComponentLibrary/src/theme';
import { Outlet } from 'react-router-dom';
import MetadataProvider from './contexts/metadata';
import { RecordProvider } from './contexts/record';
import UserProvider from './contexts/user';
import { LanguageProvider } from './contexts/languageProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LanguageProvider>
          <UserProvider>
            <MetadataProvider>
              <RecordProvider>
                <Outlet />
              </RecordProvider>
            </MetadataProvider>
          </UserProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

import { Outlet } from 'react-router-dom';
import { theme, CssBaseline, ThemeProvider } from '../../ComponentLibrary/src/theme';
import { MetadataProvider } from './contexts/metadata';
import { UserProvider } from './contexts/user';
import { LanguageProvider } from './contexts/languageProvider';
import SanityChecker from './components/SanityChecker';
import { RecordProvider } from './contexts/record';
import { QueryProvider } from './contexts/query';

export default function App() {
  return (
    <SanityChecker>
      <QueryProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline>
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
      </QueryProvider>
    </SanityChecker>
  );
}

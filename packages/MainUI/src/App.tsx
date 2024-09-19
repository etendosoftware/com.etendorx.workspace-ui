import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { Outlet } from 'react-router-dom';
import MetadataProvider from './contexts/metadata';
import { RecordProvider } from './contexts/record';
import UserProvider from './contexts/user';
import { LanguageProvider } from './contexts/languageProvider';

export default function App() {
  return (
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
  );
}

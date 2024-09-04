import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { Outlet } from 'react-router-dom';
import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import { RecordProvider } from './contexts/recordProvider';
import UserProvider from './contexts/user';
import { LanguageProvider } from './contexts/languageContext';

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

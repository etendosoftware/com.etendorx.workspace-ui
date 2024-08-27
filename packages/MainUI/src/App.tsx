import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { Outlet } from 'react-router-dom';
import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import { RecordProvider } from './contexts/recordProvider';
import UserProvider from './contexts/user';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserProvider>
        <MetadataProvider>
          <RecordProvider>
            <Outlet />
          </RecordProvider>
        </MetadataProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

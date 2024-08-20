import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { Outlet } from 'react-router-dom';
import MetadataProvider from './contexts/metadata';
import UserProvider from './contexts/user';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserProvider>
        <MetadataProvider>
          <Outlet />
        </MetadataProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

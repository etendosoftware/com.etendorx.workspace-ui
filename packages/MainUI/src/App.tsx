import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { Outlet } from 'react-router-dom';
import MetadataProvider from './contexts/metadata';
import { RecordProvider } from './contexts/recordProvider';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MetadataProvider>
        <RecordProvider>
          <Outlet />
        </RecordProvider>
      </MetadataProvider>
    </ThemeProvider>
  );
}

import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { Outlet } from 'react-router-dom';
import MetadataProvider from './contexts/metadata';
import RecordContextExports from './contexts/record';

const { RecordProvider } = RecordContextExports;

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

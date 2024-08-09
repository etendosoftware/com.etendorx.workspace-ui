import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import Layout from './components/layout';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';
import { Outlet } from 'react-router-dom';

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MetadataProvider>
        <Layout>
          <Outlet />
        </Layout>
      </MetadataProvider>
    </ThemeProvider>
  );
}

import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import DynamicTable from './screens/DynamicTable';
import { useEffect, useState } from 'react';
import Layout from './components/layout';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '@workspaceui/componentlibrary/src/theme';

function getWindowId() {
  return new URLSearchParams(location.search).get('windowId');
}

export default function App() {
  const [windowId] = useState(getWindowId());

  useEffect(() => {
    if (!windowId) {
      location.search = 'windowId=143';
    }
  }, [windowId]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MetadataProvider>
        <Layout>
          <DynamicTable windowId={windowId ?? '143'} />
        </Layout>
      </MetadataProvider>
    </ThemeProvider>
  );
}

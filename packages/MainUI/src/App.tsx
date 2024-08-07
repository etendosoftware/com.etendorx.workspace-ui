import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import DynamicTable from './screens/DynamicTable';
import { useEffect, useState } from 'react';
import Layout from './components/layout';

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
    <MetadataProvider>
      <Layout>
        <DynamicTable windowId={windowId ?? '143'} />
      </Layout>
    </MetadataProvider>
  );
}

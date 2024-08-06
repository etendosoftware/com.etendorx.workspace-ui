import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import Home from './screens/Home';
import DynamicTable from './screens/DynamicTable';
import { useEffect, useState } from 'react';

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
      <Home>
        <DynamicTable windowId={windowId ?? '143'} />
      </Home>
    </MetadataProvider>
  );
}

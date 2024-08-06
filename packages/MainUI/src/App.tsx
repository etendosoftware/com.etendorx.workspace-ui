import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import Home from './screens/Home';
import DynamicTable from './screens/DynamicTable';
import { useState } from 'react';

export default function App() {
  const [windowId] = useState(
    new URLSearchParams(location.search).get('windowId') ?? '143',
  );
  return (
    <MetadataProvider>
      <Home>
        <DynamicTable windowId={windowId} />
      </Home>
    </MetadataProvider>
  );
}

import { useEffect } from 'react';
import type { Etendo } from '@workspaceui/etendohookbinder/src/etendo';
import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';
import Home from './screens/Home';

function App() {
  const { getWindow, getColumns } = useMetadataContext();

  useEffect(() => {
    getWindow('143').then((w: Etendo.WindowMetadata) => {
      console.debug('Window Metadata for Window ID 143');
      console.debug(w);

      const tabId = w.properties.viewProperties.tabId;

      getColumns(tabId).then(cols => {
        console.debug('Window Columns for Tab ID' + tabId);
        console.debug(cols);
      });
    });
  }, [getColumns, getWindow]);

  return (
    <MetadataProvider>
      <Home />
    </MetadataProvider>
  );
}

export default function Main() {
  return (
    <MetadataProvider>
      <App />
    </MetadataProvider>
  );
}

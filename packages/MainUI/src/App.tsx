import { useEffect } from 'react';
import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import { useMetadataContext } from '@workspaceui/etendohookbinder/src/hooks/useMetadataContext';
import Home from './screens/Home';

function App() {
  const { getWindow, getColumns } = useMetadataContext();

  useEffect(() => {
    getWindow('100').then(w => {
      console.debug('Window Metadata for Window ID 100');
      console.debug(w);
    });
    getColumns('100').then(cols => {
      console.debug('Window Columns for Window ID 100');
      console.debug(cols);
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

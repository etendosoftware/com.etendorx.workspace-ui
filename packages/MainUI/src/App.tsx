import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import Home from './screens/Home';
import DynamicTable from './screens/DynamicTable';

export default function App() {
  return (
    <MetadataProvider>
      <Home>
        <DynamicTable windowId="143" />
      </Home>
    </MetadataProvider>
  );
}

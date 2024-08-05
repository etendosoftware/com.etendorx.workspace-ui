import MetadataProvider from '@workspaceui/etendohookbinder/src/contexts/metadata';
import Home from './screens/Home';
import SalesOrder from './screens/SalesOrder';

export default function App() {
  return (
    <MetadataProvider>
      <Home>
        <SalesOrder />
      </Home>
    </MetadataProvider>
  );
}

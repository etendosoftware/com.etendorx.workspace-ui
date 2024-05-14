import { useEffect } from 'react';
import Home from './screens/Home';
import { columsPageMetadata } from '@workspaceui/etendohookbinder/src/services/sales-order.service.ts';
import { pageMetadata } from '@workspaceui/etendohookbinder/src/api/sales-order.api';

function App() {
  //Example for DEMO: The importance to use the DTOs insted of the raw data
  useEffect(() => {
    pageMetadata().then(res => {
      console.log('pageMetadata:', res);
    });
    columsPageMetadata().then(res => {
      console.log('columsPageMetadata:', res);
    });
  }, []);

  return <Home />;
}

export default App;

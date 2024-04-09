import { useEffect } from 'react';
import Home from './screens/Home';
import {pageMetadata} from '@workspaceui/etendohookbinder/src/services/sales-order.service.ts';

function App() {
  useEffect(() => {
    pageMetadata()
    console.log('Endpoint consumed!')
  }, [])
  
  return <Home />;
}

export default App;

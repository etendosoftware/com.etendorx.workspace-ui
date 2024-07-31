import { useMemo, useState } from 'react';
import MetadataTest from './screens/Metadata';
import DatasourceTest from './screens/Datasource';
import './App.css';
import { setup } from './api/isc';

setup();

function App() {
  const [tab, setTab] = useState<'metadata' | 'datasource'>('datasource');

  const handle = useMemo(() => {
    return {
      metadataClick: () => setTab('metadata'),
      datasourceClick: () => setTab('datasource'),
    };
  }, []);

  return (
    <main>
      <h4>Etendo Hook Binder</h4>
      <div className="button-group">
        <button onClick={handle.metadataClick}>
          METADATA TEST
        </button>
        <button onClick={handle.datasourceClick}>
          DATASOURCE TEST
        </button>
      </div>
      {tab === 'metadata' ? <MetadataTest /> : <DatasourceTest />}
    </main>
  );
}

export default App;

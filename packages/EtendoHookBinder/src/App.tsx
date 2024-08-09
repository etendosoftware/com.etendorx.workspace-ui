import { useMemo, useState } from 'react';
import MetadataTest from './screens/Metadata';
import DatasourceTest from './screens/Datasource';
import './App.css';

function App() {
  const [tab, setTab] = useState<'metadata' | 'datasource'>('metadata');

  const handle = useMemo(() => {
    return {
      metadataClick: () => setTab('metadata'),
      datasourceClick: () => setTab('datasource'),
    };
  }, []);

  return (
    <main>
      <div className="p-2 text-3xl font-bold">Etendo Hook Binder</div>
      <div className="flex flex-1 p-2 gap-2 justify-center">
        <button onClick={handle.metadataClick} className="bg-purple-700 border-0">
          METADATA TEST
        </button>
        <button onClick={handle.datasourceClick} className="bg-yellow-500 text-black border-0">
          DATASOURCE TEST
        </button>
      </div>
      {tab === 'metadata' ? <MetadataTest /> : <DatasourceTest />}
    </main>
  );
}

export default App;
 
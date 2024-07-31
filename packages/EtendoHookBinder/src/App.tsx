import { useMemo, useState } from 'react';
import MetadataTest from './screens/Metadata';
import DatasourceTest from './screens/Datasource';
import styles from './App.module.css';
import './App.css';


function App() {
  const [tab, setTab] = useState<'metadata' | 'datasource'>('datasource');

  const handle = useMemo(() => {
    return {
      metadataClick: () => setTab('metadata'),
      datasourceClick: () => setTab('datasource'),
    };
  }, []);

  return (
    <main className={styles.container}>
      <h4>Etendo Hook Binder</h4>
      <div className={styles.group}>
        <button className={styles.button} onClick={handle.metadataClick}>
          METADATA TEST
        </button>
        <button className={styles.button} onClick={handle.datasourceClick}>
          DATASOURCE TEST
        </button>
      </div>
      {tab === 'metadata' ? <MetadataTest /> : <DatasourceTest />}
    </main>
  );
}

export default App;

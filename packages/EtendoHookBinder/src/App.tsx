import { useMemo, useState } from 'react';
import styles from './App.module.css';
import './App.css';
import Datasource from './screens/Datasource';

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
      <h1>Etendo Hook Binder</h1>
      <div className={styles.group}>
        <button className={styles.button} onClick={handle.metadataClick}>
          METADATA TEST
        </button>
        <button className={styles.button} onClick={handle.datasourceClick}>
          DATASOURCE TEST
        </button>
      </div>
      {tab === 'metadata' ? null : <Datasource />}
    </main>
  );
}

export default App;

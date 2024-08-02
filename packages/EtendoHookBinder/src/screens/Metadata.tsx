import { useCallback, useState } from 'react';
import styles from './styles.module.css';
import { useWindow } from '../hooks/useWindow';

export default function MetadataTest() {
  const [windowId, setWindowId] = useState('100');
  const { loading, data, error, load } = useWindow(windowId);

  const handleWindowIdChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      setWindowId(e.currentTarget.value);
    },
    [],
  );

  return (
    <div className={styles.container}>
      <div className={styles.field}>
        <label htmlFor="windowId">Window ID</label>
        <input
          className={styles.input}
          type="text"
          value={windowId}
          onChange={handleWindowIdChange}
        />
      </div>
      {error ? <div className={styles.error}>{error.message}</div> : null}
      <button onClick={load} className="" disabled={loading}>
        {loading ? 'Loading...' : 'Load Window'}
      </button>
      <textarea
        className={styles.code}
        value={data ? JSON.stringify(data, null, 2) : ''}
        rows={16}
        readOnly
      />
    </div>
  );
}

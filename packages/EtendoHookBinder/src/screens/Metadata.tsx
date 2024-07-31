import { useCallback, useMemo, useState } from 'react';
import styles from './styles.module.css';
import { useMetadata } from '../hooks/useMetadata';

export default function MetadataTest() {
  const [windowId, setWindowId] = useState('100');
  const { load, loading, data, error } = useMetadata(windowId);

  const handleWindowIdChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      setWindowId(e.currentTarget.value);
    },
    [],
  );

  const value = useMemo(() => {
    if (typeof data === 'undefined') {
      return '';
    }

    const replacer = (key: string, value: unknown) => {
      if (key === 'lucho') return undefined;

      return value;
    };

    return JSON.stringify(data, replacer, 2);
  }, [data]);

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
      <button onClick={load} className={styles.button} disabled={loading}>
        {loading ? 'Loading...' : 'Load Window'}
      </button>
      <textarea className={styles.code} value={value} rows={16} readOnly />
    </div>
  );
}

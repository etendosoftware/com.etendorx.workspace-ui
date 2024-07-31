import { useCallback, useState } from 'react';
import { Metadata } from '../api/metadata';
import styles from './styles.module.css';

export default function MetadataTest() {
  const [windowId, setWindowId] = useState('100');
  const [data, setData] = useState<Etendo.Metadata>('');
  const [error, setError] = useState();

  const handleWindowIdChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      setWindowId(e.currentTarget.value);
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const f = async () => {
        try {
          await Metadata.get(windowId);

          setError(undefined);
          setData(JSON.stringify(window.isc.classes[`_${windowId}`], null, 2));
        } catch (e) {
          setError(e as never);

          throw e;
        }
      };

      return f().catch(console.warn);
    },
    [windowId],
  );

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <div className={styles.field}>
        <label htmlFor="windowId">Window ID</label>
        <input
          className={styles.input}
          type="text"
          value={windowId}
          onChange={handleWindowIdChange}
        />
      </div>
      <button type="submit" className={styles.button}>
        Load records
      </button>
      <textarea className={styles.code} value={error ?? data} rows={16} readOnly />
    </form>
  );
}

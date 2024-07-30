import { useCallback, useState } from 'react';
import { get } from './api/datasource/client';
import { entities } from './api/constants';
import styles from './App.module.css';
import './App.css';

function App() {
  const [entity, setEntity] = useState<Etendo.Entity>(entities[0]);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(1);
  const [data, setData] = useState<Record<string, never>>({});

  const handleEntityChange = useCallback(
    (e: React.SyntheticEvent<HTMLSelectElement>) => {
      setEntity(e.currentTarget.value as Etendo.Entity);
    },
    [],
  );

  const handleSizeChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const _size = parseInt(e.currentTarget.value);

      if (_size > 0) {
        setSize(_size);
      }
    },
    [],
  );

  const handlePageChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const _page = parseInt(e.currentTarget.value);

      if (_page > 0) {
        setPage(_page);
      }
    },
    [],
  );

  const handleClick = useCallback(() => {
    const f = async () => {
      const _startRow = ((page - 1) * size - 1).toString();
      const _endRow = (page * size).toString();
      const response = await get(entity, {
        _startRow,
        _endRow,
      }) as { data: never };
      setData(response.data);
    };

    return f().catch(console.warn);
  }, [entity, page, size]);

  return (
    <main className={styles.container}>
      <h1>Etendo Hook Binder</h1>
      <div className={styles.field}>
        <label htmlFor="entity">Entity</label>
        <select
          className={styles.select}
          value={entity}
          onChange={handleEntityChange}>
          {entities.map(e => (
            <option value={e} key={e}>
              {e}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="page">Page</label>
        <input
          className={styles.input}
          type="text"
          value={page}
          onChange={handlePageChange}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="size">Size</label>
        <input
          type="text"
          className={styles.input}
          value={size}
          onChange={handleSizeChange}
        />
      </div>
      <button className={styles.button} onClick={handleClick}>
        Load records
      </button>
      <pre className={styles.code}>
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </main>
  );
}

export default App;

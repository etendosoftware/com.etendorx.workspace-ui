import { useCallback, useState } from 'react';
import { get } from '../api/datasource/client';
import { entities } from '../api/constants';
import styles from './styles.module.css';

export default function Datasource() {
  const [entity, setEntity] = useState<Etendo.Entity>(entities[0]);
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(1);
  const [data, setData] = useState<Record<string, unknown | { data: [] }>>();
  const [error, setError] = useState<unknown>();

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
      try {
        const _startRow = ((page - 1) * size).toString();
        const _endRow = (page * size - 1).toString();
        const { data } = await get(entity, {
          _startRow,
          _endRow,
        });

        setData(data?.response ?? data);
      } catch (e) {
        setError(e);

        throw e;
      }
    };

    return f().catch(console.warn);
  }, [entity, page, size]);

  return (
    <div className={styles.container}>
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
      {data?.data instanceof Array ? (
        <div>Total results: {data?.data?.length}</div>
      ) : null}
      <pre className={styles.code}>
        <code>{JSON.stringify(error ?? data, null, 2)}</code>
      </pre>
    </div>
  );
}

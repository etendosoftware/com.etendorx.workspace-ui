import { useCallback, useState } from 'react';
import { Datasource } from '../api/datasource';
import { entities } from '../api/constants';
import styles from './styles.module.css';

export default function DatasourceTest() {
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

  const handleSubmit = useCallback(
    (e: React.SyntheticEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const f = async () => {
        try {
          const _startRow = (page - 1) * size;
          const _endRow = page * size - 1;
          const { response } = await Datasource.get(entity, {
            _startRow: _startRow.toString(),
            _endRow: _endRow.toString(),
          });

          setError(undefined);
          setData(response);
        } catch (e) {
          setError(e);

          throw e;
        }
      };

      return f().catch(console.warn);
    },
    [entity, page, size],
  );

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
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
      <button type="submit" className={styles.button}>
        Load records
      </button>
      {data?.data instanceof Array ? (
        <div>Total results: {data?.data?.length}</div>
      ) : null}
      <pre className={styles.code}>
        <code>{JSON.stringify(error ?? data, null, 2)}</code>
      </pre>
    </form>
  );
}

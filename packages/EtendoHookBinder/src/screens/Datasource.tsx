import { useCallback, useState } from 'react';
import { Datasource } from '../api/datasource';
import styles from './styles.module.css';

export default function DatasourceTest() {
  const [entity, setEntity] = useState('Order');
  const [page, setPage] = useState<number>(1);
  const [size, setSize] = useState<number>(1);
  const [data, setData] = useState<Record<string, unknown | { data: [] }>>();

  const handleEntityChange = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      setEntity(e.currentTarget.value);
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

      const submit = async () => {
        const _startRow = (page - 1) * size;
        const _endRow = page * size - 1;
        const { response } = await Datasource.get(entity, {
          _startRow: _startRow.toString(),
          _endRow: _endRow.toString(),
        });

        setData(response);
      };

      return submit().catch(console.error);
    },
    [entity, page, size],
  );

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <div className={styles.field}>
        <label htmlFor="entity">Entity</label>
        <input
          className={styles.input}
          type="text"
          value={entity}
          onChange={handleEntityChange}
        />
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
        <div className={styles.summary}>
          Total results: {data?.data?.length}
        </div>
      ) : null}
      <textarea
        className={styles.code}
        value={data ? JSON.stringify(data, null, 2) : ''}
        rows={16}
        readOnly
      />
    </form>
  );
}

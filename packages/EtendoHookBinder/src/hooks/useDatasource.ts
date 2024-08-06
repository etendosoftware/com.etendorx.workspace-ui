import { useCallback, useEffect, useMemo, useState } from 'react';
import { Datasource } from '../api/datasource';

export function useDatasource(entity?: string) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    const f = async () => {
      try {
        if (!entity) {
          return;
        }

        setLoading(true);
        setError(undefined);
        const result = await Datasource.get(entity, {
          _startRow: '0',
          _endRow: '10',
        });
        setData(result.response.data);
        setLoaded(true);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    return f();
  }, [entity]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({ loading, data, error, loaded, load }),
    [data, error, loading, loaded, load],
  );
}

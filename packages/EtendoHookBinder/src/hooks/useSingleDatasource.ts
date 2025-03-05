import { useCallback, useEffect, useMemo, useState } from 'react';
import { datasource } from '../api/datasource';

export function useSingleDatasource(entity?: string, id?: string) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [record, setRecord] = useState<Record<string, unknown>>();
  const [error, setError] = useState<Error>();

  const load = useCallback(async () => {
    try {
      if (!entity || !id) {
        setLoaded(true);

        return;
      }

      setError(undefined);
      setLoading(true);

      const response = await datasource.getSingleRecord(entity, id);
      const res = response?.response?.data?.[0];

      setRecord(res);
      setLoaded(true);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [entity, id]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({
      load,
      loading,
      error,
      record,
      loaded,
    }),
    [error, load, loaded, loading, record],
  );
}

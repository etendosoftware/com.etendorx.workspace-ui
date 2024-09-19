import { useCallback, useEffect, useMemo, useState } from 'react';
import { Datasource } from '../api/datasource';

export function useEntityRecord(entity: string, id: string) {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<Error | undefined>(undefined);

  const load = useCallback(async () => {
    try {
      setError(undefined);
      setLoading(true);

      const response = await Datasource.getSingleRecord(entity, id);

      if (response.error) {
        throw new Error(response.error.message);
      } else {
        console.debug(response);

        setData(prev => prev);
        setLoaded(true);
      }
    } catch (e) {
      setError(e as Error);
    }
  }, [entity, id]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({
      loading,
      data,
      error,
      load,
      loaded,
    }),
    [data, error, load, loaded, loading],
  );
}

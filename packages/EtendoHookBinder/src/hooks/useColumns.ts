import { useCallback, useEffect, useMemo, useState } from 'react';
import { Metadata } from '../api/metadata';
import { Field } from '../api/types';

export function useColumns(tabId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Field[]>([]);
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    const _load = async () => {
      if (!tabId) {
        return;
      }

      try {
        setLoading(true);
        setError(undefined);
        setData(Metadata.getColumns(tabId));
        setLoaded(true);
      } catch (e) {
        console.warn((e as Error).message)
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    return _load();
  }, [tabId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({ loading, data, error, loaded, load }),
    [data, error, loading, loaded, load],
  );
}

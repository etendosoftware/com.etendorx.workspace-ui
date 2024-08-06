import { useCallback, useEffect, useMemo, useState } from 'react';
import { Metadata } from '../api/metadata';

export function useColumns(
  tabId: string | undefined,
) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Etendo.Field[]>();
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    const f = async () => {
      if (!tabId) {
        return;
      }

      try {
        setLoading(true);
        setError(undefined);
        setData(await Metadata.getColumns(tabId));
        setLoaded(true);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    return f();
  }, [tabId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({ loading, data, error, loaded, load }),
    [data, error, loading, loaded, load],
  );
}

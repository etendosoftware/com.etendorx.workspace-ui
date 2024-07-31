import { useCallback, useMemo, useState } from 'react';
import { Metadata } from '../api/metadata';

export function useMetadata(windowId: string) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Etendo.Klass>();
  const [error, setError] = useState<Error>();

  const load = useCallback(() => {
    const f = async () => {
      try {
        setLoading(true);
        setError(undefined);
        setData(await Metadata.get(windowId));
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    return f();
  }, [windowId]);

  return useMemo(
    () => ({ loading, data, error, load }),
    [data, error, load, loading],
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Metadata } from '../api/metadata';

type Data = Awaited<ReturnType<typeof Metadata.getWindow>>;

export function useMetadata(
  windowId: string,
  { autoLoad }: { autoLoad?: boolean } = { autoLoad: false },
) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Data>();
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    const f = async () => {
      try {
        setLoading(true);
        setError(undefined);
        setData(await Metadata.getWindow(windowId));
        setLoaded(true);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    return f();
  }, [windowId]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return useMemo(
    () => ({ loading, data, error, loaded, load }),
    [data, error, loading, loaded, load],
  );
}

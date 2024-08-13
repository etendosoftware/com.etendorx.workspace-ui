import { useCallback, useEffect, useMemo, useState } from 'react';
import { Metadata } from '../api/metadata';
import { WindowMetadata } from '../api/types';

export function useWindow(windowId: string) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WindowMetadata>();
  const [error, setError] = useState<Error>();
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    const _load = async () => {
      try {
        setLoading(true);
        setError(undefined);
        setData(await Metadata.getWindow(windowId));
        setLoaded(true);
      } catch (e) {
        console.error((e as Error).message)
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };

    return _load();
  }, [windowId]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(
    () => ({ loading, data, error, loaded, load }),
    [data, error, loading, loaded, load],
  );
}

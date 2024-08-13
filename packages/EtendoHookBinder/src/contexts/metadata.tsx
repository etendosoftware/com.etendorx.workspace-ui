import { createContext, useEffect, useState } from 'react';
import { Metadata } from '../api/metadata';

const ctx = { getWindow: Metadata.getWindow, getColumns: Metadata.getColumns };

export const MetadataContext = createContext(ctx);

export default function MetadataProvider(props: React.PropsWithChildren) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      await Metadata.getWindow('143');
      setReady(true);
    };

    initialize();
  }, []);

  return (
    <MetadataContext.Provider value={ctx}>
      {ready ? props.children : null}
    </MetadataContext.Provider>
  );
}

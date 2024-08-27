import { createContext, useEffect } from 'react';
import { Metadata } from '../api/metadata';

const ctx = { getWindow: Metadata.getWindow, getColumns: Metadata.getColumns };

export const MetadataContext = createContext(ctx);

export default function MetadataProvider({
  children,
  token,
}: React.PropsWithChildren<{ token?: string }>) {
  useEffect(() => {
    if (token) {
      Metadata.authorize(token);
      Metadata.initialize();
    }
  }, [token]);

  return (
    <MetadataContext.Provider value={ctx}>{children}</MetadataContext.Provider>
  );
}

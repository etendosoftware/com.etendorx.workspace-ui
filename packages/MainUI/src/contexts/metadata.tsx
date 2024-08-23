import { createContext, useEffect } from 'react';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { useUserContext } from '../hooks/useUserContext';

const ctx = { getWindow: Metadata.getWindow, getColumns: Metadata.getColumns };

export const MetadataContext = createContext(ctx);

export default function MetadataProvider(props: React.PropsWithChildren) {
  const { token } = useUserContext();

  useEffect(() => {
    if (token) {
      Metadata.authorize(token);
      Metadata.initialize();
    }
  }, [token]);

  return (
    <MetadataContext.Provider value={ctx}>
      {props.children}
    </MetadataContext.Provider>
  );
}

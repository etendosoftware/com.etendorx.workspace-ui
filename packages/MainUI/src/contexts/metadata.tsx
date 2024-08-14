import { createContext } from 'react';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';

const ctx = { getWindow: Metadata.getWindow, getColumns: Metadata.getColumns };

export const MetadataContext = createContext(ctx);

export default function MetadataProvider(props: React.PropsWithChildren) {
  return (
    <MetadataContext.Provider value={ctx}>
      {props.children}
    </MetadataContext.Provider>
  );
}

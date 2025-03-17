'use client';

import { datasource } from '@workspaceui/etendohookbinder/src/api/datasource';
import { Metadata } from '@workspaceui/etendohookbinder/src/api/metadata';
import { createContext, useContext, useEffect } from 'react';

const ApiContext = createContext<string | null>(null);

export function ApiUrlProvider({ url, children }: React.PropsWithChildren<{ url: string }>) {
  useEffect(() => {
    Metadata.setBaseUrl(url);
    datasource.setBaseUrl(url);
  }, [url]);

  return <ApiContext.Provider value={url}>{children}</ApiContext.Provider>;
}

export function useApiContext() {
  const context = useContext(ApiContext);

  if (!context) {
    throw new Error('useApiContext debe usarse dentro de <ApiUrlProvider>');
  }

  return context;
}

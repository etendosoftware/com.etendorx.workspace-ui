import { createContext, useCallback, useMemo, useState } from 'react';
import {
  type Etendo,
  Metadata,
} from '@workspaceui/etendohookbinder/src/api/metadata';
import { useParams } from 'react-router-dom';
import { useWindow } from '@workspaceui/etendohookbinder/src/hooks/useWindow';
import { buildColumnsData, groupTabsByLevel } from '../utils/metadata';
import { Tab } from '@workspaceui/etendohookbinder/src/api/types';

interface IMetadataContext {
  getWindow: (windowId: string) => Promise<Etendo.WindowMetadata>;
  getColumns: (tabId: string) => Etendo.Column[];
  windowId: string;
  recordId: string;
  loading: boolean;
  error: Error | undefined;
  groupedTabs: Etendo.Tab[][];
  windowData?: Etendo.WindowMetadata;
  columnsData?: Record<number, Record<string, Etendo.Column[]>>;
  selectRecord: (record: Record<string, never>, tab: Tab) => void;
  selected: Record<string, Record<string, never>>;
}

export const MetadataContext = createContext({} as IMetadataContext);

export default function MetadataProvider({
  children,
}: React.PropsWithChildren) {
  const { windowId = '', recordId = '' } = useParams();
  const { windowData, loading, error } = useWindow(windowId);
  const [selected, setSelected] = useState<IMetadataContext['selected']>({});

  const selectRecord: IMetadataContext['selectRecord'] = useCallback(
    (record, tab) => {
      const level = tab.level;
      const max = Object.keys(selected).reduce((max, strLevel) => {
        return Math.max(max, parseInt(strLevel));
      }, 0);

      setSelected(prev => {
        for (let index = max; index > level; index--) {
          delete prev[index];
        }

        return { ...prev, [level]: record };
      });
    },
    [selected],
  );

  const groupedTabs = useMemo(() => groupTabsByLevel(windowData), [windowData]);
  const columnsData = useMemo(() => buildColumnsData(windowData), [windowData]);

  const value = useMemo(
    () => ({
      getWindow: Metadata.getWindow,
      getColumns: Metadata.getColumns,
      windowId,
      recordId,
      loading,
      error,
      groupedTabs,
      windowData,
      columnsData,
      selectRecord,
      selected,
    }),
    [
      windowId,
      recordId,
      loading,
      error,
      groupedTabs,
      windowData,
      columnsData,
      selectRecord,
      selected,
    ],
  );

  return (
    <MetadataContext.Provider value={value}>
      {children}
    </MetadataContext.Provider>
  );
}

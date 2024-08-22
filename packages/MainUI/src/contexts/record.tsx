import { createContext, useState, useMemo } from 'react';

export const RecordContext = createContext({
  selectedRecord: undefined,
  setSelectedRecord: _r => {
    _r;
  },
});

export default function RecordProvider({ children }: React.PropsWithChildren) {
  const [selectedRecord, setSelectedRecord] = useState(undefined);

  const value = useMemo(
    () => ({
      selectedRecord,
      setSelectedRecord,
    }),
    [selectedRecord, setSelectedRecord],
  );

  return (
    <RecordContext.Provider value={value}>{children}</RecordContext.Provider>
  );
}

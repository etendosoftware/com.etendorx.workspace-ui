import { useContext } from 'react';
import { RecordContext } from '../contexts/record';

export function useRecordContext() {
  const context = useContext(RecordContext);

  if (context === undefined) {
    throw new Error('useRecordContext must be used within a RecordProvider');
  }

  return context;
}

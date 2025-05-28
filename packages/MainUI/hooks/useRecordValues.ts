import { useMemo } from 'react';
import { useTabContext } from '@/contexts/tab';
import { buildPayloadByInputName } from '@/utils';

const FALLBACK_RESULT = {};

export default function useRecordValues() {
  const { tab, record } = useTabContext();

  return useMemo(() => (record ? buildPayloadByInputName(record, tab.fields) : FALLBACK_RESULT), [record, tab.fields]);
}

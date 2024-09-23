import { Tab } from '@workspaceui/etendohookbinder/src/api/types';
import { useCallback } from 'react';
import { useRecordContext } from '../../hooks/useRecordContext';
import DynamicTable from '../../components/DynamicTable';
import { useNavigate } from 'react-router-dom';

export default function Content({ tab }: { tab: Tab }) {
  const { selectRecord } = useRecordContext();
  const navigate = useNavigate();

  const handleSelect = useCallback(
    (record: unknown) => {
      selectRecord(record, tab);
    },
    [selectRecord, tab],
  );

  const handleDoubleClick = useCallback(
    (record: Record<string, string>) => {
      selectRecord(record, tab);
      navigate(record.id);
    },
    [navigate, selectRecord, tab],
  );

  return (
    <DynamicTable
      tab={tab}
      onSelect={handleSelect}
      onDoubleClick={handleDoubleClick}
    />
  );
}

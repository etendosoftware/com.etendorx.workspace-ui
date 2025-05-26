import { useTranslation } from '@/hooks/useTranslation';
import { EntityData } from '@workspaceui/etendohookbinder/src/api/types';
import { MRT_TableInstance } from 'material-react-table';

const EmptyState = ({ table }: { table: MRT_TableInstance<EntityData> }) => {
  const { t } = useTranslation();
  const maxWidth = table.refs.tableContainerRef.current?.clientWidth;

  return (
    <span className="text-center py-8" style={{ maxWidth }}>
      <div className="w-16 h-8 text-gray-300"></div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('table.labels.emptyRecords')}</h3>
      <p className="text-sm text-gray-500 mb-4">{t('status.noRecords')}</p>
    </span>
  );
};

export default EmptyState;

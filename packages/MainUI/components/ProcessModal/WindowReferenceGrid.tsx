import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import Loading from '../loading';
import { useDatasource } from '@workspaceui/etendohookbinder/src/hooks/useDatasource';
import type { EntityData, EntityValue, ProcessParameter } from '@workspaceui/etendohookbinder/src/api/types';

interface WindowReferenceGridProps {
  parameter: ProcessParameter;
  onSelectionChange: (selection: unknown[]) => void;
  recordId?: EntityValue;
  tabId: string;
  windowId?: string;
}

function WindowReferenceGrid({ parameter, onSelectionChange, tabId, windowId }: WindowReferenceGridProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const datasourceOptions = useMemo(
    () => ({
      windowId: windowId || '',
      tabId,
      pageSize: 100,
    }),
    [windowId, tabId],
  );

  const { records, loading, error } = useDatasource('Order', datasourceOptions);

  const displayFields = useMemo(() => {
    if (!records || records.length === 0) return [];

    const firstRecord = records[0];
    const fieldNames = Object.keys(firstRecord)
      .filter(key => !['id', '_identifier'].includes(key) && !key.startsWith('$') && !key.startsWith('_'))
      .slice(0, 6);

    return fieldNames;
  }, [records]);

  useEffect(() => {
    setSelected({});
    onSelectionChange([]);
  }, [records, onSelectionChange]);

  const handleSelectItem = (item: EntityData, isSelected: boolean) => {
    setSelected(prev => {
      const newSelection = { ...prev };
      const itemId = typeof item.id === 'string' ? item.id : String(item.id);
      newSelection[itemId] = isSelected;

      const selectedItems = records.filter(record => {
        const recordId = typeof record.id === 'string' ? record.id : String(record.id);
        return newSelection[recordId];
      });

      onSelectionChange(selectedItems);

      return newSelection;
    });
  };

  const handleUnselectAll = useCallback(() => {
    setSelected({});
    onSelectionChange([]);
  }, [onSelectionChange]);

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {t('errors.missingData')}: {error.message}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return <div className="p-4 text-center text-gray-500">{t('common.noDataAvailable')}</div>;
  }

  return (
    <div className="mt-4 mb-6">
      <h4 className="font-medium mb-2">{parameter.name}</h4>
      <div className="border rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    onChange={handleUnselectAll}
                    checked={
                      records.length > 0 &&
                      records.every(item => {
                        const itemId = typeof item.id === 'string' ? item.id : String(item.id);
                        return selected[itemId];
                      })
                    }
                  />
                </th>
                {displayFields.map(field => (
                  <th
                    key={field}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {field}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map(item => {
                const itemId = typeof item.id === 'string' ? item.id : String(item.id);
                return (
                  <tr key={itemId} className={selected[itemId] ? 'bg-gray-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        checked={!!selected[itemId]}
                        onChange={e => handleSelectItem(item, e.target.checked)}
                      />
                    </td>
                    {displayFields.map(field => (
                      <td key={`${itemId}-${field}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item[field] !== undefined ? String(item[field]) : ''}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WindowReferenceGrid;

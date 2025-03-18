import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import Select from './components/Select';
import { useMemo, useCallback } from 'react';
import { useTableDirDatasource } from '@/hooks/datasource/useTableDirDatasource';
import { SelectProps } from './components/types';
import { useFormContext } from 'react-hook-form';

export const SelectSelector = ({
  field,
  isReadOnly,
  pageSize = 20,
  initialPageSize = 20,
}: {
  field: Field;
  isReadOnly: boolean;
  pageSize?: number;
  initialPageSize?: number;
}) => {
  const idKey = (field.selector?.valueField ?? '') as string;
  const identifierKey = (field.selector?.displayField ?? '') as string;
  const { watch } = useFormContext();
  const name = field.hqlName;
  const currentValue = watch(name);
  const currentIdentifier = watch(name + '_identifier');

  const { records, loading, refetch, loadMore, hasMore } = useTableDirDatasource({
    field,
    pageSize,
    initialPageSize,
  });

  const options = useMemo<SelectProps['options']>(() => {
    const result: SelectProps['options'] = [];

    if (currentValue && currentIdentifier) {
      result.push({
        id: currentValue,
        label: currentIdentifier,
      });
    }

    records.forEach(record => {
      const label = record[identifierKey] as string;
      const id = record[idKey] as string;

      if (id && label) {
        result.push({ id, label });
      }
    });

    return result;
  }, [currentIdentifier, currentValue, idKey, identifierKey, records]);

  const handleFocus = useCallback(() => {
    refetch(true);
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    loadMore();
  }, [loadMore]);

  return (
    <Select
      name={field.hqlName}
      options={options}
      isReadOnly={isReadOnly}
      onFocus={handleFocus}
      onLoadMore={handleLoadMore}
      loading={loading}
      hasMore={hasMore}
    />
  );
};

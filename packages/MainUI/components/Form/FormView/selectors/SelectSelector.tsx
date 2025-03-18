import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import Select from './components/Select';
import { useMemo, useCallback } from 'react';
import { useTableDirDatasource } from '@/hooks/datasource/useTableDirDatasource';
import { SelectProps } from './components/types';

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

  const { records, loading, refetch, loadMore, hasMore } = useTableDirDatasource({
    field,
    pageSize,
    initialPageSize,
  });

  const options = useMemo<SelectProps['options']>(() => {
    const result: SelectProps['options'] = [];

    records.forEach(record => {
      const label = record[identifierKey] as string;
      const id = record[idKey] as string;

      if (id && label) {
        result.push({ id, label });
      }
    });

    return result;
  }, [idKey, identifierKey, records]);

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

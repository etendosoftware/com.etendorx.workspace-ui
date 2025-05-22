import { Field } from '@workspaceui/etendohookbinder/src/api/types';
import Select from '@/components/Form/FormView/selectors/components/Select';
import { useTableDirDatasource } from '@/hooks/datasource/useTableDirDatasource';
import { useSelectFieldOptions } from '@/hooks/useSelectFieldOptions';

export const TableDirSelector = ({ field, isReadOnly }: { field: Field; isReadOnly: boolean }) => {
  const { records, loading, refetch, loadMore, hasMore, search } = useTableDirDatasource({ field });
  const options = useSelectFieldOptions(field, records);

  return (
    <Select
      name={field.hqlName}
      options={options}
      onFocus={refetch}
      onSearch={search}
      isReadOnly={isReadOnly}
      field={field}
      onLoadMore={loadMore}
      loading={loading}
      hasMore={hasMore}
    />
  );
};

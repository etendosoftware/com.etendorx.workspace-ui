import type { Field } from "@workspaceui/etendohookbinder/src/api/types";
import Select from "./components/Select";
import { useSelectFieldOptions } from "@/hooks/useSelectFieldOptions";
import { useProductDatasource } from "@/hooks/datasource/useProductDatasource";

export const ProductSelector = ({ field, isReadOnly }: { field: Field; isReadOnly: boolean }) => {
  const { records, loading, refetch, loadMore, hasMore, search } = useProductDatasource({ field });
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

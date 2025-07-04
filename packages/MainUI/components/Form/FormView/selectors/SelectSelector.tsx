import type { Field } from "@workspaceui/api-client/src/api/types";
import Select from "./components/Select";
import { useSelectFieldOptions } from "@/hooks/useSelectFieldOptions";
import { useTableDirDatasource } from "@/hooks/datasource/useTableDirDatasource";

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
  const { records, loading, refetch, loadMore, hasMore } = useTableDirDatasource({ field, pageSize, initialPageSize });
  const options = useSelectFieldOptions(field, records);

  return (
    <Select
      name={field.hqlName}
      options={options}
      isReadOnly={isReadOnly}
      onFocus={refetch}
      onLoadMore={loadMore}
      loading={loading}
      hasMore={hasMore}
      field={field}
    />
  );
};

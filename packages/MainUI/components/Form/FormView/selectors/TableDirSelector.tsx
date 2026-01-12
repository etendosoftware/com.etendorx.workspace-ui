/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import type { Field } from "@workspaceui/api-client/src/api/types";
import Select from "@/components/Form/FormView/selectors/components/Select/Select";
import { useTableDirDatasource } from "@/hooks/datasource/useTableDirDatasource";
import { useSelectFieldOptions } from "@/hooks/useSelectFieldOptions";

export const TableDirSelector = ({
  field,
  isReadOnly,
  isProcessModal,
  staticOptions,
}: {
  field: Field;
  isReadOnly: boolean;
  isProcessModal?: boolean;
  staticOptions?: Array<{ id: string; name: string }>;
}) => {
  const { records, loading, refetch, loadMore, hasMore, search } = useTableDirDatasource({
    field,
    isProcessModal,
    staticOptions,
  });
  const options = useSelectFieldOptions(field, records);

  return (
    <Select
      name={field.hqlName || field.columnName || field.name}
      options={options}
      onFocus={refetch}
      onSearch={search}
      isReadOnly={isReadOnly}
      field={field}
      onLoadMore={loadMore}
      loading={loading}
      hasMore={hasMore}
      data-testid="Select__2e8a5b"
    />
  );
};

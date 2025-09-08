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

// @data-testid-ignore
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
      data-testid={`Select__${field.id ?? field.hqlName ?? "d5687c"}`}
    />
  );
};

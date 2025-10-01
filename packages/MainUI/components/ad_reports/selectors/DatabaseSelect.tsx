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

import { useDatasource } from "@/hooks/useDatasource";
import { useTheme } from "@mui/material";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import Select from "@workspaceui/componentlibrary/src/components/Input/Select";
import type { Option } from "@workspaceui/api-client/src/api/types";
import { memo, useMemo } from "react";
import type { DatabaseSelectSelector } from "../../Form/FormView/types";

const DBSelectSelector = memo(({ value, name, title, onChange, readOnly, entity }: DatabaseSelectSelector) => {
  const theme = useTheme();
  const { records = [], loading } = useDatasource({ entity });

  const options = useMemo<Option<string>[]>(
    () =>
      records.map((record) => ({
        id: String(record.id || ""),
        title: String(record._identifier || record.name || ""),
        value: String(record.id || ""),
      })),
    [records]
  );

  const currentValue = useMemo(() => options.find((opt) => opt.value === value) || null, [options, value]);

  return (
    <Select
      iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} data-testid="SearchOutlined__e699bb" />}
      title={title}
      options={options}
      getOptionLabel={(option) => option.title}
      onChange={(_event, newValue) => onChange(newValue?.value || "")}
      disabled={readOnly || loading}
      name={name}
      value={currentValue}
      data-testid="Select__e699bb"
    />
  );
});

DBSelectSelector.displayName = "DatabaseSelectSelector";

export default DBSelectSelector;

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

import { memo, useCallback, useMemo } from "react";
import Select from "@workspaceui/componentlibrary/src/components/Input/Select";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import type { SelectSelectorProps } from "../../Form/FormView/types";
import { useTheme } from "@mui/material";
import type { Option } from "@workspaceui/api-client/src/api/types";

const SelectSelector = memo(({ value, name, title, onChange, readOnly, field }: SelectSelectorProps) => {
  const theme = useTheme();
  const options = useMemo<Option[]>(
    () =>
      field.refList.map((v) => ({
        id: v.id,
        title: v.label,
        value: v.value,
      })),
    [field.refList]
  );
  const handleChange = useCallback(
    (_: React.SyntheticEvent<Element, Event>, newValue: Option<string> | null) => {
      onChange(newValue?.value || "");
    },
    [onChange]
  );
  const current = useMemo(() => options.find((opt) => opt.value === value), [options, value]);

  return (
    <Select
      iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} data-testid="SearchOutlined__46a88c" />}
      title={title}
      options={options}
      getOptionLabel={(option) => option.title}
      onChange={handleChange}
      disabled={readOnly}
      name={name}
      value={current}
      data-testid="Select__46a88c"
    />
  );
});

SelectSelector.displayName = "SelectSelector";

export default SelectSelector;

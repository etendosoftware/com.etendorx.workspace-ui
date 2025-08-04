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

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "@workspaceui/componentlibrary/src/components/Input/Select";
import SearchOutlined from "@workspaceui/componentlibrary/src/assets/icons/search.svg";
import type { Option } from "@workspaceui/componentlibrary/src/components/Input/Select/types";
import type { ListSelectorProps } from "../../Form/FormView/types";
import { useTheme } from "@mui/material";

const ListSelector: React.FC<ListSelectorProps> = ({ field, value, onChange, readOnly }) => {
  const [selectedValue, setSelectedValue] = useState<Option | null>(() => {
    if (field.refList) {
      const option = field.refList.find((item) => item.value === value);

      if (option) {
        return {
          id: option.id,
          title: option.label,
          value: option.value,
        };
      }
    }

    return null;
  });
  const theme = useTheme();

  const options: Option[] = useMemo(() => {
    if (field.refList) {
      return field.refList.map((item) => ({
        id: item.id,
        title: item.label,
        value: item.value,
      }));
    }
    return [];
  }, [field.refList]);

  useEffect(() => {
    setSelectedValue(options.find((option) => option.value === value) || null);
  }, [value, options]);

  const handleChange = useCallback(
    (_event: React.SyntheticEvent<Element, Event>, newValue: Option | null) => {
      if (newValue) {
        setSelectedValue(newValue);
        onChange(newValue.value);
      }
    },
    [onChange]
  );

  const isOptionEqualToValue = useCallback((option: Option, value: Option) => option.value === value.value, []);

  return (
    <Select
      iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />}
      options={options}
      onChange={handleChange}
      value={selectedValue}
      isOptionEqualToValue={isOptionEqualToValue}
      disabled={readOnly}
    />
  );
};

export default ListSelector;

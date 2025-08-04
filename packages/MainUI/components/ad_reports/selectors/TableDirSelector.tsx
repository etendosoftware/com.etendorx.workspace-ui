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
import Spinner from "@workspaceui/componentlibrary/src/components/Spinner";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Option, TableDirSelectorProps } from "../../Form/FormView/types";

const getOptionLabel = (option: Option) => option.title;

const optionEqualValue = (option: Option, value: { id: string }) => option.id === value.id || option.value === value.id;

const TableDirSelector = ({ onChange, entity, value, name, isReadOnly }: TableDirSelectorProps) => {
  const theme = useTheme();
  const { records, loading, error, loaded } = useDatasource({ entity });
  const [selectedValue, setSelectedValue] = useState<Option | null>(null);

  const options = useMemo(
    () =>
      records.map((record) => ({
        id: record.id as string,
        title: (record._identifier || record.name || record.id) as string,
        value: record.id as string,
      })),
    [records]
  );

  useEffect(() => {
    // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
    let option;

    if (value && options.length > 0) {
      option = options.find((opt) => {
        if (typeof value === "object" && "id" in value) {
          return opt.id === value.id || opt.value === value.id;
        }
        return opt.id === String(value) || opt.value === String(value);
      });
    }

    setSelectedValue(option ?? null);
  }, [value, options]);

  const handleChange = useCallback(
    (_event: React.SyntheticEvent<Element, Event>, newValue: Option | null) => {
      setSelectedValue(newValue);
      if (newValue) {
        onChange(newValue.id);
      }
    },
    [onChange]
  );

  if (loading || !loaded) return <Spinner />;
  if (error) return <div>Error: {error?.message}</div>;

  return (
    <Select
      iconLeft={<SearchOutlined fill={theme.palette.baselineColor.neutral[90]} />}
      options={options}
      onChange={handleChange}
      value={selectedValue}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={optionEqualValue}
      name={name}
      disabled={isReadOnly}
    />
  );
};

export default TableDirSelector;
